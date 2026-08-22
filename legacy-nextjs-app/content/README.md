# content/ — everything personal lives here

Content is strictly separated from presentation. Add to these files and the
world grows by itself:

| file              | what it holds                          |
| ----------------- | -------------------------------------- |
| `site.ts`         | copy, nav labels, handwritten notes    |
| `photos.ts`       | the photo library (any number)         |
| `videos.ts`       | video library + hero media             |
| `memories.ts`     | memories (pull from photos/videos)     |
| `letters.ts`      | letters + unlock conditions            |
| `daily.ts`        | "today's little thing" pool            |
| `easterEggs.ts`   | Easter egg definitions (triggers)      |
| `games/`          | (future) per-game level data if needed |

Placeholder tokens like `YOUR_PHOTO_01` render as elegant gradients until the
real files arrive in `public/media/`.

Hidden content: set `hidden: true` (memories), `requiresProgress` (letters),
`probability` (easter eggs) — the engine handles the rest.
