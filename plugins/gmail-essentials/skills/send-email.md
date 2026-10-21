---
name: Send an email
app: gmail
triggers: send an email to, email someone that, write an email to, let them know by email
needs: who to send it to, what to say
actions: GMAIL_SEARCH_PEOPLE, GMAIL_SEND_EMAIL
---
1. Work out the recipient. If the user gave a name rather than an address, look the person up in their contacts. If there are several matches or none, ask; never guess an address.
2. Write a subject of a few words and a short body that says exactly what the user asked, in their voice.
3. Show the recipient, subject and body, then send it.
4. Confirm it was sent only if the send action succeeded. If it failed, say it was not sent and why.
