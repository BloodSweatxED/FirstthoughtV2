# What is built, what is not, and how a session actually runs

Written so the tool can be reviewed honestly before anything is proposed to the
course. Read the second half first if you are short on time. The gaps matter
more than the features.

---

## How one session is meant to run

Six minutes total.

**Minute 0.** The facilitator opens the app on the room display and picks the
case and the level. MS1 groups see the chief complaint alone or with basic
demographics. MS2 groups see symptom details and history as well. The screen
shows one line: *A patient presents with chest pain.* Nothing else.

**Minutes 0 to 4.** Students open a Qualtrics link on their phones and write a
differential. They work alone. They are not told what a good answer looks like
and the app shows them nothing while the timer runs. This is the part that does
the teaching.

**Minutes 4 to 6.** The facilitator debriefs from a printed answer key. Nothing
is displayed to the room and no software runs in the classroom. The instruction
is to talk about the misses, not the hits.

**The following week, minute 0.** Each student gets a paper slip back, labelled
with their study number and nothing else, showing what they named and what they
missed on the previous case. This is the part that does most of the teaching, so
it is not optional.

Nothing is graded. No student's name appears anywhere.

---

## What exists today

**The scoring engine.** 67 diagnoses with curated names and abbreviations.
Matching is on whole word sequences with longest match winning, so "migraine"
does not score as a heart attack and "appendicitis" does not score as a
pulmonary embolism. 55 tests, including one for every false positive found in
the first version.

**Per student scoring with denominators.** The app reports the mean individual
can't-miss coverage as the analysable number, and separately shows the room-wide
union clearly labelled as a teaching display. The second number rises with
attendance and must never be used to compare groups.

**An unrecognised-answer list.** Anything a student writes that the term table
does not know is shown to the facilitator rather than being silently counted as
a miss. This is how the term table improves during the pilot.

**CSV export.** One row per submission, with the raw text next to every derived
score, so a disputed score can always be checked against what the student wrote.

**Qualtrics ingestion.** A command line tool reads a Qualtrics export, strips
every identifying column Qualtrics attaches by default (IP address, location,
recipient email) and reports what it dropped, then scores the responses with the
same code the classroom display uses.

**Five cases**, with draft can't-miss lists, important-miss lists, and pearls.

**The M1 through M4 information scaffold**, a four minute timer, and the
facilitator display.

---

## What does not exist

This is the part to read carefully.

**1. The Qualtrics form itself.** Not built. This is a half day of work but it
has to be designed once and reused for every session, including how the study ID
is captured and how the case is identified.

**2. Twenty-one more facilitation cards, each written four times.** This is the
critical path, and it is four times the work it looks like.

Nothing is displayed in the classroom, so the card is the intervention. The
amount of information a student receives is scaled to their level, which means
the stem, what counts as a good answer, the probes, and the reasoning trap all
differ between M1 and M4. A level-agnostic card is wrong for three levels out of
four. The chest pain card names anchoring on a known reflux history as its trap,
and an M1 student never sees that history at all.

One card exists, for chest pain, written across all four levels. Print it with
`npm run card -- --case chest-pain --level M2`.

Each card carries the opening line, the round-the-room prompt and what to do
when a student says "same as theirs", one lethality line and one recognition
line for every can't-miss diagnosis, three probes for a quiet room, the specific
reasoning trap on that case, and a sixty second close.

This is clinical writing, not code, which puts the three reviewing physicians on
the critical path with it. A case without a signed card cannot be used.

Weekly individual feedback slips were considered and dropped. The round-the-room
discussion already gives students corrective feedback while their own answer is
still live, which is most of what slips would have provided. What discussion
cannot do is show a pattern across weeks, so that is handled by two personal
summaries per block instead of twenty slips. That drops the recurring
operational burden from about 220 batch runs to 44.

A live in-room display was also considered and dropped. It would require a
server, a security review, and a maintainer, and it would put a point of failure
in front of 22 facilitators twenty times each.

**3. Twenty-one more cases.** Five exist. Sixteen to twenty sessions with no
repeats, plus spares, plus cases held back for the baseline task and the OSCE
keys, needs about twenty-six.

**4. Answer key sign-off.** Every key in the app is draft. No physician has
reviewed any of them. Nothing should run in front of students until three have.

**5. The OSCE scoring path.** The protocol says the same engine scores the OSCE
post-encounter notes. That requires an expert key for each OSCE case and a way
to get the notes out of whatever system holds them. Neither exists yet, and
neither can be built without the assessment office.

**6. The baseline task.** Needs a case, a Qualtrics form, and a decision about
when in the calendar it runs.

**7. A facilitator script and training.** Twenty-two instructors have to run
this consistently without you in the room. One page, plus a short training
session.

**8. An accessibility pass.** Keyboard navigation, screen reader labels, colour
contrast. A tool provided to a whole class will be asked about this.

**9. A fallback for when it breaks.** If the display fails mid session, the
facilitator needs a paper version that still works. Twenty-two instructors times
twenty sessions means something will fail at some point.

---

## What I would want to see before proposing this to anyone

In order:

1. The chest pain card reviewed and signed off by one physician, to prove the
   review process works before writing twenty-five more.
2. A single session run end to end with real people, even if they are five
   colleagues rather than students. Time it. Find out whether four minutes plus
   the round-the-room is really six minutes, and whether the card carries a
   facilitator who is not an emergency physician.
3. The remaining cards drafted, once the shape has survived contact with a room.

Step three is the one that will change your mind about something. Every teaching
tool feels different in a room than it does on a laptop.

Only then is the memo worth sending, because at that point you can offer to show
Sandra Oza the thing working rather than describe it.
