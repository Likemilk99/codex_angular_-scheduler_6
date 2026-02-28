# Airport Driver Manager

## Run
1. `npm install`
2. Start mock backend: `npm run mock-server`
3. Start Angular app: `npm start`
4. Open: `http://localhost:4200/driver-manager`

## Mock server behavior
- REST bootstrap endpoint: `GET /api/driver-manager/bootstrap`
- WebSocket endpoint: `ws://localhost:8080/ws/driver-manager`
- Emits `event.updated` updates every **200ms**.
