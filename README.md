# MKTG644 Exam Prep Quiz

A mobile-first practice app for MKTG644 AI-Powered Marketing (SMU MBAI, Prof. Ernst Osinga): 237 MCQs, 58 short-answer questions and 7 mini-cases with A+ explanations and exam traps. No backend, no accounts, no trackers. Progress lives in the browser's localStorage, per named profile, so several course mates can share one device.

Stack: Vite 6 · React 18 · TypeScript · Tailwind 3 · Framer Motion · canvas-confetti · vite-plugin-pwa · react-router (HashRouter, so it works on any static host).

## Deploy in 5 clicks (GitHub → Vercel)

1. Create an empty repository on GitHub (e.g. `mktg644-exam-prep-quiz`).
2. In this folder:
   ```bash
   git init && git add -A && git commit -m "MKTG644 Exam Prep Quiz"
   git branch -M main
   git remote add origin https://github.com/<you>/mktg644-exam-prep-quiz.git
   git push -u origin main
   ```
3. Go to vercel.com → **Add New… → Project** → import that repository.
4. Vercel detects Vite automatically (build `npm run build`, output `dist`). Click **Deploy**.
5. Share the URL (there is a **Copy link** button at `/#/welcome`). To install on a phone: iPhone Share → *Add to Home Screen*; Android/Chrome → *Install app*.

Every later `git push` redeploys automatically.

Run locally: `npm install` then `npm run dev` (http://localhost:5173).

## Add Session 10 (or more questions)

All content is one file: `public/content/questions.json`.

```json
{
  "sessions":  [ { "id": "S10", "name": "Agentic Marketing Workflows", "family": "analytics", "colour": "5B21B6" } ],
  "questions": [ { "id": "S10-M01", "session": "S10", "sessionName": "Agentic Marketing Workflows", "kind": "definition",
                   "difficulty": "easy", "stem": "…", "options": ["A","B","C","D"], "answer": 2,
                   "explanation": "…", "trap": null, "source": "S10 slide 7", "tags": [] } ],
  "shorts":    [ { "id": "S10-S01", "session": "S10", "sessionName": "…", "stem": "…", "model": "…", "minimum": "…", "marking": ["…"], "source": "…" } ],
  "cases":     [ { "id": "S10-C01", "session": "S10", "sessionName": "…", "scenario": "…", "questions": [ { "q": "…", "model": "…" } ] } ],
  "tips":      { "S10": [ "…", "…", "…" ] }
}
```

1. Append the new session object to `sessions` (order of this array = order in the app; `colour` is a hex without `#`).
2. Append MCQs to `questions`, short questions to `shorts`, cases to `cases`, and a `tips.S10` array.
3. `answer` is the 0-based index of the correct option. Options are shuffled in Random/Mock/Review modes; the app keeps the mapping, but write explanations that name the *content* of the distractor rather than its letter.
4. Commit and push; Vercel redeploys. Existing users keep their progress (the store is versioned; question ids must stay unique and stable).

The same JSON is produced by the question-bank build script (`questions.json` from the docx build), so you can regenerate it wholesale.

## Change the title

Search and replace `MKTG644 Exam Prep Quiz` in `index.html` (page title), `vite.config.ts` (PWA manifest name/short_name) and `src/App.tsx` / `src/pages.tsx` (header, name gate, welcome page). Icon: `public/icon.svg`.

## Features

- Profiles on one device (name gate, switcher, rename, delete), versioned localStorage schema with migration, export/import as JSON text to move progress between phone and laptop.
- Modes: Study by topic · Randomised practice (sessions, count, difficulty; shuffles questions and options) · Timed mock (60 MCQs / 75 min, back/forward, submit, results) · Short-answer drill (reveal model, minimum, marking guide; self-grade 0–2) · Mini-cases · Wrong + flagged review (randomisable) · Last-day checklist (ten recall lists + every session's tips).
- Flag/unflag; stats (per-session accuracy, overall %, best streak, weakest three with "Drill these", mock history, short-answer averages).
- Print view (`/#/print`) with print CSS, page break per session, answers on/off, filter all / wrong / flagged / wrong+flagged, **Print / Save as PDF** and **Export CSV**.
- Tips every 5 questions and on results; traps inline on wrong answers; confetti on a 10-streak and on a mock ≥ 85%; shake on wrong; respects `prefers-reduced-motion` and an in-app "reduce animations" switch.
- Dark mode, installable PWA (offline after first load), keyboard shortcuts (1–4 answer, Enter next, F flag), ARIA roles/labels, tap targets ≥ 44 px.

## Manual test checklist (phone + laptop)

1. First open shows the name gate; entering a name lands on Home with "Hi <name>".
2. Refresh the page: profile and progress persist. Settings → Add a second profile → Switch between them: each has separate stats.
3. Study → S6: answer with keys 1–4; wrong answer shakes and shows explanation + trap + source; Enter advances; F toggles the flag (★).
4. Random: deselect all but two sessions, difficulty hard only, 10 questions → Start; the same question never appears twice; correct answer still highlighted correctly after shuffling.
5. Mock: timer counts down; Back/Next work; Submit shows % and per-session bars; ≥ 85% triggers confetti; the mock appears on the Stats page.
6. Review: after at least one wrong answer and one flag, "Wrong + flagged" lists them; "Randomise" reorders; "Wrong only" and "Flagged only" filter correctly.
7. Shorts: reveal shows model, minimum and marking guide; grading 0/1/2 persists after refresh; Stats shows the average.
8. Print: filter "Wrong + flagged" shows only those; "show answers" toggle hides answers; Print / Save as PDF opens the print dialog with one session per page; Export CSV downloads a file that opens in Excel.
9. Settings → Export profile copies JSON; on another browser, Import pastes it and switches to that profile with the same stats.
10. Dark mode toggle changes the theme and persists; "Reduce animations" removes transitions; OS reduced-motion is respected by default.
11. Phone (390 px wide): bottom tab bar visible, no horizontal scroll, option buttons ≥ 48 px tall; install to Home Screen works and the app opens offline after first load.
12. Keyboard-only: Tab reaches every control; option buttons announce as radio buttons; progress bar exposes aria-valuenow.

## Project layout

```
index.html             page shell + title
vite.config.ts         Vite + PWA manifest
tailwind.config.js     theme
public/content/questions.json   all content (edit this to add questions)
public/icon.svg        app icon
src/main.tsx           entry
src/App.tsx            routing, name gate, shell/nav, dark mode
src/Runner.tsx         generic quiz engine (study/random/mock/review)
src/components.tsx     QuestionCard, chips, progress bar, tip, confetti
src/pages.tsx          Home, Study, Random, Mock, Review, Shorts, Cases, Checklist, Stats, Print, Settings, Welcome
src/lib/content.ts     loading, shuffling, colours, recall lists, tips
src/lib/store.ts       localStorage store, migration, export/import, stats helpers
src/lib/types.ts       types
```
