/**
 * Regular expression to match apostrophe-like characters.
 */
export const APOSTROPHE_LIKE_REGEX: RegExp = /['’‘`ʾ‛ʼʻʿ]/u;

/**
 * Regular expression to match any Unicode letter.
 * Uses Unicode property escapes to include all letters.
 */
export const LETTER_REGEX: RegExp = /\p{L}/u;
