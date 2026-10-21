---
name: Find free time
app: googlecalendar
triggers: when am I free, find a free slot, do I have time on, when can I fit in
needs: which day or range of days
actions: GOOGLECALENDAR_FIND_FREE_SLOTS
---
1. Work out the window the user means. "Thursday afternoon" is 12:00–18:00 that Thursday; a bare day is 09:00–18:00 unless their notes say other working hours.
2. Find the free slots on their primary calendar in that window.
3. Offer at most three slots that are long enough for what they want to fit in (30 minutes when they did not say).
4. Do not create anything. If they pick a slot, schedule it with the "Schedule an event" skill.
