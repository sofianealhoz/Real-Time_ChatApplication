// Small helpers to give every participant a stable identity in the interface:
// the same name always produces the same colour and the same initials.

const PALETTE = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#ef4444', // red
  '#84cc16', // lime
];

// Turns a name into a number, then picks a colour with it. No randomness, so
// the colour never changes between two renders or two browsers.
export function colorFor(name) {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.codePointAt(0)) % 100000;
  }
  return PALETTE[hash % PALETTE.length];
}

export function initialsOf(name) {
  return name.trim().slice(0, 2).toUpperCase();
}
