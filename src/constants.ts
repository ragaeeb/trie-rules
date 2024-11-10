/**
 * Regular expression to match apostrophe-like characters.
 */
export const APOSTROPHE_LIKE_REGEX = /['’‘`ʾʿ]/;

/**
 * Regular expression to match any Unicode letter.
 * Uses Unicode property escapes to include all letters.
 */
export const LETTER_REGEX = /\p{L}/u;
