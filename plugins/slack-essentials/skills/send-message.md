---
name: Send a Slack message
app: slack
triggers: tell the channel, post in, message on Slack, send a Slack message to, let the team know
needs: which channel or person, what to say
actions: SLACK_FIND_CHANNELS, SLACK_FIND_USERS, SLACK_SEND_MESSAGE
---
1. Find where it goes: a channel by name, or a person for a direct message. If two fit, ask which; never post to a channel the user did not name.
2. Write the message exactly as the user asked, in their voice, without adding greetings they did not say.
3. Post it.
4. Confirm it was posted only if the send action succeeded.
