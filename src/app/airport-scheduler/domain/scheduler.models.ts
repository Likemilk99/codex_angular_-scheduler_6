export interface TimeRange {
  readonly from: string;
  readonly to: string;
}

export interface DriverResource {
  readonly id: string;
  readonly label: string;
  readonly group?: string;
  readonly active: boolean;
}

export interface DriverShift {
  readonly id: string;
  readonly driverId: string;
  readonly range: TimeRange;
  readonly status: 'planned' | 'active' | 'completed';
}

export interface SchedulerEvent {
  readonly id: string;
  readonly title: string;
  readonly range: TimeRange;
  readonly driverId: string | null;
  readonly shiftId?: string;
  readonly priority: 'low' | 'normal' | 'high' | 'critical';
  readonly type: 'task' | 'transfer' | 'maintenance';
  readonly holdReason?: string;
}

export interface UserPreferences {
  readonly timezone: string;
  readonly timelineStepMinutes: number;
  readonly compactMode: boolean;
}

export interface ColorRule {
  readonly id: string;
  readonly eventType?: SchedulerEvent['type'];
  readonly priority?: SchedulerEvent['priority'];
  readonly shiftStatus?: DriverShift['status'];
  readonly color: string;
  readonly textColor: string;
}

export interface ColorRules {
  readonly fallbackColor: string;
  readonly fallbackTextColor: string;
  readonly rules: readonly ColorRule[];
}

export interface SchedulerInitData {
  readonly events: readonly SchedulerEvent[];
  readonly shifts: readonly DriverShift[];
  readonly holdEvents: readonly SchedulerEvent[];
  readonly range: TimeRange;
}

export interface SchedulerVm {
  readonly range: TimeRange;
  readonly timezone: string;
  readonly resources: readonly DriverResource[];
  readonly shifts: readonly DriverShift[];
  readonly mainEvents: readonly SchedulerEvent[];
  readonly holdEvents: readonly SchedulerEvent[];
}

export type WebSocketUpdate =
  | {
      readonly type: 'event.created';
      readonly payload: SchedulerEvent;
    }
  | {
      readonly type: 'event.updated';
      readonly payload: SchedulerEvent;
    }
  | {
      readonly type: 'event.deleted';
      readonly payload: { readonly eventId: string };
    }
  | {
      readonly type: 'shift.updated';
      readonly payload: DriverShift;
    }
  | {
      readonly type: 'resource.updated';
      readonly payload: DriverResource;
    }
  | {
      readonly type: 'timezone.changed';
      readonly payload: { readonly timezone: string };
    };

export interface DragDropCommand {
  readonly eventId: string;
  readonly targetDriverId: string | null;
  readonly targetRange: TimeRange;
  readonly source: 'hold' | 'main';
}

export interface RenderedEvent {
  readonly id: string;
  readonly text: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly sectionId: string;
  readonly color: string;
  readonly textColor: string;
}

export interface SchedulerSection {
  readonly key: string;
  readonly label: string;
}
