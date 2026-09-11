import { spawn } from 'node:child_process';
const children = [];
let closing = false;
function start(args) {
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    env: process.env,
  });
  children.push(child);
  child.on('exit', (code) => {
    if (!closing) {
      closing = true;
      children.forEach((c) => c.kill('SIGTERM'));
      process.exitCode = code || 0;
    }
  });
}
start(['server/api.mjs']);
start([
  'node_modules/vinext/dist/cli.js',
  'dev',
  '--hostname',
  '0.0.0.0',
  '--port',
  '5173',
]);
for (const sig of ['SIGINT', 'SIGTERM'])
  process.on(sig, () => {
    closing = true;
    children.forEach((c) => c.kill(sig));
  });
