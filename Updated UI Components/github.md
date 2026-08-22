repo: DavidHDev/react-bits
branch: main
path: src/content/Backgrounds/FloatingLines

secondary-repo: phosphor-icons/core
secondary-branch: main
secondary-path: assets/thin

## Last sync
date: 2026-08-21T23:33:06Z

### Updated in this project
- FloatingLines shader (vertex + fragment) ported verbatim into `floating-lines.js` as a `<floating-lines>` custom element; gradient `#6645f5,#2fa8c0,#af45f5`, speed 2, bend 12/1, damping 0.12, parallax on.
- Background opacity dialled to 0.2 behind content, 0.5 on the entrance screen.
- Phosphor Icons **Thin** SVGs read from `phosphor-icons/core` and inlined (currentColor) as the site's single icon set: moon-stars, images-square, path, notebook, hand-heart, magnifying-glass, door-open, caret-left, plant, arrow-right, x, music-notes-simple, pencil-simple-line, scribble, sparkle, lock-simple.

## Screen map
| screen | built from |
| --- | --- |
| background | react-bits src/content/Backgrounds/FloatingLines/FloatingLines.jsx, FloatingLines.css |
| all screens (icons) | phosphor-icons/core assets/thin/*.svg |
