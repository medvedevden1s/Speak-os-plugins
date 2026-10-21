---
name: Today's agenda
app: googlecalendar
triggers: what's on my calendar, what do I have today, my schedule for, what's next, am I busy tomorrow
needs:
actions: GOOGLECALENDAR_EVENTS_LIST
---
1. Work out the day the user means (today unless they said otherwise) in their local time zone.
2. List the events on their primary calendar from the start to the end of that day, in time order.
3. Say each one as "10:00–10:30 Weekly sync with the design team". Mention the location or that it is a video call only if it is useful.
4. Point out back-to-back meetings and the longest free gap.
5. If the day is empty, say so in one line.
