import http from 'node:http';
import {provenance} from '../shared/provenance.mjs';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initialState,
  applyAction,
  planRoute,
  nodes,
  edges,
  pois,
  amenities,
  doctors,
  destinationPresets,
  floors,
  buildings,
  stages,
} from '../shared/hospital.mjs';
const dir =
  process.env.DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url));
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'demo.json');
let state = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, 'utf8'))
  : initialState();
function save(next) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
  fs.renameSync(tmp, file);
  state = next;
}
export const server = http.createServer(async (req, res) => {
  res.setHeader('X-Project-Origin',provenance.originId);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (code, data) => {
    res.writeHead(code);
    res.end(JSON.stringify(data));
  };
  if (req.method === 'OPTIONS') return send(204, {});
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/health')
      return send(200, { ok: true, mode: 'local-demo' });
    if (req.method === 'GET' && url.pathname === '/api/qr') {
      const id = url.searchParams.get('id');
      if (!nodes.some((n) => n.id === id)) throw Error('无效定位点');
      const svg = await QRCode.toString('hospital-demo://location/' + id, {
        type: 'svg',
        margin: 2,
        width: 220,
      });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.writeHead(200);
      return res.end(svg);
    }
    if (req.method === 'GET' && url.pathname === '/api/state')
      return send(200, state);
    if (req.method === 'GET' && url.pathname === '/api/hospital')
      return send(200, { nodes, edges, pois, amenities, doctors, destinationPresets, floors, buildings, stages });
    if (req.method === 'GET' && url.pathname === '/api/route')
      return send(200, {
        route: planRoute(
          url.searchParams.get('from'),
          url.searchParams.get('to'),
          state,
        ),
      });
    if (req.method === 'POST' && url.pathname === '/api/action') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 10000) return send(413, { error: '请求过大' });
      }
      const action = JSON.parse(raw);
      if (!action || typeof action !== 'object' || Array.isArray(action))
        throw Error('无效请求');
      if (action.version !== state.version)
        return send(409, { error: '数据已更新，请重试', state });
      save(applyAction(state, action));
      return send(200, state);
    }
    send(404, { error: '接口不存在' });
  } catch (e) {
    send(400, { error: e.message || '操作失败' });
  }
});
const port = Number(process.env.API_PORT || 3000);
server.listen(port, '0.0.0.0', () =>
  console.log(`SmartGuide API: http://localhost:${port}`),
);
