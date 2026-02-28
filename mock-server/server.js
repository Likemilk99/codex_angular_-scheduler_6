const http = require('http');
const crypto = require('crypto');

const port = 8080;

const resources = [
  { id: 'd-1', label: 'Driver A', active: true },
  { id: 'd-2', label: 'Driver B', active: true },
  { id: 'd-3', label: 'Driver C', active: true }
];

const bootstrapPayload = () => ({
  data: {
    events: [
      {
        id: 'e-1',
        title: 'Fuel truck request',
        range: { from: new Date().toISOString(), to: new Date(Date.now() + 45 * 60000).toISOString() },
        driverId: 'd-1',
        priority: 'normal',
        type: 'task'
      }
    ],
    holdEvents: [
      {
        id: 'h-1',
        title: 'Gate transfer pending',
        range: { from: new Date().toISOString(), to: new Date(Date.now() + 25 * 60000).toISOString() },
        driverId: null,
        priority: 'high',
        type: 'transfer',
        holdReason: 'Waiting assignment'
      }
    ],
    shifts: [
      {
        id: 's-1',
        driverId: 'd-1',
        range: { from: new Date().toISOString(), to: new Date(Date.now() + 8 * 3600 * 1000).toISOString() },
        status: 'active'
      }
    ],
    range: { from: new Date().toISOString(), to: new Date(Date.now() + 12 * 3600 * 1000).toISOString() }
  },
  resources,
  user_preferences: { timezone: 'UTC', timelineStepMinutes: 30, compactMode: false },
  color_rules: {
    fallbackColor: '#5e6ad2',
    fallbackTextColor: '#ffffff',
    rules: [
      { id: 'r-1', eventType: 'transfer', color: '#f59e0b', textColor: '#111827' },
      { id: 'r-2', priority: 'high', color: '#ef4444', textColor: '#ffffff' }
    ]
  }
});

const server = http.createServer((req, res) => {
  if (req.url === '/api/driver-manager/bootstrap' && req.method === 'GET') {
    const payload = JSON.stringify(bootstrapPayload());
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Content-Length': Buffer.byteLength(payload)
    });
    res.end(payload);
    return;
  }

  res.writeHead(404);
  res.end();
});

server.on('upgrade', (req, socket) => {
  if (req.url !== '/ws/driver-manager') {
    socket.destroy();
    return;
  }

  const key = req.headers['sec-websocket-key'];
  if (!key || Array.isArray(key)) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n'
    ].join('\r\n')
  );

  let seq = 0;
  const timer = setInterval(() => {
    const targetDriver = seq % 3 === 0 ? 'd-2' : seq % 3 === 1 ? 'd-3' : null;
    sendWsFrame(socket, {
      type: 'event.updated',
      payload: {
        id: seq % 2 === 0 ? 'e-1' : 'h-1',
        title: `Auto update #${seq}`,
        range: {
          from: new Date(Date.now() + seq * 60000).toISOString(),
          to: new Date(Date.now() + (seq + 20) * 60000).toISOString()
        },
        driverId: targetDriver,
        priority: seq % 5 === 0 ? 'critical' : 'normal',
        type: seq % 2 === 0 ? 'task' : 'transfer',
        holdReason: targetDriver ? undefined : 'No free driver'
      }
    });

    if (seq % 15 === 0) {
      sendWsFrame(socket, {
        type: 'timezone.changed',
        payload: { timezone: seq % 30 === 0 ? 'Europe/Moscow' : 'UTC' }
      });
    }

    seq += 1;
  }, 200);

  socket.on('close', () => clearInterval(timer));
  socket.on('end', () => clearInterval(timer));
  socket.on('error', () => clearInterval(timer));
});

function sendWsFrame(socket, data) {
  const json = Buffer.from(JSON.stringify(data));
  const header = [];
  header.push(0x81);
  if (json.length < 126) {
    header.push(json.length);
  } else if (json.length < 65536) {
    header.push(126, (json.length >> 8) & 255, json.length & 255);
  } else {
    header.push(127, 0, 0, 0, 0, (json.length >> 24) & 255, (json.length >> 16) & 255, (json.length >> 8) & 255, json.length & 255);
  }
  socket.write(Buffer.concat([Buffer.from(header), json]));
}

server.listen(port, () => {
  console.log(`Mock server started at http://localhost:${port}`);
});
