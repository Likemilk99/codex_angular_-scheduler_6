import { Inject, Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import {
  ColorRules,
  DriverResource,
  SchedulerInitData,
  SchedulerSection,
  SchedulerVm,
  UserPreferences,
  WebSocketUpdate
} from '../domain/scheduler.models';
import { DhtmlxSchedulerAdapter } from '../infra/dhtmlx-scheduler-adapter.service';
import { SchedulerStateService } from '../state/scheduler-state.service';
import {
  DRAG_DROP_STRATEGY,
  DragDropStrategy,
  RENDERING_STRATEGY,
  RenderingStrategy,
  TIMEZONE_STRATEGY,
  TimezoneStrategy
} from '../strategies/scheduler-strategy.tokens';

@Injectable()
export class SchedulerFacadeService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private disposed = false;
  readonly vm$: Observable<SchedulerVm> = this.state.vm$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor(
    private readonly state: SchedulerStateService,
    private readonly adapter: DhtmlxSchedulerAdapter,
    @Inject(RENDERING_STRATEGY) private readonly renderingStrategy: RenderingStrategy,
    @Inject(DRAG_DROP_STRATEGY) private readonly dragDropStrategy: DragDropStrategy,
    @Inject(TIMEZONE_STRATEGY) private readonly timezoneStrategy: TimezoneStrategy
  ) {}

  initialize(
    data: SchedulerInitData,
    resources: readonly DriverResource[],
    preferences: UserPreferences,
    colorRules: ColorRules,
    updates$: Observable<WebSocketUpdate>,
    mainContainer: HTMLElement,
    holdContainer: HTMLElement
  ): void {
    this.state.initialize(data, resources, preferences, colorRules);
    this.adapter.init(mainContainer, holdContainer);
    this.bindRenderPipeline();
    this.bindDragDropPipeline();
    this.bindWebsocketPipeline(updates$);
    this.bindTimezonePipeline();
  }

  updateResources(resources: readonly DriverResource[]): void { this.state.setResources(resources); }
  updateColorRules(colorRules: ColorRules): void { this.state.setColorRules(colorRules); }
  updateTimezone(timezone: string): void { this.state.setTimezone(timezone); }

  private bindRenderPipeline(): void {
    combineLatest([this.state.events$, this.state.holdEvents$, this.state.resources$, this.state.colorRules$])
      .pipe(
        map(([mainEvents, holdEvents, resources, colorRules]) => {
          const sections: readonly SchedulerSection[] = resources
            .filter((resource) => resource.active)
            .map((resource) => ({ key: resource.id, label: resource.label }));

          return {
            sections,
            mainEvents: this.renderingStrategy.renderMainEvents(mainEvents, sections, colorRules),
            holdEvents: this.renderingStrategy.renderHoldEvents(holdEvents, colorRules)
          };
        }),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(({ sections, mainEvents, holdEvents }) => {
        this.adapter.setSections(sections);
        this.adapter.setMainData(mainEvents);
        this.adapter.setHoldData(holdEvents);
      });
  }

  private bindDragDropPipeline(): void {
    this.adapter
      .attachDragHandlers()
      .pipe(
        map((payload) =>
          this.dragDropStrategy.buildCommand({
            eventId: payload.eventId,
            source: payload.source,
            targetSection: payload.targetSection,
            targetRange: { from: payload.from, to: payload.to }
          })
        ),
        withLatestFrom(this.vm$),
        takeUntil(this.destroy$)
      )
      .subscribe(([command, vm]) => {
        const existingEvent = [...vm.mainEvents, ...vm.holdEvents].find((event) => event.id === command.eventId);
        if (!existingEvent) {
          return;
        }
        this.state.upsertEvent({ ...existingEvent, driverId: command.targetDriverId, range: command.targetRange });
      });
  }

  private bindWebsocketPipeline(updates$: Observable<WebSocketUpdate>): void {
    updates$.pipe(takeUntil(this.destroy$)).subscribe((update) => {
      switch (update.type) {
        case 'event.created':
        case 'event.updated':
          this.state.upsertEvent(update.payload);
          break;
        case 'event.deleted':
          this.state.deleteEvent(update.payload.eventId);
          break;
        case 'shift.updated':
          this.state.upsertShift(update.payload);
          break;
        case 'resource.updated':
          this.state.upsertResource(update.payload);
          break;
        case 'timezone.changed':
          this.state.setTimezone(update.payload.timezone);
          break;
      }
    });
  }

  private bindTimezonePipeline(): void {
    this.state.timezone$
      .pipe(
        distinctUntilChanged(),
        switchMap((timezone) => this.state.vm$.pipe(map((vm) => ({ timezone, range: this.timezoneStrategy.apply(vm.range, timezone) })))),
        takeUntil(this.destroy$)
      )
      .subscribe(({ timezone }) => {
        this.adapter.applyTimezone(timezone);
      });
  }

  destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.destroy$.next();
    this.destroy$.complete();
    this.adapter.destroy();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
