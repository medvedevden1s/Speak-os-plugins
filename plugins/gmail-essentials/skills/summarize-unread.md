---
name: Summarize unread email
app: gmail
triggers: catch me up on email, summarize my inbox, what's new in my email, any new emails, did I get anything important
needs:
actions: GMAIL_FETCH_EMAILS
---
1. Fetch unread messages in the inbox from the last 24 hours (Gmail query `is:unread in:inbox newer_than:1d`), at most 25. If the user named a different window ("this week", "since Monday"), use that instead.
2. Split them into two groups: messages a person wrote to the user, then newsletters, receipts and automatic notifications.
3. For each personal message give one line: who it is from, the subject, and what they want from the user.
4. Summarize the second group in one sentence ("plus 9 newsletters and 3 receipts").
5. Finish with the messages that look like they need a reply today, if any.

Do not mark anything as read, archive anything, or reply unless the user asks.
