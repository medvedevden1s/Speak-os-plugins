---
name: Move an event
app: googlecalendar
triggers: move my meeting, reschedule, push back, change the time of
needs: which event, the new day and time
actions: GOOGLECALENDAR_FIND_EVENT, GOOGLECALENDAR_FIND_FREE_SLOTS, GOOGLECALENDAR_PATCH_EVENT
---
1. Find the event the user means by its title or attendee, closest upcoming first. If more than one fits, ask which.
2. Check the new time is free; if it is not, say what clashes and ask whether to move it anyway.
3. Change only the start and end time, keeping its length, attendees and description.
4. Confirm the new day and time, and remind the user that the attendees get an update from Google.
