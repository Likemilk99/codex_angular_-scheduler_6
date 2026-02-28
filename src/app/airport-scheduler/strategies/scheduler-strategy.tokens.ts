import { InjectionToken } from '@angular/core';
import {
  ColorRules,
  DragDropCommand,
  RenderedEvent,
  SchedulerEvent,
  SchedulerSection,
  TimeRange
} from '../domain/scheduler.models';

export interface EventColorStrategy {
  resolve(event: SchedulerEvent, rules: ColorRules): { color: string; textColor: string };
}

export interface RenderingStrategy {
  renderMainEvents(events: readonly SchedulerEvent[], sections: readonly SchedulerSection[], rules: ColorRules): readonly RenderedEvent[];
  renderHoldEvents(events: readonly SchedulerEvent[], rules: ColorRules): readonly RenderedEvent[];
}

export interface DragDropStrategy {
  buildCommand(args: {
    eventId: string;
    source: 'hold' | 'main';
    targetSection: string | null;
    targetRange: TimeRange;
  }): DragDropCommand;
}

export interface TimezoneStrategy {
  apply(range: TimeRange, timezone: string): TimeRange;
}

export const EVENT_COLOR_STRATEGY = new InjectionToken<EventColorStrategy>('EVENT_COLOR_STRATEGY');
export const RENDERING_STRATEGY = new InjectionToken<RenderingStrategy>('RENDERING_STRATEGY');
export const DRAG_DROP_STRATEGY = new InjectionToken<DragDropStrategy>('DRAG_DROP_STRATEGY');
export const TIMEZONE_STRATEGY = new InjectionToken<TimezoneStrategy>('TIMEZONE_STRATEGY');
