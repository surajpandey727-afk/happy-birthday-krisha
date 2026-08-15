# media/

Drop real assets here — no code changes needed afterwards.

```
public/media/
  photos/   <- YOUR_PHOTO_01.jpg ... (any number)
  videos/   <- YOUR_VIDEO_01.mp4 (use H.264 for iPhone compatibility)
  audio/    <- optional ambient / music loops
```

## How to swap a placeholder for a real file

1. Put the file into the matching folder above.
2. In `content/photos.ts` / `content/videos.ts`, replace the token
   `YOUR_PHOTO_01` with `/media/photos/yourfile.jpg`.

That's it — every component (memory wall, polaroids, daily pick, lightbox)
picks it up automatically. 500 photos? Just add them to the array.

## Video notes

- Hero video: set `HERO_MEDIA.video` in `content/videos.ts` to `/media/videos/hero.mp4`.
- Use H.264 + AAC (MP4) for iOS Safari compatibility.
- Keep non-hero videos `preload="metadata"` — they only load when opened.
