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
      "This is where it started. I didn't know it yet — I just knew I didn't want the conversation to end.",
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
    description: "The laugh I will never get tired of. The whole reason I'll always be a little silly.",
    photos: [PHOTOS[1]],
    mood: "laughing",
    tags: ["us", "laugh", "favourite"],
  },
  {
    id: "mem-03",
    title: "hands",
    date: "someone's evening",
    location: "a walk home",
    description: "It's the small map of us — the shape your hand makes when it finds mine.",
    photos: [PHOTOS[4]],
    mood: "soft",
    tags: ["us", "touching"],
  },
  {
    id: "mem-04",
    title: "the table for two",
    date: "a friday",
    location: "the little café",
    description: "Two choices off the menu, zero regrets. I keep replaying this one.",
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
      "We made a list of all the places we'd go. This memory is the list itself — the wanting is half the fun.",
    mood: "home",
    tags: ["plans", "ours"],
    hidden: true,
    note: "we're going to look back at this one and laugh because we actually went.",
  },
] as const;

export const MEMORY_DB = MEMORIES as Memory[];