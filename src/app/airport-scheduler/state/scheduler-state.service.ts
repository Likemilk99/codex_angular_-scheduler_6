import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
  ColorRules,
  DriverResource,
  DriverShift,
  SchedulerEvent,
  SchedulerInitData,
  SchedulerVm,
  TimeRange,
  UserPreferences
} from '../domain/scheduler.models';

interface SchedulerState {
  readonly events: readonly SchedulerEvent[];
  readonly holdEvents: readonly SchedulerEvent[];
  readonly shifts: readonly DriverShift[];
  readonly resources: readonly DriverResource[];
  readonly timezone: string;
  readonly selectedRange: TimeRange;
  readonly colorRules: ColorRules;
}

const EMPTY_COLOR_RULES: ColorRules = {
  fallbackColor: '#5e6ad2',
  fallbackTextColor: '#ffffff',
  rules: []
};

const INITIAL_STATE: SchedulerState = {
  events: [],
  holdEvents: [],
  shifts: [],
  resources: [],
  timezone: 'UTC',
  selectedRange: {
    from: new Date(0).toISOString(),
    to: new Date(0).toISOString()
  },
  colorRules: EMPTY_COLOR_RULES
};

@Injectable()
export class SchedulerStateService {
  private readonly stateSubject = new BehaviorSubject<SchedulerState>(INITIAL_STATE);

  readonly state$ = this.stateSubject.asObservable();

  readonly vm$: Observable<SchedulerVm> = this.state$.pipe(
    map((state) => ({
      range: state.selectedRange,
      timezone: state.timezone,
      resources: state.resources,
      shifts: state.shifts,
      mainEvents: state.events,
      holdEvents: state.holdEvents
    })),
    distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current))
  );

  readonly timezone$ = this.select((state) => state.timezone);
  readonly colorRules$ = this.select((state) => state.colorRules);
  readonly resources$ = this.select((state) => state.resources);
  readonly events$ = this.select((state) => state.events);
  readonly holdEvents$ = this.select((state) => state.holdEvents);

  initialize(data: SchedulerInitData, resources: readonly DriverResource[], preferences: UserPreferences, colorRules: ColorRules): void {
    this.patchState({
      events: [...data.events],
      holdEvents: [...data.holdEvents],
      shifts: [...data.shifts],
      resources: [...resources],
      timezone: preferences.timezone,
      selectedRange: data.range,
      colorRules
    });
  }

  upsertEvent(event: SchedulerEvent): void {
    const state = this.stateSubject.value;
    const target = event.driverId === null ? state.holdEvents : state.events;
    const updated = this.upsertById(target, event);

    if (event.driverId === null) {
      this.patchState({ holdEvents: updated, events: state.events.filter((item) => item.id !== event.id) });
      return;
    }

    this.patchState({ events: updated, holdEvents: state.holdEvents.filter((item) => item.id !== event.id) });
  }

  deleteEvent(eventId: string): void {
    const state = this.stateSubject.value;
    this.patchState({
      events: state.events.filter((event) => event.id !== eventId),
      holdEvents: state.holdEvents.filter((event) => event.id !== eventId)
    });
  }

  upsertShift(shift: DriverShift): void {
    this.patchState({ shifts: this.upsertById(this.stateSubject.value.shifts, shift) });
  }

  upsertResource(resource: DriverResource): void {
    this.patchState({ resources: this.upsertById(this.stateSubject.value.resources, resource) });
  }

  setTimezone(timezone: string): void {
    this.patchState({ timezone });
  }

  setColorRules(colorRules: ColorRules): void {
    this.patchState({ colorRules });
  }

  setResources(resources: readonly DriverResource[]): void {
    this.patchState({ resources: [...resources] });
  }

  findEventById(eventId: string): SchedulerEvent | null {
    const state = this.stateSubject.value;
    return [...state.events, ...state.holdEvents].find((event) => event.id === eventId) ?? null;
  }

  private select<T>(projector: (state: SchedulerState) => T): Observable<T> {
    return this.state$.pipe(
      map(projector),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current))
    );
  }

  private patchState(patch: Partial<SchedulerState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...patch });
  }

  private upsertById<T extends { readonly id: string }>(collection: readonly T[], item: T): readonly T[] {
    const index = collection.findIndex((entry) => entry.id === item.id);
    if (index < 0) {
      return [...collection, item];
    }

    return [...collection.slice(0, index), item, ...collection.slice(index + 1)];
  }
}
