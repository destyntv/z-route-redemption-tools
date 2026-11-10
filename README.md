# Z Route: Redemption Tools

A client-side companion for **Z Route: Redemption**, migrated from the original standalone HTML analyzer into a modular Vite application for Vercel deployment.

## Features

- Player profiles, hero roster and troop tiers
- Squad formation and faction bonuses
- Casualty prediction and kill calculator
- Battle log, comparison and statistics
- Readiness scoring and live-meta reference
- Hero database and search filters
- VS / Mission Readiness guides and Events Hub
- Fighter Command planner
- Local/server clocks, daily checklist and tips
- Screenshot OCR using Tesseract.js in the browser
- JSON/TXT import, export and backup
- Custom backgrounds and compact/basic/advanced modes

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

Vite writes the deployable site to `dist/`.

## Deploy to Vercel

1. Import `destyntv/z-route-redemption-tools` into Vercel.
2. Select the Vite framework preset (or let Vercel detect it).
3. Use `npm install` for installation.
4. Use `npm run build` as the build command.
5. Use `dist` as the output directory.
6. Deploy.

The repository includes `vercel.json` with these build settings.

## Project layout

- `index.html` — application markup and script loading order
- `src/styles/app.css` — original stylesheet, extracted without redesign
- `public/js/` — ordered classic scripts split by feature area
- `zroute-casualty-analyzer (8).html` — untouched original single-file source/backup

The JavaScript files intentionally load as ordered classic scripts. The current interface uses global functions and inline event handlers; retaining classic-script scope keeps those interactions working during this structural migration. The original function implementations and calculation logic are preserved.

## Data and privacy

The current version stores profile, roster, battle and preference data in the browser's `localStorage`. It does not require an API, database, login or server secrets. Data is local to the browser and deployment origin; it does not automatically sync between devices or between the original local HTML file and the Vercel domain. Use the built-in JSON/TXT export and import/backup tools when moving data.

OCR runs in the browser through Tesseract.js loaded from jsDelivr. The selected image is processed client-side by the OCR feature and is not uploaded to this application's server. Loading the OCR library requires an internet connection.

## Notes

This is an unofficial community tool and is not affiliated with 37GAMES. Calculations are estimates; verify results in-game. Hero/meta data reflects the values embedded in the original source and should be reviewed as the game changes.
