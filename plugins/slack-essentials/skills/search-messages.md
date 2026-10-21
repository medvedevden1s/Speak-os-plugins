---
name: Find a Slack message
app: slack
triggers: find the message where, search Slack for, who said, when did someone mention
needs: what the message was about
actions: SLACK_SEARCH_MESSAGES
---
1. Turn the request into a Slack search: the key words, plus `from:` for a person and `in:` for a channel when the user named them, and `after:` for a time.
2. Show at most five matches, newest first: who, where, when, and one line of the message.
3. If nothing matches, say so and suggest one broader search.
