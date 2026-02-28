import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {
  ColorRules,
  DriverResource,
  SchedulerInitData,
  UserPreferences,
  WebSocketUpdate
} from '../../airport-scheduler/domain/scheduler.models';

interface DriverManagerBootstrap {
  readonly data: SchedulerInitData;
  readonly resources: readonly DriverResource[];
  readonly user_preferences: UserPreferences;
  readonly color_rules: ColorRules;
}

@Component({
  selector: 'app-driver-manager-page',
  templateUrl: './driver-manager-page.component.html',
  styleUrls: ['./driver-manager-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DriverManagerPageComponent {
  private readonly baseUrl = 'http://localhost:8080';

  readonly bootstrap$: Observable<DriverManagerBootstrap> = this.http
    .get<DriverManagerBootstrap>(`${this.baseUrl}/api/driver-manager/bootstrap`)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly updates$: Observable<WebSocketUpdate> = new Observable<WebSocketUpdate>((subscriber) => {
    const socket = new WebSocket('ws://localhost:8080/ws/driver-manager');

    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as WebSocketUpdate;
      subscriber.next(parsed);
    };

    socket.onerror = () => subscriber.error(new Error('WebSocket error'));

    return () => socket.close();
  }).pipe(
    catchError(() => of({ type: 'timezone.changed', payload: { timezone: 'UTC' } } as WebSocketUpdate)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly vm$ = this.bootstrap$.pipe(
    map((bootstrap) => ({
      ...bootstrap,
      updates: this.updates$
    }))
  );

  constructor(private readonly http: HttpClient) {}
}
