# Contributing a plugin

Thank you for building one. A good plugin does one app's everyday jobs really well.

## Before you open a pull request

- [ ] `node scripts/validate.mjs` passes with no errors.
- [ ] Every skill has trigger phrases people actually say, and steps that say what NOT to do.
- [ ] Anything that sends, posts, books or deletes is a **write** action, and the skill reports success only after the action succeeded.
- [ ] No personal data: no real names, email addresses, account ids, or links.
- [ ] You bumped `version` if you changed an existing plugin.
- [ ] You tried it in Speak OS: **Tools → Plugins → Install from folder**.

## How review works

1. **Automatic checks** run on every pull request:
   - the format is valid
   - every action exists
   - skills use only declared actions
   - no code files
   - no links
   - no attempts to override the assistant's rules
2. **A maintainer reads every skill** and asks one question: could this make the assistant do something the user did not ask for?
3. **Merged means approved.** The plugin becomes available to every Speak OS Pro user.

Plugins that stop working (an app renames an action, say) are flagged and may be disabled until fixed. A plugin found doing something harmful is pulled from every installation.

## License

By opening a pull request you agree that your contribution is published under this repository's MIT license, and that you have the right to publish it.
