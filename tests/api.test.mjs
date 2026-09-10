import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stages } from '../shared/hospital.mjs';
test('HTTP 集成：完整流程、冲突保护、二维码和重启持久化', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'smartguide-test-'));
  const port = 13000 + Math.floor(Math.random() * 10000);
  const base = `http://127.0.0.1:${port}`;
  let child;
  let output = '';
  async function boot() {
    child = spawn(process.execPath, ['server/api.mjs'], {
      env: { ...process.env, API_PORT: String(port), DATA_DIR: dir },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (x) => (output += x));
    child.stderr.on('data', (x) => (output += x));
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch(base + '/api/health');
        if (r.ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error('服务启动失败 ' + output);
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    await new Promise((r) => {
      child.once('exit', r);
      child.kill('SIGTERM');
    });
  }
  try {
    await boot();
    let state = await (await fetch(base + '/api/state')).json();
    const post = async (action) => {
      const r = await fetch(base + '/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: state.version, ...action }),
      });
      const s = await r.json();
      if (r.ok) state = s;
      return { r, s };
    };
    let result = await post({ type: 'advance' });
    assert.equal(result.r.status, 400);
    assert.equal(state.stage, 0);
    result = await post({ type: 'locate', id: 'service', version: 0 });
    assert.equal(result.r.status, 409);
    while (state.stage < 9) {
      const current = stages[state.stage];
      if (current.target) {
        result = await post({ type: 'arrive', id: current.target });
        assert.equal(result.r.status, 200);
      }
      if (state.stage === 2)
        while (state.queue > 0) {
          result = await post({ type: 'call' });
          assert.equal(result.r.status, 200);
        }
      result = await post({ type: 'advance' });
      assert.equal(result.r.status, 200, result.s.error);
    }
    const qr = await fetch(base + '/api/qr?id=cardio');
    assert.match(qr.headers.get('content-type'), /svg/);
    assert.match(await qr.text(), /<svg/);
    assert.equal((await fetch(base + '/api/qr?id=bad')).status, 400);
    const savedVersion = state.version;
    await stop();
    await boot();
    state = await (await fetch(base + '/api/state')).json();
    assert.equal(state.stage, 9);
    assert.equal(state.version, savedVersion);
    assert(state.logs.length > 10);
  } finally {
    await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
