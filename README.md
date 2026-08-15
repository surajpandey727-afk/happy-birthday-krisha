# i❤kripi — OUR LITTLE WORLD

A private, premium, emotionally immersive digital world for two people.
Video-first cinematic landing → an interactive home room → memories, letters,
videos, games, doodles, little things, and a secret room.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- Framer Motion (transitions, hero, reveals)
- WebAudio for tiny satisfying sounds, Vibration API for haptics
- PWA (manifest + service worker), Capacitor-ready architecture

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for game logic (solvers/generators)
npm run build      # production build
npm start
npm run icons      # regenerate PWA/OG icons after editing public/icons/icon.svg
```

## Making it yours

Everything personal lives in `content/` (see `content/README.md`):

1. Drop photos into `public/media/photos/`, videos into `public/media/videos/`.
2. Replace placeholder tokens (`YOUR_PHOTO_01`, `YOUR_VIDEO_01`) in
   `content/photos.ts` / `content/videos.ts` with real paths.
3. Write letters, memories, Easter eggs, and "today's little thing" items in
   `content/letters.ts`, `content/memories.ts`, `content/easterEggs.ts`,
   `content/daily.ts`.

No component edits required — the site is content-driven.

## Worlds / routes

| route | world |
| --- | --- |
| `/` | cinematic hero (video opening, "come in") |
| `/home` | our room — window, moon (secret door), polaroids, object shelf |
| `/us` | wall of us |
| `/memories` | memory engine + hidden whispers |
| `/videos` | the screen |
| `/letters` | envelopes (some unlock via puzzles) |
| `/play` | the games table |
| `/play/liquid` | **liquid love** — validated seeded liquid-sort levels |
| `/play/untangle` | **untangle** — planar-graph puzzles |
| `/play/arrows` | **arrow // chain** — deterministic beam chains |
| `/doodle` | canvas + tools + saved doodles |
| `/little-things` | today's little thing · missing me · make me smile |
| `/secret` | the secret room (not advertised) |

## Hidden things

- Tap the moon 7 times on `/home`.
- `Ctrl+Shift+D` opens the **dev room** (development builds only) — jump to
  any world, reset progress, reveal eggs, watch FPS.
- Easter eggs whisper `i❤kripi` at improbable moments.

## Architecture notes

- `src/lib/persistence.ts` — `PersistenceAdapter` (localStorage
  today, Supabase/Capacitor later). Games never talk to storage directly.
- `src/games/framework/progress.ts` — shared save/achievement/level systems.
- Generators always validate: Liquid (BFS solver + difficulty band),
  Untangle (planar families + crossing check), Arrows (construction +
  simulation). No impossible levels, deterministic per seed.
- Games are dynamically imported so they only load when opened.
- `public/sw.js` — offline shell; runs on web, skips under Capacitor.