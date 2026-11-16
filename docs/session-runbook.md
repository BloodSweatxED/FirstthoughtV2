# Running and filming a session

For one instructor, six learners, a projector, and about 25 minutes.

## The day before

- Open the live site. The home page must not show the yellow "Demo mode" banner.
- Create the room, or open the one you already made. Use "Copy host link" and save the link somewhere you can reach from the classroom laptop.
- Print the poster from the host view as a backup for the QR code.
- Decide the three cases and levels. Write them on a card.
- Charge the camera. Clear space on the laptop for a screen recording. One hour of 1080p video is 2 to 5 GB.

## Gear

- Laptop on the projector, with the host view open.
- Screen recorder on that laptop. QuickTime on a Mac or OBS on anything. Record the full screen at 1080p.
- One camera on a tripod, wide, from the back corner. It should see the learners and the projector.
- A second phone for close shots of hands and phones. Optional.
- Audio from a phone voice memo on the table. Camera microphones at the back of a room are hard to hear.
- One volunteer who screen records their own phone for a round. On an iPhone this is in Control Center.

## Before learners arrive (10 minutes)

1. Open the host link. Click **Hold room for a session**. Learners who scan now get a waiting screen instead of today's self-run case.
2. Click **Present**.
3. Start the screen recording. Leave it running for the whole session. It is easier to cut one long file.
4. Start the room camera and the voice memo. Clap once on camera so the audio can be lined up later.
5. Seat anyone who opted out of filming outside the camera frame.

## Run of show

**Intro, 2 minutes.** Say these four things:

- This is practice. Nothing is graded and nothing has your name on it.
- You will see a chief complaint and almost nothing else. That is on purpose.
- Write every cause you can think of. Include what could kill the patient.
- Your answer goes up on the screen as you wrote it, without your name.

**Join, 1 minute.** Point at the QR code. Wait until every phone shows "You're in".

**Round 1, about 7 minutes.**

1. Pick the case and level. Click **Start 4-min round**.
2. Stay quiet. Watch the answer count climb. Let the clock run. This is the shot of the room thinking.
3. When all six are in, or at time, click **Reveal to room**.
4. Read the red line out loud: "Nobody named ...". Ask why it matters.
5. Point at one diagnosis that sits on both lists. Ask whether likely and dangerous are the same question.
6. Read the pearl. One minute.

**Round 2 and round 3, about 7 minutes each.** Same steps. Raise the level for at least one round so the extra patient information shows on screen.

**Recap, 2 minutes.** Exit presenting. Click **Session recap**. Read the headline: what the room caught against what the typical learner caught alone. This is the main number for the pitch.

**Reactions, 3 minutes.** Ask two or three learners, on camera, one question each:

- What was it like to commit with that little information?
- Would you have said that answer out loud?
- What will you do differently on the next one?

## Before leaving the room

- On the recap page, click **Download this session (CSV)**.
- Click **Print** and save as PDF.
- Stop the recordings. Check that each file opens.
- Click **End, back to self-run** on the host view.

## Shot list

The edit needs each of these at least once:

1. Wide: the room scanning the QR code.
2. Close: a phone showing the chief complaint and the clock.
3. Close: hands typing a differential.
4. Screen: the answer count going from 0 to 6.
5. Wide: the moment of reveal, with faces.
6. Screen: the "Nobody named" line and the two lists.
7. Close: a phone showing "How you compare".
8. Wide: you teaching from the screen.
9. Screen: the recap headline.
10. Two or three learner reactions.

## If something goes wrong

- **A phone will not join.** Have them type the room code on the home page. If it still fails, switch that phone from Wi-Fi to cellular.
- **The count stops moving.** Wait ten seconds. The page retries by itself. Then reload the host view. Nothing is lost.
- **A learner reloads or locks their phone.** Their typing and their clock are kept.
- **A learner misses the reveal.** Their phone shows the room's answers instead of an answer box.
- **The site is down or the network blocks it.** Run the session from the laptop:

```bash
node scripts/fake-apps-script.mjs 8787
```

```bash
VITE_SHEETS_URL=http://LAPTOP-IP:8787/exec npx vite build --outDir dist-rehearse
```

```bash
npx vite preview --outDir dist-rehearse --host
```

Replace `LAPTOP-IP` with the laptop's address on the Wi-Fi. Phones on the same Wi-Fi join at the address the last command prints. Data lives only until the first command stops, so download the CSV before closing it. Test this at the dry run. Some school networks stop devices from reaching each other.

- **Nothing works.** Run it on paper and film that. The exercise is the product. Then show the app with a sample room in the pitch.
