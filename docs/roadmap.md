# Roadmap to the December pitch

Written November 16, 2026. The goal is a working product, one filmed session with MS1 and MS2 learners, and a short video that carries the pitch.

The dates below count back from the filmed session. Fill in the real dates once the session and the pitch are booked.

## Where things stand

Built and tested:

- Learners join by QR code and answer on their phones. No names, no accounts.
- Instructor-led rounds with a 4-minute clock. Answers stay hidden until the reveal. The reveal closes the round.
- Self-run rooms with a case of the day for when no instructor is present.
- A held room, so learners who scan early wait for the instructor instead of starting on their own.
- The reveal leads with most likely vs. most dangerous, and names the can't-miss diagnoses nobody wrote.
- Each learner sees their own answer against the key and the room.
- A session recap with the room against the typical learner, and a CSV export.
- A Present button for projecting and screen recording.
- Five cases, each with a different answer key at M1, M2, M3, and M4.
- 91 automated tests. A full simulated session passes: one host, six phones, two rounds, reveal, recap, export.

Not done:

- The site is not connected to Google Sheets, so phones cannot join the live site yet.
- The answer keys have not had clinical review.
- Nothing has run on real phones on the classroom Wi-Fi.

## Step 1. Go live (you, about 30 minutes)

1. Follow [sheets-setup.md](sheets-setup.md) on a personal Google account. Paste in `apps-script/Code.gs` from this branch. It changed this week, so an older copy will not work.
2. Add `VITE_SHEETS_URL` in Netlify and redeploy.
3. Confirm which branch Netlify builds. This work is on `session-ready`. Either point Netlify at that branch or merge it into `main`.
4. Run the phone check in step 7 of the setup doc.

Everything after this depends on it.

## Step 2. Clinical sign-off (you, about 1 hour, plus one colleague)

1. Paste [review/reviewer-prompt.md](review/reviewer-prompt.md) and [review/answer-keys.md](review/answer-keys.md) into a second LLM. Send back the flag table.
2. Read the flags and decide. The changes get applied the same day.
3. One colleague reads the final keys and signs off. The pitch can then say the keys were reviewed by two physicians.
4. Pick the three cases and levels for the filmed session. Suggested: chest pain at M1, abdominal pain at M2, headache at M2. The abdominal pain key changes the most between M1 and M2, which makes the level idea easy to see.

Two matcher questions need your call. In a test run, "angina" and "high blood pressure" were not recognized. Should "angina" count as acute coronary syndrome? Should "high blood pressure" count as hypertensive emergency in a headache differential?

## Step 3. Permission to film (start now, it has the longest lead time)

These are questions for the course director and the school, not things this doc can answer:

- What consent or media release does the school need to film students in a teaching session and show it to a committee?
- Does a student on camera need to be able to opt out and still take part? Plan for yes. Seat them out of frame.
- Is this program evaluation or research? If the committee hears "study," they will ask about IRB. The pitch should say the filmed session was a teaching demonstration and that a study would go through IRB first.
- Can the committee video be shown outside the school later? Ask now so the release covers it.

The app itself stores no names, emails, or device identifiers. Say that in the request.

## Step 4. Dry run (one week before filming, 30 minutes)

Use the real classroom, the real projector, and the real Wi-Fi. Bring two or three colleagues or residents with their own phones.

- Run two rounds from start to recap using [session-runbook.md](session-runbook.md).
- Have one phone on Wi-Fi and one on cellular. School networks sometimes block Google script addresses.
- Time the gap between a submit and the count changing on the projector. Expect 3 to 6 seconds.
- Open the recap. Anything under "Not in the dictionary" that is a real diagnosis gets added before filming.
- Record the screen for one round to check that the recording software works.

If the Wi-Fi blocks the site, the fallback is in the runbook.

## Step 5. Film the session

Follow [session-runbook.md](session-runbook.md). Three rounds take about 25 minutes. Export the CSV and save the recap as a PDF before leaving the room.

## Step 6. Cut the video and build the pitch (the week after filming)

Follow [pitch-video.md](pitch-video.md). The video is 3 to 4 minutes. A one-page summary and three backup slides go with it.

The numbers for the one-page summary come straight from the recap page.

## Step 7. Rehearse and freeze (the week before the pitch)

- Watch the video with one person outside the project. Fix what confuses them.
- Rehearse the live fallback: open the host view, fill a sample room from Rehearsal tools, reveal. It takes 40 seconds and needs no audience phones.
- Merge `session-ready` into `main`. No code changes in the last three days.

## What gets built next

In order. The first two wait on you.

1. Apply the clinical review flags and the two matcher decisions.
2. Fix whatever the dry run breaks.
3. Add three to five cases after review: altered mental status, back pain, fever, weakness, vaginal bleeding. One review pass can cover them.
4. Optional exit question after the reveal: "How comfortable were you committing with this little information?" on a 1 to 5 scale. This gives the committee a second measure. It adds a column to the Sheet, so decide before the filmed session or leave it for the pilot.
5. Optional faculty pass that uses an LLM to read the answers the matcher could not. Kept out of the live path so the demo stays predictable.

## Risks

- **School Wi-Fi blocks Google script addresses.** Found at the dry run. Fallback: phones on cellular, or the laptop rehearsal server in the runbook.
- **Google is slow on the day.** Each action takes 1 to 3 seconds. If the dry run feels sluggish on camera, the storage can move to Netlify with a day of work. The decision to use Sheets stands unless the dry run says otherwise.
- **A key is wrong on camera.** Step 2 exists to prevent this. Film only cases that two physicians have signed off.
- **A student writes something that should not be on a projector.** Answers are anonymous and shown as written. Say so in the intro. You control the reveal and can skip the whiteboard.
- **Consent is not in place in time.** Film the screen and hands only, or film with residents or faculty volunteers standing in.

## Known gaps

- A host key in a shared link gives full control of that room. Share it only with co-instructors.
- A learner can answer the same round twice from two devices or a private window. Fine for a taught session. A study would need a join code per learner.
- Sample answers from Rehearsal tools are stored in the Sheet. The recap can leave them out. Delete those rows before sharing the Sheet with the committee.
