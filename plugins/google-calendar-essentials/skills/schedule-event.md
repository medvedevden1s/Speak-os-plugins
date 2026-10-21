---
name: Schedule an event
app: googlecalendar
triggers: book a call with, schedule a meeting, add to my calendar, put on my calendar, set up a meeting
needs: what it is, the day and time, who is invited (for a meeting)
actions: GOOGLECALENDAR_FIND_FREE_SLOTS, GOOGLECALENDAR_CREATE_EVENT
---
1. Collect the title, the day and start time, and the length (30 minutes when the user did not say). For a meeting, also who to invite; ask for an email address if you only have a first name and the user's notes do not give one.
2. Check that the time is free. If it clashes, say with what and offer the nearest free slot instead.
3. Create the event on the primary calendar in the user's time zone, inviting the attendees.
4. Confirm it with the day, time and attendees exactly as created.
