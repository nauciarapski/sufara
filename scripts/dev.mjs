/**
 * Starts the whole app: the API (server/index.mjs) and Vite, which proxies /api to it.
 *
 * Platform-owned plumbing. `npm run dev:web` starts only Vite and `npm run dev:api` only the API, which is what
 * the platform uses when it needs one process at a time.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import '../server/env.mjs';

const cwd = process.cwd();
const children = [];
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

function run(label, command, args) {
  const child = spawn(command, args, { stdio: 'inherit', cwd, env: process.env });
  children.push(child);
  child.on('error', (error) => {
    console.error('[' + label + '] could not start: ' + error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    // Whichever half dies takes the other with it: a dev server proxying to nothing is worse than a clear exit.
    console.log('[' + label + '] exited with code ' + code);
    stop(code === 0 ? 0 : 1);
  });
  return child;
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

if (process.env.KOOD_API_ONLY !== '1') {
  const vite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(vite)) {
    console.error('[dev] Vite is not installed yet - run "npm install" first.');
    stop(1);
  }
  run('web', process.execPath, [vite, '--host', '--port', '3000']);
}
run('api', process.execPath, ['server/index.mjs']);
