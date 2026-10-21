#!/usr/bin/env node
// Build catalog.json: one entry per approved plugin, with the package hash the
// app re-computes before it installs anything. CI runs this on every merge to
// main (a merge IS the approval). Signing and upload come in the next phase;
// the shape here is what the app and the website read.
//
//   node scripts/build-catalog.mjs [--out catalog.json]

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FORMAT_VERSION, loadPlugin } from './lib/plugin.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const PLUGINS_DIR = join(ROOT, 'plugins');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const out = resolve(ROOT, outIdx === -1 ? 'catalog.json' : args[outIdx + 1]);

const plugins = [];
for (const name of readdirSync(PLUGINS_DIR).sort()) {
  if (!statSync(join(PLUGINS_DIR, name)).isDirectory()) continue;
  const p = loadPlugin(join(PLUGINS_DIR, name));
  if (p.errors.length > 0) {
    console.error(`${name} has errors — run scripts/validate.mjs. The catalog was not written.`);
    process.exit(1);
  }
  plugins.push({
    id: p.manifest.id,
    name: p.manifest.name,
    version: p.manifest.version,
    description: p.manifest.description,
    apps: p.manifest.apps,
    actions: p.declared,
    author: p.manifest.author,
    category: p.manifest.category ?? 'other',
    keywords: p.manifest.keywords ?? [],
    skills: p.skills.map((s) => ({ id: s.id, name: s.name, app: s.app, triggers: s.triggers })),
    agents: p.agents.map((a) => ({ id: a.id, name: a.name, description: a.description })),
    sha256: p.hash,
    path: `plugins/${name}`,
  });
}

const catalog = {
  format: FORMAT_VERSION,
  generatedAt: new Date().toISOString(),
  plugins,
  // Versions pulled after approval. The app disables a matching installed
  // version on its next catalog fetch and tells the user why.
  revoked: [],
};
writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${plugins.length} plugin(s) to ${out}`);
