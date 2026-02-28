import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RenderedEvent, SchedulerSection } from '../domain/scheduler.models';

export interface SchedulerDragPayload {
  readonly eventId: string;
  readonly source: 'hold' | 'main';
  readonly targetSection: string | null;
  readonly from: string;
  readonly to: string;
}

interface SchedulerInstance {
  init(container: HTMLElement, date: Date, mode: string): void;
  clearAll(): void;
  parse(data: readonly Record<string, unknown>[]): void;
  updateCollection?(key: string, collection: readonly Record<string, unknown>[]): void;
  attachEvent(name: string, callback: (...args: readonly unknown[]) => unknown): string;
  detachEvent(handlerId: string): void;
  destructor?(): void;
  config: Record<string, unknown>;
}

interface SchedulerFactory {
  getSchedulerInstance?(): SchedulerInstance;
}

declare const Scheduler: SchedulerInstance & SchedulerFactory;
declare const scheduler: SchedulerInstance & SchedulerFactory;

@Injectable()
export class DhtmlxSchedulerAdapter {
  private readonly mainScheduler = this.createSchedulerInstance();
  private readonly holdScheduler = this.createSchedulerInstance();
  private mainDragHandlerId: string | null = null;
  private holdDragHandlerId: string | null = null;

  init(mainContainer: HTMLElement, holdContainer: HTMLElement): void {
    this.mainScheduler.init(mainContainer, new Date(), 'timeline');
    this.holdScheduler.init(holdContainer, new Date(), 'units');
  }

  destroy(): void {
    this.detachHandlers();
    this.mainScheduler.clearAll();
    this.holdScheduler.clearAll();
    this.mainScheduler.destructor?.();
    this.holdScheduler.destructor?.();
  }

  setMainData(events: readonly RenderedEvent[]): void {
    this.mainScheduler.clearAll();
    this.mainScheduler.parse(events.map((event) => this.toDhtmlxEvent(event)));
  }

  setHoldData(events: readonly RenderedEvent[]): void {
    this.holdScheduler.clearAll();
    this.holdScheduler.parse(events.map((event) => this.toDhtmlxEvent(event)));
  }

  updateEvent(event: RenderedEvent, target: 'main' | 'hold'): void {
    const scheduler = target === 'main' ? this.mainScheduler : this.holdScheduler;
    scheduler.parse([this.toDhtmlxEvent(event)]);
  }

  applyTimezone(timezone: string): void {
    this.mainScheduler.config['server_utc'] = true;
    this.holdScheduler.config['server_utc'] = true;
    this.mainScheduler.config['timezone'] = timezone;
    this.holdScheduler.config['timezone'] = timezone;
  }

  setSections(sections: readonly SchedulerSection[]): void {
    this.mainScheduler.updateCollection?.(
      'timelineSections',
      sections.map((section) => ({ key: section.key, label: section.label }))
    );
  }

  attachDragHandlers(): Observable<SchedulerDragPayload> {
    return new Observable<SchedulerDragPayload>((subscriber) => {
      this.mainDragHandlerId = this.mainScheduler.attachEvent('onDragEnd', (...args) => {
        subscriber.next(this.toDragPayload(args, 'main'));
        return true;
      });

      this.holdDragHandlerId = this.holdScheduler.attachEvent('onDragEnd', (...args) => {
        subscriber.next(this.toDragPayload(args, 'hold'));
        return true;
      });

      return () => this.detachHandlers();
    });
  }

  private toDhtmlxEvent(event: RenderedEvent): Record<string, unknown> {
    return {
      id: event.id,
      text: event.text,
      start_date: event.startDate,
      end_date: event.endDate,
      section_id: event.sectionId,
      color: event.color,
      textColor: event.textColor
    };
  }

  private toDragPayload(args: readonly unknown[], source: 'hold' | 'main'): SchedulerDragPayload {
    const [eventId, _mode, nativeEvent] = args;
    return {
      eventId: String(eventId),
      source,
      targetSection: this.extractSection(nativeEvent),
      from: this.extractDate(nativeEvent, 'start_date'),
      to: this.extractDate(nativeEvent, 'end_date')
    };
  }

  private detachHandlers(): void {
    if (this.mainDragHandlerId) {
      this.mainScheduler.detachEvent(this.mainDragHandlerId);
      this.mainDragHandlerId = null;
    }
    if (this.holdDragHandlerId) {
      this.holdScheduler.detachEvent(this.holdDragHandlerId);
      this.holdDragHandlerId = null;
    }
  }

  private extractSection(payload: unknown): string | null {
    if (typeof payload === 'object' && payload !== null && 'section_id' in payload) {
      const sectionId = (payload as { readonly section_id?: unknown }).section_id;
      return sectionId == null ? null : String(sectionId);
    }
    return null;
  }

  private extractDate(payload: unknown, key: 'start_date' | 'end_date'): string {
    if (typeof payload === 'object' && payload !== null && key in payload) {
      const value = (payload as Record<string, unknown>)[key];
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        return value;
      }
    }
    return new Date().toISOString();
  }

  private createSchedulerInstance(): SchedulerInstance {
    const runtime = globalThis as Record<string, unknown>;
    const candidates: readonly unknown[] = [runtime['Scheduler'], runtime['scheduler'], Scheduler, scheduler];

    for (const candidate of candidates) {
      if (!this.isSchedulerInstance(candidate)) {
        continue;
      }

      const instanceFactory = candidate as SchedulerFactory;
      const instance = instanceFactory.getSchedulerInstance?.() ?? candidate;
      if (this.isSchedulerInstance(instance)) {
        return instance;
      }
    }

    throw new Error('DHTMLX scheduler runtime is not available.');
  }

  private isSchedulerInstance(value: unknown): value is SchedulerInstance {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const schedulerCandidate = value as Partial<SchedulerInstance>;
    return (
      typeof schedulerCandidate.init === 'function' &&
      typeof schedulerCandidate.clearAll === 'function' &&
      typeof schedulerCandidate.parse === 'function' &&
      typeof schedulerCandidate.attachEvent === 'function' &&
      typeof schedulerCandidate.detachEvent === 'function' &&
      typeof schedulerCandidate.config === 'object' &&
      schedulerCandidate.config !== null
    );
  }
}
