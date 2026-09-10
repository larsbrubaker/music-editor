// Every source file stays under 800 non-empty lines. When a file grows past that it
// has usually picked up too many responsibilities: split it by responsibility,
// never by compressing it. (Same rule and measure as MatterCAD's FileComplianceTests.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const DEFAULT_LIMIT = 800;
const EXPLICIT_LIMITS = {}; // legacy files frozen at their current size; limits may only go down
const SKIP_DIRS = new Set(['.git', 'node_modules', 'assets']);
const EXTS = new Set(['.js', '.mjs', '.html', '.css']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) { continue; }
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { yield* walk(p); } else if (EXTS.has(extname(name))) { yield p; }
  }
}

test('all source files comply with the line limit', () => {
  const failures = [];
  for (const file of walk(root)) {
    const rel = relative(root, file).split('\\').join('/');
    const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim() !== '').length;
    const limit = EXPLICIT_LIMITS[rel] ?? DEFAULT_LIMIT;
    if (lines > limit) { failures.push(`${rel}: ${lines} non-empty lines (limit ${limit})`); }
  }
  assert.deepEqual(failures, []);
});
