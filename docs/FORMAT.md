# Plugin format (version 1)

`scripts/validate.mjs` is the authority on every rule below. The Speak OS app applies the same rules again before it installs anything.

## plugin.json

```json
{
  "$schema": "../../schema/plugin.schema.json",
  "format": 1,
  "id": "gmail-essentials",
  "name": "Gmail Essentials",
  "version": "1.0.0",
  "description": "The everyday email skills.",
  "apps": ["gmail"],
  "actions": {
    "read": ["GMAIL_FETCH_EMAILS"],
    "write": ["GMAIL_CREATE_EMAIL_DRAFT"]
  },
  "author": { "name": "Your Name", "github": "your-github-username" },
  "license": "MIT",
  "category": "communication",
  "keywords": ["email"]
}
```

| Field | Rule |
|---|---|
| `id` | lowercase letters, digits and dashes; same as the folder name; never changes |
| `version` | `MAJOR.MINOR.PATCH`; bump it on every change |
| `apps` | the app ids the plugin works with (the same ids Speak OS shows on each app's page) |
| `actions.read` | actions that only look at data |
| `actions.write` | actions that create, send or change something. Users are shown these before installing, and an update that adds one asks them again |
| `license` | `MIT` in this repository |
| `category` | one of `productivity`, `communication`, `calendar`, `sales`, `marketing`, `support`, `developer`, `finance`, `other` |
| `minAppVersion` | optional; the oldest Speak OS version that can run the plugin |

Declare only what the skills and agents use. Every declared action must exist for one of the plugin's apps; CI checks this against the live catalog.

## skills/*.md

One skill per file. The file name is the skill id.

```md
---
name: Summarize unread email
app: gmail
triggers: catch me up on email, summarize my inbox, any new emails
needs:
actions: GMAIL_FETCH_EMAILS
---
1. Fetch unread messages from the last 24 hours, at most 25.
2. …
```

| Field | Rule |
|---|---|
| `name` | what the user sees, at most 60 characters |
| `app` | one of the plugin's `apps` |
| `triggers` | comma-separated phrases a user might say (1–10) |
| `needs` | comma-separated details the assistant must have before acting. It asks for any the user did not give, and never guesses them |
| `actions` | comma-separated actions this skill uses; each must be declared in plugin.json |

The text under the frontmatter is what the assistant follows. Write numbered steps, say what NOT to do, and keep it under 8 KB.

When a request matches a skill, Speak OS hands the app only the skill's actions. That makes it faster, and means the skill cannot wander into actions it did not declare.

## agents/*.json

Optional ready-made agents the user can add after installing.

```json
{
  "id": "morning-inbox-digest",
  "name": "Morning inbox digest",
  "description": "A short summary of what arrived overnight.",
  "instructions": "Fetch the unread messages … Only read; never reply.",
  "apps": ["gmail"],
  "actions": ["GMAIL_FETCH_EMAILS"],
  "triggers": ["morning digest"]
}
```

An agent added from a plugin can use only its `actions`, even when it runs on a schedule.

## What is not allowed

- Any file other than `plugin.json`, `README.md`, `icon.svg`, `skills/*.md` and `agents/*.json`. No code.
- Web addresses or email addresses in skills or agent instructions.
- Text that tells the assistant to ignore or reveal its own instructions.
- Personal data of any kind: names of real people, account ids, links to private documents.
- Scripts, event handlers or external links in `icon.svg`.

## Limits

| | Limit |
|---|---|
| Skills per plugin | 20 |
| Agents per plugin | 5 |
| Skill or agent file | 8 KB |
| README | 32 KB |
| Icon | 16 KB |
| Whole plugin | 128 KB |
| Declared actions | 40 |
