---
name: Find an email
app: gmail
triggers: find the email from, search my email for, where is the email about, look up the email
needs: who it is from or what it is about
actions: GMAIL_FETCH_EMAILS, GMAIL_FETCH_MESSAGE_BY_THREAD_ID
---
1. Turn the request into a Gmail search query: `from:` for a person, quoted words for a subject, `newer_than:` or `after:` for a time ("last week" → `newer_than:7d`), `has:attachment` when they mention a file or invoice.
2. Fetch at most 10 matches, newest first.
3. If one message clearly matches, open its thread and tell the user who sent it, when, and the gist in two sentences.
4. If several match, list them (sender, date, subject) and ask which one they mean.
5. If nothing matches, say so and suggest one broader search (drop the date, or search the words instead of the sender).
