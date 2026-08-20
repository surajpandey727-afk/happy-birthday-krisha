/**
 * Site + experience copy. Everything personal lives here so the voice can be
 * changed without touching components.
 */

export const SITE = {
  name: "OUR LITTLE WORLD",
  shortName: "i❤kripi",
  tagline: "a little place that belongs only to us.",
  enter: "come in",
  welcomeBack: "welcome back.",
  foundYou: "found you. ",
  missingMeAnswer: "i'm still here.",
  madeUsSmile: "there. that's us.",
  secretTitle: "you found the secret door.",
} as const;

export const NAV = [
  { href: "/home", label: "home", tag: "our room" },
  { href: "/us", label: "us", tag: "a wall of us" },
  { href: "/memories", label: "memories", tag: "remember this?" },
  { href: "/case", label: "the case", tag: "a small investigation" },
  { href: "/doodle", label: "notebook", tag: "paper & pen" },
  { href: "/little-things", label: "little things", tag: "today's little thing" },
] as const;

/** Little handwritten-style notes scattered through the world. */
export const NOTES = [
  { text: "you noticed.", tone: "cheeky" },
  { text: "this one's my favourite.", tone: "soft" },
  { text: "i ❤ kripi", tone: "secret" },
  { text: "still us.", tone: "soft" },
  { text: "look what we did.", tone: "proud" },
  { text: "one more thing…", tone: "playful" },
] as const;

/** Notes shown by the "missing me?" interaction. */
export const MISSING_ME_NOTES = [
  "sit with me for a second.",
  "you're the calm in all of my noise.",
  "close your eyes — i'm exactly where you left me.",
  "i carry us with me everywhere.",
  "a little world, just for two.",
] as const;

/** Content for "make me smile". */
export const SMILE_NOTES = [
  "remember that tiny laugh? i saved it.",
  "you, but funnier.",
  "official notice — you're good at being you.",
  "if a smile is what you wanted, consider it delivered.",
] as const;

/** Moods used across memories. */
export const MOODS = [
  "golden",
  "gentle",
  "laughing",
  "soft",
  "late-night",
  "home",
] as const;

/** Messages that can label "today's little thing". */
export const DAILY_ACK = [
  "there's a little thing waiting for you.",
  "a little something, just for today.",
  "the world left you a note.",
] as const;