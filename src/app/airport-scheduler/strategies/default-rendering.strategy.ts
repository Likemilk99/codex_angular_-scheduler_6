import { Injectable, Inject } from '@angular/core';
import { ColorRules, RenderedEvent, SchedulerEvent, SchedulerSection } from '../domain/scheduler.models';
import { EVENT_COLOR_STRATEGY, EventColorStrategy, RenderingStrategy } from './scheduler-strategy.tokens';

@Injectable()
export class DefaultRenderingStrategy implements RenderingStrategy {
  constructor(@Inject(EVENT_COLOR_STRATEGY) private readonly colorStrategy: EventColorStrategy) {}

  renderMainEvents(
    events: readonly SchedulerEvent[],
    sections: readonly SchedulerSection[],
    rules: ColorRules
  ): readonly RenderedEvent[] {
    const sectionSet = new Set(sections.map((section) => section.key));

    return events
      .filter((event) => event.driverId !== null && sectionSet.has(event.driverId))
      .map((event) => {
        const resolved = this.colorStrategy.resolve(event, rules);

        return {
          id: event.id,
          text: event.title,
          startDate: event.range.from,
          endDate: event.range.to,
          sectionId: event.driverId ?? 'unassigned',
          color: resolved.color,
          textColor: resolved.textColor
        };
      });
  }

  renderHoldEvents(events: readonly SchedulerEvent[], rules: ColorRules): readonly RenderedEvent[] {
    return events.map((event) => {
      const resolved = this.colorStrategy.resolve(event, rules);
      return {
        id: event.id,
        text: event.holdReason ? `${event.title} • ${event.holdReason}` : event.title,
        startDate: event.range.from,
        endDate: event.range.to,
        sectionId: 'hold',
        color: resolved.color,
        textColor: resolved.textColor
      };
    });
  }
}
