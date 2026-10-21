// Loads and validates one plugin folder. Zero dependencies on purpose: CI and
// contributors run it with a bare `node`, and the Speak OS app re-implements the
// same rules in Rust (src-tauri/src/agent/plugins.rs). If you change a rule
// here, change it there too — a plugin CI accepts and the app refuses (or the
// other way round) is the worst outcome this format can have.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const FORMAT_VERSION = 1;

export const LIMITS = {
  skills: 20,
  agents: 5,
  skillBytes: 8 * 1024,
  agentBytes: 8 * 1024,
  readmeBytes: 32 * 1024,
  iconBytes: 16 * 1024,
  totalBytes: 128 * 1024,
  nameChars: 60,
  descriptionChars: 280,
  triggers: 10,
  triggerChars: 80,
  needs: 8,
  needChars: 80,
  apps: 5,
  declaredActions: 40,
  actionsPerSkill: 10,
  keywords: 8,
  instructionsChars: 8000,
};

export const CATEGORIES = [
  'productivity',
  'communication',
  'calendar',
  'sales',
  'marketing',
  'support',
  'developer',
  'finance',
  'other',
];

const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const APP_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const ACTION_RE = /^[A-Z0-9][A-Z0-9_]{1,127}$/;
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const GITHUB_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

const MANIFEST_KEYS = new Set([
  '$schema',
  'format',
  'id',
  'name',
  'version',
  'description',
  'apps',
  'actions',
  'author',
  'license',
  'category',
  'keywords',
  'minAppVersion',
]);
const SKILL_KEYS = new Set(['name', 'app', 'triggers', 'needs', 'actions']);
const AGENT_KEYS = new Set(['id', 'name', 'description', 'instructions', 'apps', 'actions', 'triggers']);

// Text that is injected into the assistant's prompt (skill bodies, agent
// instructions) must not carry a way to send data somewhere, or an attempt to
// override the assistant's own rules. These are the cheap first gate; the
// human review is the real one.
const URL_RE = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\./i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const INJECTION_RES = [
  /\bignore\b.{0,40}\b(previous|prior|above|earlier|all|other)\b.{0,20}\b(instructions?|rules?|prompts?)\b/i,
  /\bdisregard\b.{0,40}\b(instructions?|rules?|prompts?)\b/i,
  /\b(reveal|print|show|repeat|output)\b.{0,40}\bsystem prompt\b/i,
  /\byou are no longer\b/i,
];
// No lookahead here: the app's Rust copy of these patterns uses the `regex`
// crate, which does not support it, and the two must stay identical.
const SVG_UNSAFE_RES = [/<script/i, /\son[a-z]+\s*=/i, /javascript:/i, /<foreignObject/i, /\bhref\s*=\s*["']\s*[^#\s"']/i];

/** Every file the package may contain, as a predicate on its relative path. */
function isAllowedFile(rel) {
  if (rel === 'plugin.json' || rel === 'README.md' || rel === 'icon.svg') return true;
  if (/^skills\/[^/]+\.md$/.test(rel)) return true;
  if (/^agents\/[^/]+\.json$/.test(rel)) return true;
  return false;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** CRLF → LF, so a Windows checkout hashes the same as Linux CI. */
function normalise(buf) {
  return Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
}

const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/**
 * The package digest the catalog publishes and the app re-computes: for every
 * file in path order, `<path>\n<sha256(content)>\n`, hashed once more.
 */
export function packageHash(files) {
  const lines = [...files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((f) => `${f.path}\n${sha256(f.content)}\n`)
    .join('');
  return sha256(lines);
}

function splitList(value) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function unquote(value) {
  const text = value.trim();
  if (text.length >= 2 && text[0] === text[text.length - 1] && (text[0] === '"' || text[0] === "'")) {
    return text.slice(1, -1).trim();
  }
  return text;
}

/**
 * Parse a skill file. The frontmatter is the same hand-rolled `key: value` shape
 * Speak OS uses for its own tool files (lists are comma-separated on one line),
 * so a plugin skill reads exactly like the tool file a user already edits.
 */
export function parseSkill(text) {
  const match = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(text);
  if (!match) return { error: 'missing the --- frontmatter block at the top' };
  const fields = {};
  const unknown = [];
  for (const line of match[1].split('\n')) {
    const entry = line.trim();
    if (!entry || entry.startsWith('#')) continue;
    const colon = entry.indexOf(':');
    if (colon === -1) {
      unknown.push(entry);
      continue;
    }
    const key = entry.slice(0, colon).trim().toLowerCase();
    if (!SKILL_KEYS.has(key)) {
      unknown.push(key);
      continue;
    }
    fields[key] = unquote(entry.slice(colon + 1));
  }
  return {
    name: fields.name ?? '',
    app: (fields.app ?? '').toLowerCase(),
    triggers: splitList(fields.triggers ?? ''),
    needs: splitList(fields.needs ?? ''),
    actions: splitList(fields.actions ?? ''),
    body: text.slice(match[0].length).trim(),
    unknown,
  };
}

function checkPromptText(where, text, errors) {
  if (URL_RE.test(text)) errors.push(`${where}: contains a web address. Skills and agent instructions may not link anywhere.`);
  if (EMAIL_RE.test(text)) errors.push(`${where}: contains an email address. Plugins may not carry anyone's contact details.`);
  for (const re of INJECTION_RES) {
    if (re.test(text)) errors.push(`${where}: tries to override the assistant's own rules ("${text.match(re)[0]}").`);
  }
}

function checkStringList(where, list, max, maxChars, errors) {
  if (!Array.isArray(list) || list.some((v) => typeof v !== 'string')) {
    errors.push(`${where} must be a list of strings`);
    return [];
  }
  if (list.length > max) errors.push(`${where}: at most ${max} entries (has ${list.length})`);
  for (const v of list) if (v.length > maxChars) errors.push(`${where}: "${v.slice(0, 30)}…" is longer than ${maxChars} characters`);
  return list;
}

/**
 * Load one plugin folder. Never throws: returns every problem it can find so a
 * contributor fixes them in one pass.
 */
export function loadPlugin(dir) {
  const errors = [];
  const warnings = [];
  const files = [];
  let total = 0;

  for (const full of walk(dir)) {
    const rel = relative(dir, full).split(sep).join('/');
    if (!isAllowedFile(rel)) {
      errors.push(`${rel}: not an allowed file. A plugin holds only plugin.json, README.md, icon.svg, skills/*.md and agents/*.json — no code.`);
      continue;
    }
    const content = normalise(readFileSync(full));
    total += content.length;
    files.push({ path: rel, content });
  }
  if (total > LIMITS.totalBytes) errors.push(`the plugin is ${total} bytes; the limit is ${LIMITS.totalBytes}`);

  const byPath = new Map(files.map((f) => [f.path, f]));
  const manifestFile = byPath.get('plugin.json');
  if (!manifestFile) {
    errors.push('plugin.json is missing');
    return { dir, errors, warnings, files };
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestFile.content.toString('utf8'));
  } catch (err) {
    errors.push(`plugin.json is not valid JSON: ${err.message}`);
    return { dir, errors, warnings, files };
  }
  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push('plugin.json must be a JSON object');
    return { dir, errors, warnings, files };
  }

  for (const key of Object.keys(manifest)) if (!MANIFEST_KEYS.has(key)) errors.push(`plugin.json: unknown field "${key}"`);
  if (manifest.format !== FORMAT_VERSION) errors.push(`plugin.json: "format" must be ${FORMAT_VERSION}`);
  if (typeof manifest.id !== 'string' || !ID_RE.test(manifest.id)) errors.push('plugin.json: "id" must be lowercase letters, digits and dashes (2–64 characters)');
  if (typeof manifest.name !== 'string' || !manifest.name.trim() || manifest.name.length > LIMITS.nameChars) errors.push(`plugin.json: "name" is required, at most ${LIMITS.nameChars} characters`);
  if (typeof manifest.version !== 'string' || !SEMVER_RE.test(manifest.version)) errors.push('plugin.json: "version" must look like 1.0.0');
  if (typeof manifest.description !== 'string' || !manifest.description.trim() || manifest.description.length > LIMITS.descriptionChars) errors.push(`plugin.json: "description" is required, at most ${LIMITS.descriptionChars} characters`);
  if (manifest.minAppVersion !== undefined && (typeof manifest.minAppVersion !== 'string' || !SEMVER_RE.test(manifest.minAppVersion))) errors.push('plugin.json: "minAppVersion" must look like 3.0.0');
  if (typeof manifest.license !== 'string' || !manifest.license.trim()) errors.push('plugin.json: "license" is required');
  if (manifest.category !== undefined && !CATEGORIES.includes(manifest.category)) errors.push(`plugin.json: "category" must be one of ${CATEGORIES.join(', ')}`);
  if (manifest.keywords !== undefined) checkStringList('plugin.json "keywords"', manifest.keywords, LIMITS.keywords, 30, errors);

  const author = manifest.author;
  if (!author || typeof author !== 'object' || typeof author.name !== 'string' || !author.name.trim()) {
    errors.push('plugin.json: "author.name" is required');
  } else {
    for (const key of Object.keys(author)) if (!['name', 'github'].includes(key)) errors.push(`plugin.json: unknown field "author.${key}"`);
    if (author.github !== undefined && (typeof author.github !== 'string' || !GITHUB_RE.test(author.github))) errors.push('plugin.json: "author.github" must be a GitHub username');
  }

  const apps = checkStringList('plugin.json "apps"', manifest.apps ?? null, LIMITS.apps, 64, errors);
  if (apps.length === 0) errors.push('plugin.json: "apps" must name at least one app');
  for (const app of apps) if (!APP_RE.test(app)) errors.push(`plugin.json: app "${app}" must be a lowercase app id, e.g. "gmail"`);

  const declared = { read: [], write: [] };
  const actionsObj = manifest.actions;
  if (!actionsObj || typeof actionsObj !== 'object' || Array.isArray(actionsObj)) {
    errors.push('plugin.json: "actions" must be an object with "read" and "write" lists');
  } else {
    for (const key of Object.keys(actionsObj)) if (!['read', 'write'].includes(key)) errors.push(`plugin.json: unknown field "actions.${key}"`);
    declared.read = checkStringList('plugin.json "actions.read"', actionsObj.read ?? [], LIMITS.declaredActions, 128, errors);
    declared.write = checkStringList('plugin.json "actions.write"', actionsObj.write ?? [], LIMITS.declaredActions, 128, errors);
  }
  const allDeclared = [...declared.read, ...declared.write];
  if (allDeclared.length === 0) errors.push('plugin.json: declare at least one action');
  for (const action of allDeclared) if (!ACTION_RE.test(action)) errors.push(`plugin.json: "${action}" is not an action id (UPPER_CASE, e.g. GMAIL_FETCH_EMAILS)`);
  for (const action of declared.read) if (declared.write.includes(action)) errors.push(`plugin.json: "${action}" is listed as both read and write`);
  if (new Set(allDeclared).size !== allDeclared.length) errors.push('plugin.json: an action is declared twice');
  const declaredSet = new Set(allDeclared);
  const used = new Set();

  const readme = byPath.get('README.md');
  if (!readme) errors.push('README.md is missing — it is the store listing people read before installing');
  else if (readme.content.length > LIMITS.readmeBytes) errors.push(`README.md is larger than ${LIMITS.readmeBytes} bytes`);

  const icon = byPath.get('icon.svg');
  if (icon) {
    if (icon.content.length > LIMITS.iconBytes) errors.push(`icon.svg is larger than ${LIMITS.iconBytes} bytes`);
    const svg = icon.content.toString('utf8');
    for (const re of SVG_UNSAFE_RES) if (re.test(svg)) errors.push('icon.svg contains scripts, event handlers or external links');
  }

  const skills = [];
  const skillFiles = files.filter((f) => f.path.startsWith('skills/'));
  if (skillFiles.length === 0) errors.push('a plugin needs at least one skill in skills/');
  if (skillFiles.length > LIMITS.skills) errors.push(`at most ${LIMITS.skills} skills (has ${skillFiles.length})`);
  for (const file of skillFiles) {
    const id = file.path.slice('skills/'.length, -'.md'.length);
    const where = file.path;
    if (!ID_RE.test(id)) errors.push(`${where}: the file name must be lowercase letters, digits and dashes`);
    if (file.content.length > LIMITS.skillBytes) errors.push(`${where}: larger than ${LIMITS.skillBytes} bytes`);
    const skill = parseSkill(file.content.toString('utf8'));
    if (skill.error) {
      errors.push(`${where}: ${skill.error}`);
      continue;
    }
    for (const key of skill.unknown) errors.push(`${where}: unknown frontmatter field "${key}"`);
    if (!skill.name || skill.name.length > LIMITS.nameChars) errors.push(`${where}: "name" is required, at most ${LIMITS.nameChars} characters`);
    if (!apps.includes(skill.app)) errors.push(`${where}: "app" must be one of the plugin's apps (${apps.join(', ')})`);
    if (skill.triggers.length === 0) errors.push(`${where}: give at least one trigger phrase`);
    checkStringList(`${where} "triggers"`, skill.triggers, LIMITS.triggers, LIMITS.triggerChars, errors);
    checkStringList(`${where} "needs"`, skill.needs, LIMITS.needs, LIMITS.needChars, errors);
    if (skill.actions.length === 0) errors.push(`${where}: name the actions this skill uses in "actions"`);
    if (skill.actions.length > LIMITS.actionsPerSkill) errors.push(`${where}: at most ${LIMITS.actionsPerSkill} actions`);
    for (const action of skill.actions) {
      if (!declaredSet.has(action)) errors.push(`${where}: uses "${action}", which plugin.json does not declare`);
      used.add(action);
    }
    if (!skill.body) errors.push(`${where}: the instructions under the frontmatter are empty`);
    checkPromptText(where, skill.body, errors);
    checkPromptText(`${where} triggers`, skill.triggers.join(' '), errors);
    skills.push({ id, name: skill.name, app: skill.app, triggers: skill.triggers, needs: skill.needs, actions: skill.actions, body: skill.body });
  }

  const agents = [];
  const agentFiles = files.filter((f) => f.path.startsWith('agents/'));
  if (agentFiles.length > LIMITS.agents) errors.push(`at most ${LIMITS.agents} agents (has ${agentFiles.length})`);
  for (const file of agentFiles) {
    const id = file.path.slice('agents/'.length, -'.json'.length);
    const where = file.path;
    if (file.content.length > LIMITS.agentBytes) errors.push(`${where}: larger than ${LIMITS.agentBytes} bytes`);
    let agent;
    try {
      agent = JSON.parse(file.content.toString('utf8'));
    } catch (err) {
      errors.push(`${where}: not valid JSON: ${err.message}`);
      continue;
    }
    if (!agent || typeof agent !== 'object' || Array.isArray(agent)) {
      errors.push(`${where}: must be a JSON object`);
      continue;
    }
    for (const key of Object.keys(agent)) if (!AGENT_KEYS.has(key)) errors.push(`${where}: unknown field "${key}"`);
    if (agent.id !== id) errors.push(`${where}: "id" must match the file name ("${id}")`);
    if (typeof agent.name !== 'string' || !agent.name.trim() || agent.name.length > LIMITS.nameChars) errors.push(`${where}: "name" is required, at most ${LIMITS.nameChars} characters`);
    if (typeof agent.description !== 'string' || agent.description.length > LIMITS.descriptionChars) errors.push(`${where}: "description" is required, at most ${LIMITS.descriptionChars} characters`);
    if (typeof agent.instructions !== 'string' || !agent.instructions.trim() || agent.instructions.length > LIMITS.instructionsChars) errors.push(`${where}: "instructions" is required, at most ${LIMITS.instructionsChars} characters`);
    else checkPromptText(where, agent.instructions, errors);
    const agentApps = checkStringList(`${where} "apps"`, agent.apps ?? null, LIMITS.apps, 64, errors);
    for (const app of agentApps) if (!apps.includes(app)) errors.push(`${where}: app "${app}" is not one of the plugin's apps`);
    const agentActions = checkStringList(`${where} "actions"`, agent.actions ?? null, LIMITS.declaredActions, 128, errors);
    if (agentActions.length === 0) errors.push(`${where}: name the actions this agent may use`);
    for (const action of agentActions) {
      if (!declaredSet.has(action)) errors.push(`${where}: uses "${action}", which plugin.json does not declare`);
      used.add(action);
    }
    const triggers = checkStringList(`${where} "triggers"`, agent.triggers ?? [], LIMITS.triggers, LIMITS.triggerChars, errors);
    if (agentActions.some((a) => declared.write.includes(a))) warnings.push(`${where}: this agent can change things (write actions). It will always ask before acting unless the user turns on auto-approve.`);
    agents.push({ id, name: agent.name, description: agent.description, instructions: agent.instructions, apps: agentApps, actions: agentActions, triggers });
  }

  for (const action of allDeclared) if (!used.has(action)) warnings.push(`plugin.json: "${action}" is declared but no skill or agent uses it — drop it so people are not asked to allow it`);

  return { dir, errors, warnings, files, manifest, declared, skills, agents, hash: packageHash(files) };
}
