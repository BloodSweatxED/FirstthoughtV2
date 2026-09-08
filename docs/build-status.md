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

**Minute 4.** The facilitator pulls the responses into the app and the aggregate
appears: how many of the group named each dangerous diagnosis, which organ
systems nobody mentioned, and anything the tool could not recognise.

**Minutes 4 to 6.** The facilitator debriefs from what is on screen. The app
supplies one teaching pearl. The instruction is to talk about the misses, not
the hits.

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

**2. A live path from Qualtrics into the display.** This is the largest
functional gap and it is on the critical path for January. Right now the app can
only be fed by typing responses in by hand. In an actual session the facilitator
needs to get 6 phone submissions onto the screen in about fifteen seconds.

The realistic answer is a paste box: the facilitator copies the response column
out of Qualtrics and pastes it into the app, which splits and scores it. A live
API connection is not workable because it would require putting a Qualtrics
token in a web page. **Until the paste path is built, the app cannot be run in a
real classroom.**

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

1. The paste path built, so the tool can actually be demonstrated running.
2. One full case reviewed and signed off by one physician, to prove the review
   process works before asking three people for twenty-six.
3. A single session run end to end with real people, even if they are five
   colleagues rather than students. Time it. Find out whether six minutes is
   really six minutes.

Step three is the one that will change your mind about something. Every teaching
tool feels different in a room than it does on a laptop.

Only then is the memo worth sending, because at that point you can offer to show
Sandra Oza the thing working rather than describe it.
