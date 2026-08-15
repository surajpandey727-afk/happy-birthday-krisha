import type { Letter } from "@/lib/types";

/**
 * Letters / notes. The "heading" is the promise (e.g. "open when you miss me");
 * the body is the letter. To gate a letter behind total puzzle progress use
 * requiresProgress. Dates/random discovery are supported by the letters page.
 */
export const LETTERS: Letter[] = [
  {
    id: "ltr-01",
    heading: "open when you miss me",
    greeting: "hey you,",
    body:
      "If you're reading this, you probably wished I was closer. So close your eyes for one second. I'm not far — I never really am. Everything good about your day, I'm a part of. Everything calm in you, that's us.\n\nI'm still here. I'll always be right around the corner of a thought.",
    signature: "always, me",
    date: "some quiet night",
  },
  {
    id: "ltr-02",
    heading: "open when you need a smile",
    greeting: "okay,",
    body:
      "Remember the version of me that told you that one terrible joke? The one where you laughed harder at how bad it was than at the joke? That's the version I keep on standby, just for you.\n\nSmile. You're the only one who gets my best material.",
    signature: "your resident clown",
    date: "just now",
  },
  {
    id: "ltr-03",
    heading: "open when you're angry at me",
    greeting: "take a breath,",
    body:
      "This one is a little heavier, so sit down with it. Whatever I did — I'm sorry, fully, not halfway. I care more about " +
      "us than I care about being right. When you're ready, I'll be on your side of the room.\n\nTake your time. I'm not going anywhere.",
    signature: "still choosing you",
    date: "whenever you need it",
  },
  {
    id: "ltr-04",
    heading: "open on your birthday",
    greeting: "the happiest of days,",
    body:
      "Today the whole world is basically celebrating the day you happened. And honestly? The world got that one right.\n\nHere's to you — the person who makes even the ordinary feel like somewhere.",
    signature: "yours, always",
    date: "your day",
    requiresProgress: 0,
  },
  {
    id: "ltr-05",
    heading: "one more thing",
    greeting: "psst,",
    body: "You're still here, exploring little corners. I love that about you.\n\nKeep looking. Some doors only open for the curious.",
    signature: "—",
    date: "a secret",
    hidden: true,
  },
  {
    id: "ltr-06",
    heading: "for the early days",
    greeting: "little us,",
    body: "This is a note for how it felt at the start — a little nervous, a lot excited, completely ours.\n\nLook at us now.",
    signature: "still us",
    date: "a long time ago",
    requiresProgress: 7,
  },
] as const;

export const LETTER_DB = LETTERS as Letter[];