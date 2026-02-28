# Airport Driver Manager

Angular 14 приложение для управления сменами водителей аэропорта + локальный mock backend (REST + WebSocket).

## Требования

- Node.js 18+ (рекомендуется LTS)
- npm 8+

## Установка

```bash
npm install
```

## Запуск проекта

Для локальной разработки нужно запустить **два процесса** в разных терминалах.

### 1) Mock server

```bash
npm run mock-server
```

После запуска доступны:

- REST bootstrap: `http://localhost:8080/api/driver-manager/bootstrap`
- WebSocket stream: `ws://localhost:8080/ws/driver-manager`

Mock server отправляет websocket-обновления каждые **200ms**.

### 2) Angular приложение

```bash
npm run start:app
```

Открыть страницу:

- `http://localhost:4200/driver-manager`

## Полезные скрипты

- `npm run start:app` — запуск Angular dev server
- `npm run mock-server` — запуск mock backend
- `npm start` — алиас на `start:app`
- `npm run build` — production build
- `npm test` — unit tests (Karma)

## Быстрая проверка API mock сервера

```bash
curl http://localhost:8080/api/driver-manager/bootstrap
```
