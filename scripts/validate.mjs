#!/usr/bin/env node
// Validate every plugin in plugins/. Runs offline (no API key) — this is the
// first CI gate on every pull request. `--base <git ref>` also checks that a
// changed plugin bumped its version, so an approved version can never change
// under the people who installed it.
//
//   node scripts/validate.mjs                 # all plugins
//   node scripts/validate.mjs --base origin/main

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPlugin } from './lib/plugin.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const PLUGINS_DIR = join(ROOT, 'plugins');
// Everything in this repository is published under the repository's MIT
// license; a plugin cannot opt out of that by declaring something else.
const REPO_LICENSE = 'MIT';

const args = process.argv.slice(2);
const baseIdx = args.indexOf('--base');
const baseRef = baseIdx === -1 ? null : args[baseIdx + 1];

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/** Version of `id` on the base ref, or null when the plugin is new there. */
function baseVersion(id) {
  try {
    return JSON.parse(git('show', `${baseRef}:plugins/${id}/plugin.json`)).version ?? null;
  } catch {
    return null;
  }
}

function changedSinceBase(id) {
  try {
    return git('diff', '--name-only', baseRef, '--', `plugins/${id}`).trim() !== '';
  } catch {
    return true;
  }
}

if (!existsSync(PLUGINS_DIR)) {
  console.error('No plugins/ folder found.');
  process.exit(1);
}

const ids = new Set();
let failed = 0;
let warned = 0;
const dirs = readdirSync(PLUGINS_DIR).filter((name) => statSync(join(PLUGINS_DIR, name)).isDirectory());

for (const name of dirs.sort()) {
  const plugin = loadPlugin(join(PLUGINS_DIR, name));
  const errors = [...plugin.errors];
  const warnings = [...plugin.warnings];
  const manifest = plugin.manifest;

  if (manifest) {
    if (manifest.id !== name) errors.push(`plugin.json: "id" is "${manifest.id}" but the folder is "${name}" — they must match`);
    if (ids.has(manifest.id)) errors.push(`plugin id "${manifest.id}" is used twice`);
    ids.add(manifest.id);
    if (manifest.license !== REPO_LICENSE) errors.push(`plugin.json: "license" must be "${REPO_LICENSE}" in this repository`);
    if (baseRef && changedSinceBase(name)) {
      const before = baseVersion(name);
      if (before !== null && before === manifest.version) errors.push(`changed since ${baseRef} but "version" is still ${before} — bump it`);
    }
  }

  const label = manifest?.version ? `${name}@${manifest.version}` : name;
  if (errors.length === 0) {
    console.log(`ok    ${label}  (${plugin.skills?.length ?? 0} skills, ${plugin.agents?.length ?? 0} agents)`);
  } else {
    failed += 1;
    console.log(`FAIL  ${label}`);
    for (const e of errors) console.log(`      ✗ ${e}`);
  }
  for (const w of warnings) {
    warned += 1;
    console.log(`      ! ${w}`);
  }
}

console.log(`\n${dirs.length} plugin(s), ${failed} failed, ${warned} warning(s).`);
process.exit(failed > 0 ? 1 : 0);
