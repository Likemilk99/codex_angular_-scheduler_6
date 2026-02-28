import { Injectable } from '@angular/core';
import { TimeRange } from '../domain/scheduler.models';
import { TimezoneStrategy } from './scheduler-strategy.tokens';

@Injectable()
export class DefaultTimezoneStrategy implements TimezoneStrategy {
  apply(range: TimeRange, timezone: string): TimeRange {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return {
      from: this.toIsoLike(formatter, range.from),
      to: this.toIsoLike(formatter, range.to)
    };
  }

  private toIsoLike(formatter: Intl.DateTimeFormat, sourceIso: string): string {
    const parts = formatter.formatToParts(new Date(sourceIso));
    const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '00';

    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
  }
}
