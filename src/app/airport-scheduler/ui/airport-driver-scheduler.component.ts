import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Observable } from 'rxjs';
import {
  ColorRules,
  DriverResource,
  SchedulerInitData,
  UserPreferences,
  WebSocketUpdate
} from '../domain/scheduler.models';
import { SchedulerFacadeService } from '../facade/scheduler-facade.service';
import { DhtmlxSchedulerAdapter } from '../infra/dhtmlx-scheduler-adapter.service';
import { SchedulerStateService } from '../state/scheduler-state.service';
import { DefaultDragDropStrategy } from '../strategies/default-drag-drop.strategy';
import { DefaultEventColorStrategy } from '../strategies/default-event-color.strategy';
import { DefaultRenderingStrategy } from '../strategies/default-rendering.strategy';
import { DefaultTimezoneStrategy } from '../strategies/default-timezone.strategy';
import {
  DRAG_DROP_STRATEGY,
  EVENT_COLOR_STRATEGY,
  RENDERING_STRATEGY,
  TIMEZONE_STRATEGY
} from '../strategies/scheduler-strategy.tokens';

@Component({
  selector: 'app-airport-driver-scheduler',
  templateUrl: './airport-driver-scheduler.component.html',
  styleUrls: ['./airport-driver-scheduler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SchedulerStateService,
    SchedulerFacadeService,
    DhtmlxSchedulerAdapter,
    { provide: EVENT_COLOR_STRATEGY, useClass: DefaultEventColorStrategy },
    { provide: RENDERING_STRATEGY, useClass: DefaultRenderingStrategy },
    { provide: DRAG_DROP_STRATEGY, useClass: DefaultDragDropStrategy },
    { provide: TIMEZONE_STRATEGY, useClass: DefaultTimezoneStrategy }
  ]
})
export class AirportDriverSchedulerComponent implements OnInit, OnChanges {
  @Input({ required: true }) data!: SchedulerInitData;
  @Input({ required: true }) updates!: Observable<WebSocketUpdate>;
  @Input({ required: true }) resources!: readonly DriverResource[];
  @Input({ required: true }) user_preferences!: UserPreferences;
  @Input({ required: true }) color_rules!: ColorRules;

  @ViewChild('mainSchedulerHost', { static: true })
  mainSchedulerHost!: ElementRef<HTMLElement>;

  @ViewChild('holdSchedulerHost', { static: true })
  holdSchedulerHost!: ElementRef<HTMLElement>;

  readonly vm$ = this.facade.vm$;

  constructor(private readonly facade: SchedulerFacadeService) {}

  ngOnInit(): void {
    this.facade.initialize(
      this.data,
      this.resources,
      this.user_preferences,
      this.color_rules,
      this.updates,
      this.mainSchedulerHost.nativeElement,
      this.holdSchedulerHost.nativeElement
    );

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resources']?.currentValue) {
      this.facade.updateResources(this.resources);
    }

    if (changes['color_rules']?.currentValue) {
      this.facade.updateColorRules(this.color_rules);
    }

    if (changes['user_preferences']?.currentValue) {
      this.facade.updateTimezone(this.user_preferences.timezone);
    }
  }

}
