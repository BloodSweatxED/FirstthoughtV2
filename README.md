# First Thought

A four-minute, low-information differential diagnosis exercise for clinical reasoning microskills.

Learners scan a QR code, read a chief complaint, and write a differential on their phones. Answers stay hidden until the reveal, so no one anchors on the first answer. Then each learner sees their answer next to the room's: which can't-miss diagnoses they named, which the room named, and which nobody named.

The amount of case information scales by learner level:

- M1: chief complaint only
- M2: plus age and sex
- M3: plus symptom details and medical history
- M4: plus medications and risk factors

The intent is formative practice, not grading.

## Two ways a room runs

Each room has a permanent QR code. You can print it from the room's poster page and put it up in the classroom.

- **Self-run (no instructor).** The room serves a case of the day at the room's default level. Each learner gets their own 4 minutes and sees the room's answers right after submitting.
- **Instructor-led.** The host starts a 4-minute round with a chosen case and level. Answers stay hidden from everyone until the host clicks Reveal. A led round that nobody ends goes back to self-run after 90 minutes.

## Pages

- `/`: join a room or create one
- `/r/CODE`: learner view, for phones
- `/r/CODE/host`: host view, for the projector. Needs the room's host key. Use "Copy host link" to share it with a co-instructor.
- `/r/CODE/poster`: printable QR poster

## Data and privacy

Cases are synthetic. Nothing asks for a name. Each learner gets a new random id every round, so answers can't be linked across rounds.

Storage comes from one of two backends:

- **Google Sheets** when `VITE_SHEETS_URL` is set at build time. Setup: [docs/sheets-setup.md](docs/sheets-setup.md).
- **This browser only** otherwise. That's useful for a solo walkthrough, but phones can't join.

## How matching works

Learner answers are matched against a curated diagnosis dictionary in `src/data/diagnoses.ts`.
Matching uses whole words, and longer phrases win, so "migraine" never counts as MI and "cervical artery dissection" never counts as aortic dissection.
Text the dictionary does not recognize shows up as "?" on the whiteboard so faculty can see it and the dictionary can grow.

Answer keys in `src/data/cases.ts` are level-aware. Each level reveals more of the case, so can't-miss, most likely, and also-consider lists change with it.
The keys are a first draft and need faculty clinical review.

## Clinical review

`npm run export:keys` writes every answer key to `docs/review/answer-keys.md`. `docs/review/reviewer-prompt.md` is a prompt for an independent LLM triage pass.

## Tests

```bash
npm test
```

The tests cover the matcher, the answer keys, the room rules, and `apps-script/Code.gs` running against a fake Sheet.

## Local Development

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually `http://127.0.0.1:5173`.

## Build

```bash
npm run build
```

The production site is generated in `dist/`.

## Netlify Deploy

This repo includes `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Deploy options:

1. Push this repo to GitHub and connect it in Netlify. Netlify will detect the build settings.
2. Or deploy directly with the Netlify CLI:

```bash
npx netlify deploy --prod --dir=dist
```

Run `npm run build` first if deploying with the CLI. Set `VITE_SHEETS_URL` in Netlify's environment variables to go live (see docs/sheets-setup.md).
