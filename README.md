# Speak OS plugins

Plugins teach [Speak OS](https://speakos.remskill.com) how to get real work done in the apps it connects to: Gmail, Google Calendar, Slack and 1,000 more. A plugin is a small, reviewed package of **skills** (what to say and how the assistant should handle it) and ready-made **agents**, for one or more apps.

This repository is the public home of every approved plugin. Anyone can read them, suggest changes, or publish a new one. Installing and using plugins needs a Speak OS Pro account.

## Using a plugin

1. In Speak OS, open **Tools** and connect the app (for example Gmail).
2. Open the app, or the **Plugins** list, and pick a plugin.
3. Check what it is allowed to do, then click **Install**.
4. Just ask: "catch me up on my email".

## What a plugin is

```
plugins/gmail-essentials/
  plugin.json        name, version, apps, and every action it may use
  README.md          the store listing
  icon.svg           optional
  skills/*.md        one skill per file: trigger phrases + instructions
  agents/*.json      optional ready-made agents
```

A plugin is **text only**. It contains no code, can only use the app actions it declares, and cannot change Speak OS settings or read your Memory. You see every action it may use before you install it, and an agent added from a plugin can only read on a schedule unless you allow it to act. The full format is in [docs/FORMAT.md](docs/FORMAT.md).

## Publishing a plugin

1. Fork this repository and copy `plugins/gmail-essentials` as a starting point.
2. Edit it, then run `node scripts/validate.mjs` (Node 20 or newer, nothing to install).
3. Open a pull request. The checks run automatically, then a maintainer reviews it.
4. **Merged means approved**: every Speak OS user can then install it.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before you start. It covers the review rules.

## Official plugins

| Plugin | App | Skills |
|---|---|---|
| [Gmail Essentials](plugins/gmail-essentials) | Gmail | summarize unread, find, draft a reply, send, reply in a thread |
| [Google Calendar Essentials](plugins/google-calendar-essentials) | Google Calendar | today's agenda, find free time, schedule, move an event |
| [Slack Essentials](plugins/slack-essentials) | Slack | catch up on a channel, find a message, send, set a reminder |

## License

Everything in this repository is MIT licensed. By opening a pull request you agree your plugin is published under the same license.
