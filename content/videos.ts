import type { VideoItem } from "@/lib/types";

/**
 * Video library. The hero video is referenced from content/videos.ts as
 * VIDEO_LIB_HERO. Replace placeholders with "/media/videos/01.mp4" etc.
 * Non-hero videos are lazy-loaded only when opened.
 */
export const VIDEOS: VideoItem[] = [
  { id: "v1", title: "the reel of us", file: "YOUR_VIDEO_01", thumb: "YOUR_VIDEO_01", duration: "0:00", date: "every day", note: "this is us." },
  { id: "v2", title: "you being you", file: "YOUR_VIDEO_02", thumb: "YOUR_VIDEO_02", duration: "0:00", date: "someday", note: "especially this part." },
  { id: "v3", title: "outside, together", file: "YOUR_VIDEO_03", thumb: "YOUR_VIDEO_03", duration: "0:00", date: "summer", note: "the world got smaller." },
] as const;

/** The hero opening video — source your cinematic clip here. */
export const HERO_MEDIA = {
  video: "YOUR_VIDEO_01", // replace with "/media/videos/hero.mp4"
  poster: "YOUR_VIDEO_01",
};

export { VIDEOS as VIDEO_DB };