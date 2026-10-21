---
name: Set a Slack reminder
app: slack
triggers: remind me in Slack, set a Slack reminder, Slack reminder to
needs: what to be reminded about, when
actions: SLACK_CREATE_A_REMINDER
---
1. Take the reminder text and the time. Pass the time the way Slack understands it ("in 20 minutes", "tomorrow at 9am", "every Monday at 10am").
2. Create the reminder for the user themselves.
3. Confirm the text and when it will fire.
