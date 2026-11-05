import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function parse(source) {
  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    const at = withoutExport.indexOf('=');
    if (at <= 0) continue;
    const name = withoutExport.slice(0, at).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue;
    let value = withoutExport.slice(at + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }
  return values;
}

/** Load `.env` from the project root if there is one. Values already set are never overwritten. */
export function loadEnv(root = process.cwd()) {
  const file = path.join(root, '.env');
  if (!existsSync(file)) return { loaded: [] };
  let source = '';
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    return { loaded: [] };
  }
  const values = parse(source);
  const loaded = [];
  for (const [name, value] of Object.entries(values)) {
    if (process.env[name] !== undefined) continue;
    process.env[name] = value;
    loaded.push(name);
  }
  return { loaded };
}

loadEnv();
