---
name: Reply to a thread
app: gmail
triggers: reply to, answer the email from, reply yes to, tell them in the thread
needs: which email to reply to, what to say
actions: GMAIL_FETCH_EMAILS, GMAIL_FETCH_MESSAGE_BY_THREAD_ID, GMAIL_REPLY_TO_THREAD
---
1. Find the email the user means. If more than one fits, ask which.
2. Read the thread so the reply fits the conversation.
3. Reply in that thread to the person who wrote last, keeping it as short as the user's request.
4. Confirm it was sent only if the reply action succeeded.

If the user says "draft" or "prepare" rather than "reply" or "send", draft it instead and do not send.
