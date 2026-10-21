---
name: Catch up on a channel
app: slack
triggers: catch me up on, what's happening in, summarize the channel, what did I miss in
needs: which channel
actions: SLACK_FIND_CHANNELS, SLACK_FETCH_CONVERSATION_HISTORY
---
1. Find the channel the user named. If two channels fit, ask which.
2. Read its messages from the last 24 hours (or the window the user gave), at most 100.
3. Summarize in a few lines: the main topics, any decision that was made, and any question addressed to the user or waiting for an answer.
4. Name people by their display names. Do not quote whole messages unless asked.
