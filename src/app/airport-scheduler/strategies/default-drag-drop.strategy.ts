import { Injectable } from '@angular/core';
import { DragDropCommand } from '../domain/scheduler.models';
import { DragDropStrategy } from './scheduler-strategy.tokens';

@Injectable()
export class DefaultDragDropStrategy implements DragDropStrategy {
  buildCommand(args: {
    eventId: string;
    source: 'hold' | 'main';
    targetSection: string | null;
    targetRange: { from: string; to: string };
  }): DragDropCommand {
    return {
      eventId: args.eventId,
      source: args.source,
      targetDriverId: args.targetSection,
      targetRange: args.targetRange
    };
  }
}
