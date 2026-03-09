# Resume For Dummies

A simple resume builder with a live preview, LaTeX export, and one-click zip download.

## Features

- **Live Preview** — see your resume update in real time as you type
- **Markdown Formatting** — use `**bold**` and `*italic*` in any text field
- **Adjustable Margins** — fine-tune page margins with sliders
- **Zip Download** — single button downloads a `.zip` containing `.tex`, `.json`, and `.pdf`
- **JSON Import/Export** — save and reload your resume as portable JSON
- **Landing Page** — onboarding flow for new users, with an AI-assisted import option for converting existing resumes
- **PDF Compilation** — generates PDF via `pdflatex` when available (graceful fallback if not)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build & Deploy

```bash
npm run build   # outputs to dist/
npx vercel --prod
```

## Tech Stack

React, TypeScript, Vite. No routing library — the app uses simple view state (`landing` | `editor`). LaTeX compilation runs through a local Vite dev server plugin that calls `pdflatex`.
