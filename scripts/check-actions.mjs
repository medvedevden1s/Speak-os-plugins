#!/usr/bin/env node
// Check every declared action against the LIVE app catalog: it must exist,
// belong to one of the plugin's apps, and not be deprecated. Needs the catalog
// endpoint and key (CATALOG_API_URL, CATALOG_API_KEY), so it runs in CI as a
// separate job and is skipped for pull requests from forks, which cannot read
// secrets — a maintainer re-runs it before merging.
//
//   CATALOG_API_URL=... CATALOG_API_KEY=... node scripts/check-actions.mjs [plugin-id ...]

import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPlugin } from './lib/plugin.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const PLUGINS_DIR = join(ROOT, 'plugins');
const API = (process.env.CATALOG_API_URL ?? '').replace(/\/+$/, '');
const key = process.env.CATALOG_API_KEY;
if (!API || !key) {
  console.error('Set CATALOG_API_URL and CATALOG_API_KEY to check actions against the live catalog.');
  process.exit(2);
}

const only = process.argv.slice(2);
const dirs = readdirSync(PLUGINS_DIR)
  .filter((name) => statSync(join(PLUGINS_DIR, name)).isDirectory())
  .filter((name) => only.length === 0 || only.includes(name))
  .sort();

/** `{status, toolkit, deprecated}` for one action slug. */
async function lookup(slug) {
  // `toolkit_versions=latest` is what the app's runtime resolves against; without
  // it, actions added since the default pinned version 404 (seen 2026-10-21 for
  // CALENDLY_LIST_EVENT_TYPES) and a valid plugin would fail review.
  const res = await fetch(`${API}/${encodeURIComponent(slug)}?toolkit_versions=latest`, {
    headers: { 'x-api-key': key },
  });
  if (res.status === 404) return { status: 'missing' };
  if (!res.ok) throw new Error(`catalog answered ${res.status} for ${slug}`);
  const body = await res.json();
  return {
    status: 'ok',
    toolkit: String(body?.toolkit?.slug ?? '').toLowerCase(),
    deprecated: body?.is_deprecated === true || body?.deprecated?.is_deprecated === true,
  };
}

let failed = 0;
for (const name of dirs) {
  const plugin = loadPlugin(join(PLUGINS_DIR, name));
  if (!plugin.manifest || !plugin.declared) {
    console.log(`skip  ${name} (fix scripts/validate.mjs errors first)`);
    continue;
  }
  const apps = new Set(plugin.manifest.apps ?? []);
  const problems = [];
  for (const slug of [...plugin.declared.read, ...plugin.declared.write]) {
    const found = await lookup(slug);
    if (found.status === 'missing') problems.push(`${slug} does not exist`);
    else if (!apps.has(found.toolkit)) problems.push(`${slug} belongs to "${found.toolkit}", which is not one of the plugin's apps`);
    else if (found.deprecated) problems.push(`${slug} is deprecated — use its replacement`);
  }
  if (problems.length === 0) console.log(`ok    ${name}`);
  else {
    failed += 1;
    console.log(`FAIL  ${name}`);
    for (const p of problems) console.log(`      ✗ ${p}`);
  }
}
process.exit(failed > 0 ? 1 : 0);
