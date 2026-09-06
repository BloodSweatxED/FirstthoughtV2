# Answer key review

Every can't-miss list, important-miss list, and teaching pearl in this app is
**draft** until three reviewing physicians sign off. This file is the record of
that review. Nothing here should go in front of students before the sign-off
table at the bottom is filled in.

## Why this matters

The app tells an instructor, in front of a room, that the group missed a
dangerous diagnosis. If the key is wrong, the app teaches the wrong thing and
the pilot measures the wrong thing. The key is the intervention.

## What a reviewer is being asked

For each case, answer four questions.

1. **Is the can't-miss list correct?** These are the diagnoses that change
   immediate management or disposition and that would harm the patient if
   missed on a first pass. Five is the target. Say what to add or remove.
2. **Is the important-miss list correct?** These are common or instructive
   diagnoses that are not immediately lethal. Three is the target.
3. **Is the pearl accurate and teachable in sixty seconds?**
4. **Is this appropriate for the learner level it will be shown at?** The
   pilot runs in Becoming a Physician with MS1 and MS2 students. A diagnosis
   that only makes sense to a fourth year does not belong in the key.

## Known bias in the current draft

The draft cases were written from an emergency medicine point of view. They
lean toward acute, undifferentiated presentations and toward disposition
thinking. Reviewers should flag anywhere that conflicts with what the course is
actually teaching in that week. At least one reviewer should be someone who
teaches in the course, not only emergency physicians, so the key matches the
course objectives and not just emergency practice.

## Reviewing the term table

`src/scoring/diagnoses.ts` holds every name and abbreviation the app will
accept for a diagnosis. If a student writes a correct answer that is not in
that list, the app scores it as a miss. During each session the app collects
everything it did not recognise and shows it under "Not recognised by the term
table." Those lists should be reviewed after every session and fed back into
the table.

Rules for adding a term:

- Add whole diagnosis names and standard abbreviations only.
- Never add a loose fragment such as "bleed", "mass", "rupture", or
  "obstruction" on its own. Those words appear in several unrelated diagnoses
  and were the cause of the false positives in the first version.
- If a term is also an ordinary English word, add it to `CASE_SENSITIVE_TERMS`
  in `src/scoring/match.ts` so it only counts in capitals.
- Add a test in `src/scoring/match.test.ts` for anything ambiguous.

## Disagreement rule

Where the three reviewers disagree on whether a diagnosis belongs on a
can't-miss list, the rule is: it stays on the list only if at least two of
three agree. Record the disagreements below. Do not quietly resolve them, since
the disagreements themselves are useful teaching material and are worth
reporting in the pilot writeup.

## Case sign-off

| Case | Reviewer 1 | Reviewer 2 | Reviewer 3 | Date | Changes made |
| --- | --- | --- | --- | --- | --- |
| Chest pain | | | | | |
| Shortness of breath | | | | | |
| Abdominal pain | | | | | |
| Headache | | | | | |
| Syncope | | | | | |

## Reviewers

| Name | Role | Specialty | Teaches in the course |
| --- | --- | --- | --- |
| | | | |
| | | | |
| | | | |
