# Airport Driver Scheduler (Angular 14 + DHTMLX Scheduler 6 Timeline)

## Архитектурная схема

```text
Inputs(data, updates, resources, preferences, colorRules)
              |
              v
     AirportDriverSchedulerComponent (Thin UI)
              |
              v
        SchedulerFacadeService
       /    |      |       \
      v     v      v        v
  State   Strategy Adapter WebSocket stream
   |         |       |
   +-----> ViewModel +----> DHTMLX Scheduler API
```

## Структура файлов

```text
src/app/airport-scheduler/
  domain/
    scheduler.models.ts
  state/
    scheduler-state.service.ts
  strategies/
    scheduler-strategy.tokens.ts
    default-event-color.strategy.ts
    default-rendering.strategy.ts
    default-drag-drop.strategy.ts
    default-timezone.strategy.ts
  infra/
    dhtmlx-scheduler-adapter.service.ts
  facade/
    scheduler-facade.service.ts
  ui/
    airport-driver-scheduler.component.ts
    airport-driver-scheduler.component.html
    airport-driver-scheduler.component.scss
    airport-driver-scheduler.module.ts
```

## WebSocket flow

`updates$ -> SchedulerFacadeService.bindWebsocketPipeline -> SchedulerStateService -> render/timezone pipelines -> DhtmlxSchedulerAdapter`

## Drag & Drop flow example

1. Adapter publishes scheduler `onDragEnd` payload as `Observable`.
2. Facade applies `DragDropStrategy` and builds `DragDropCommand`.
3. Facade reads current VM and immutably updates event assignment via state.
4. State update triggers render pipeline and adapter redraws data.

## Timezone change example

1. `user_preferences.timezone` changes.
2. Component forwards timezone to facade.
3. Facade updates state and applies `TimezoneStrategy`.
4. Adapter applies scheduler timezone config.

## Color rules example

1. `ColorRules` arrives through Input or state update.
2. Rendering strategy resolves colors through `EventColorStrategy`.
3. Adapter receives `RenderedEvent` with computed `color/textColor`.

## Integration in Angular app

- Feature page route: `/driver-manager`
- Container page component loads bootstrap data from REST and passes Inputs to scheduler component.
- WebSocket stream is connected from page component and forwarded to facade through `updates` Input.

## Mock server

- `mock-server/server.js`
- REST bootstrap endpoint: `GET /api/driver-manager/bootstrap`
- WS endpoint: `ws://localhost:8080/ws/driver-manager`
- Emits scheduler updates every `200ms`.
