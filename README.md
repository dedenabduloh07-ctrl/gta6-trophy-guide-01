# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/dedenabduloh07-ctrl/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/dedenabduloh07-ctrl/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A free, open-source, offline trophy guide and tracker for **Grand Theft Auto VI** on PlayStation 5. No ads, no account, no network — open `app/index.html` and it works.

## What it is

- **Tracker for all 55 official trophies** (1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 hidden): tick them off, progress saves in your browser, with export and import.
- **A guide for every trophy in our own words**: what it asks, how to earn it, difficulty and time estimates, PSN progress targets (0/250 stunts, 0/42 range medals, …) and launch-day rarity.
- **Platinum roadmap**: six steps in the order that wastes the least time (~200 hours, difficulty about 4/10).
- **Missables page**: the one trophy that can be missed (Positive Mental Attitude — Lucia's balcony meditation in Chapter 1) and the time-sensitive Yago race, plus the save rules that keep one playthrough enough.
- **Filters**: grade, kind (story / side / collection), difficulty, earned or not, missable only, search, and sorting — plus a spoiler setting that hides story trophies until earned.

## Verified, not invented

The trophy list was verified on 19 November 2026 against two independent sources that agree on every name, description and grade:

- Exophase — https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/
- PSNProfiles — https://psnprofiles.com/trophies/43531-grand-theft-auto-vi

Gameplay methods come from Output Lag's guide (https://outputlag.com/guides/gta-6-trophy-list/) and are cited per trophy as community reports, not yet checked in the game. Two trophies — **Bad Luck, I Guess** and **The Truth Is Out There** — have no verified unlock method yet, and their pages say so plainly instead of guessing. See the in-app **Sources & honesty** page for the full accounting.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly — everything is static files. `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `dossier.json`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide (no build step)
- `app/data/trophies.json` — the 55 trophies with guides, in our own words
- `screenshots/` — 3–4 captures of the guide in use
- `main.ts` — the hand-in program
- `serve.ts` — a tiny static server for local testing

## Disclaimer

Unofficial fan guide. Not affiliated with Rockstar Games, Sony Interactive Entertainment, or PlayStation. Trophy names and descriptions are the official list; guide text is written in our own words. No Rockstar artwork or logos are used.
