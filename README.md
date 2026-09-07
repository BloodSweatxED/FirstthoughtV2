# First Thought V2

A low-information differential diagnosis whiteboard for clinical reasoning
practice. Faculty open a synthetic chief complaint, students write a first-pass
differential in four minutes, and the app shows the group where the reasoning
was broad, where it was narrow, and which dangerous diagnoses nobody named.

The amount of case information scales by learner level:

- M1: chief complaint only
- M2: chief complaint plus basic patient demographics
- M3: demographics, symptom details, and medical history
- M4: fuller case frame with medications and risk factors

The intent is formative practice, not grading. Short repeated reps that help
learners reason early, tolerate uncertainty, and separate most likely from most
dangerous.

## How the scoring works

The app does not use a language model. It matches what students write against a
curated table of diagnosis names and abbreviations in `src/scoring/diagnoses.ts`.

Matching is done on whole word sequences, never on substrings, and the longest
match wins. This matters: an earlier version used substring matching, which
scored "migraine" as an acute coronary syndrome, "appendicitis" as a pulmonary
embolism, and "brain bleed" as a GI bleed. Every one of those cases is now a
test in `src/scoring/match.test.ts`.

Anything a student writes that the table does not recognise is collected and
shown to the instructor rather than being silently scored as a miss. Review
those after each session and add real answers to the table.

### Two coverage numbers, and only one of them is an outcome

The app reports can't-miss coverage twice.

- **Mean individual coverage** is the average, across students, of the share of
  the case's can't-miss list that each student named on their own. This is the
  number to analyse and the number to compare between groups.
- **Named by at least one student** is the union across the whole room. It only
  ever goes up as more students submit, so a larger group will always score
  higher than a smaller one regardless of how well anyone reasoned. It is a
  teaching display for the debrief. Do not compare groups on it.

## How students submit

Students submit through a Qualtrics form on their own device. Qualtrics is
already licensed, security reviewed, and backed up by the institution, so no
student data touches this application's storage and there is no separate server
to approve or maintain.

Export the responses from Qualtrics, then score them with the same code the
classroom display uses:

```bash
npm run score -- --input export.csv --list-columns

npm run score -- --input export.csv \
  --id-column Q1 --response-column Q2 \
  --case chest-pain --level M1 --arm intervention --session w03 \
  --out scored.csv
```

Qualtrics exports carry IP address, location, and recipient email by default.
Ingestion drops every one of those columns and reports what it dropped, so the
analysis file cannot carry them even by accident.

## Data

One row per submission, exported as CSV, with the raw text alongside every
derived score so a disputed score can be checked against what the student
actually wrote.

Study IDs are entered by the instructor and never leave the browser. The app
holds no crosswalk between a study ID and a student name. That crosswalk lives
outside the app with a data custodian who is not the investigator.

The app is browser-only:

- no PHI
- no student names
- no backend
- no external model calls
- formative use only

## Answer keys are draft

The can't-miss lists, important-miss lists, and pearls have not been signed off
by the reviewing physicians yet, and have not been checked against the course
objectives. See `docs/answer-key-review.md`.

## Development

```bash
npm install
npm run dev      # local server
npm test         # scoring and export tests
npm run lint
npm run build    # production build in dist/
```

## Deploy

`netlify.toml` is set up for Netlify. Connect the repo in Netlify and it will
pick up the build settings, or deploy the built `dist/` directory with the
Netlify CLI.

## License

MIT. See `LICENSE`.
