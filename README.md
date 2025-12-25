# Agenda App

A lightweight React + Vite application that displays a program agenda and highlights the current session in real time.

## Features

- Load program data from a JSON file (`src/data/program.json`)
- Group sessions by day
- Highlight the current session (updates every 60s)
- Gray out finished sessions
- Responsive design with Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the URL printed by Vite (usually http://localhost:5173)

## Swap program data

Replace or edit `src/data/program.json` and the app will show the new program.

## Notes

- No external libraries are used except React and Tailwind CSS.
- If you want timezone-aware behavior, update the date/time parsing accordingly.
