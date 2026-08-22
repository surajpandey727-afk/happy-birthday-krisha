import type { Memory } from "@/lib/types";
import { PHOTO_PREVIEW as PHOTOS } from "./photos";

/**
 * Memories — the reusable memory engine. Each memory pulls from the shared
 * photo/video libraries so nothing is duplicated. Add as many as you like;
 * the wall, timeline, daily pick and memory cards render them automatically.
 */
export const MEMORIES: Memory[] = [
  {
    id: "mem-01",
    title: "the very beginning",
    date: "when it all started",
    location: "somewhere that became home",
    description:
      "This is where it started, and mujhe pata bhi nahi chala kab. I just knew I didn't want the conversation to end.",
    photos: [PHOTOS[0]],
    mood: "golden",
    tags: ["us", "beginning"],
    pinned: true,
  },
  {
    id: "mem-02",
    title: "the laugh",
    date: "a random tuesday",
    location: "you",
    description: "That laugh. I'd build entire days just to hear it twice.",
    photos: [PHOTOS[1]],
    mood: "laughing",
    tags: ["us", "laugh", "favourite"],
  },
  {
    id: "mem-03",
    title: "hands",
    date: "someone's evening",
    location: "a walk home",
    description: "The smallest map of us, redrawn every time your hand finds mine.",
    photos: [PHOTOS[4]],
    mood: "soft",
    tags: ["us", "touching"],
  },
  {
    id: "mem-04",
    title: "the table for two",
    date: "a friday",
    location: "the little café",
    description: "Two things off the menu, zero regrets, and somehow still not enough time with you.",
    videos: [],
    photos: [PHOTOS[5]],
    mood: "golden",
    tags: ["food", "cheeky"],
  },
  {
    id: "mem-05",
    title: "the dreamers' plan",
    date: "last month",
    location: "our corner",
    description:
      "We made a list of every place we'd go. Ek din, hum wahi list jee lenge.",
    mood: "home",
    tags: ["plans", "ours"],
    hidden: true,
    note: "we're going to look back at this one and laugh because we actually went.",
  },
] as const;

export const MEMORY_DB = MEMORIES as Memory[];