---
name: Draft a reply
app: gmail
triggers: draft a reply, write a reply to, prepare an answer to, draft a response
needs: which email to reply to, what the reply should say
actions: GMAIL_FETCH_EMAILS, GMAIL_FETCH_MESSAGE_BY_THREAD_ID, GMAIL_CREATE_EMAIL_DRAFT
---
1. Find the email the user means (sender and topic). If more than one fits, ask which.
2. Read the whole thread so the reply answers what was actually asked.
3. Write the reply in the user's voice: short, the answer first, no filler. Use the language the other person wrote in.
4. Save it as a DRAFT in the same thread, addressed to the sender. Never send it.
5. Read the draft back to the user and say it is waiting in Drafts.
