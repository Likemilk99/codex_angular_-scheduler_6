import { Injectable } from '@angular/core';
import { ColorRules, SchedulerEvent } from '../domain/scheduler.models';
import { EventColorStrategy } from './scheduler-strategy.tokens';

@Injectable()
export class DefaultEventColorStrategy implements EventColorStrategy {
  resolve(event: SchedulerEvent, rules: ColorRules): { color: string; textColor: string } {
    const matchedRule = rules.rules.find(
      (rule) =>
        (rule.eventType === undefined || rule.eventType === event.type) &&
        (rule.priority === undefined || rule.priority === event.priority)
    );

    return {
      color: matchedRule?.color ?? rules.fallbackColor,
      textColor: matchedRule?.textColor ?? rules.fallbackTextColor
    };
  }
}
