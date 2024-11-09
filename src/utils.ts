import { APOSTROPHE_LIKE_REGEX, LETTER_REGEX } from './constants';
import {
    CaseSensitivity,
    ConfirmCallback,
    MatchType,
    RuleOptions,
    SearchAndReplaceOptions,
    TrieNode,
    TriePattern,
} from './types';

/**
 * Checks if the given character is a letter.
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is a letter, false otherwise.
 */
export const isLetter = (char: string): boolean => {
    return LETTER_REGEX.test(char);
};

/**
 * Checks if the given character is uppercase.
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is uppercase, false otherwise.
 */
export const isUpperCase = (char: string): boolean => {
    return char === char.toLocaleUpperCase() && char !== char.toLocaleLowerCase();
};

/**
 * Checks if the given character is lowercase.
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is lowercase, false otherwise.
 */
export const isLowerCase = (char: string): boolean => {
    return char === char.toLocaleLowerCase() && char !== char.toLocaleUpperCase();
};

/**
 * Determines if a character is an alphabetic letter (excluding apostrophe-like characters).
 * @param {string} char - The character to check.
 * @returns {boolean} True if the character is an alphabetic letter, false otherwise.
 */
const isAlphabeticLetter = (char: string): boolean => {
    return LETTER_REGEX.test(char) && !APOSTROPHE_LIKE_REGEX.test(char);
};

/**
 * Finds the index of the first alphabetic letter in a string.
 * @param {string} str - The string to search.
 * @returns {number} The index of the first alphabetic letter, or -1 if none found.
 */
const findFirstAlphaIndex = (str: string): number => {
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (isAlphabeticLetter(char)) {
            return i;
        }
    }
    return -1;
};

/**
 * Generates case variants for a given source string by toggling the case of the first alphabetic character.
 * @param {string} source - The source string.
 * @returns {string[]} An array containing the original string and its case variants.
 */
export const generateCaseVariants = (source: string): string[] => {
    const index = findFirstAlphaIndex(source);
    if (index === -1) {
        return [source];
    }

    const firstChar = source.charAt(index);
    const upperFirstChar = firstChar.toLocaleUpperCase();
    const lowerFirstChar = firstChar.toLocaleLowerCase();

    if (upperFirstChar === lowerFirstChar) {
        return [source];
    } else {
        const prefix = source.slice(0, index);
        const suffix = source.slice(index + 1);

        return [prefix + upperFirstChar + suffix, prefix + lowerFirstChar + suffix];
    }
};

/**
 * Determines if a character at a given position is considered a word character.
 * An apostrophe is considered a word character only if it's between letters.
 * @param {string} text - The text containing the character.
 * @param {number} index - The position of the character in the text.
 * @returns {boolean} True if the character is a word character, false otherwise.
 */
export const isWordCharacterAt = (text: string, index: number): boolean => {
    const char = text.charAt(index);

    if (!char) {
        return false;
    }

    if (isLetter(char)) {
        return true;
    }

    if (APOSTROPHE_LIKE_REGEX.test(char)) {
        const prevChar = text.charAt(index - 1);
        const nextChar = text.charAt(index + 1);

        if (isLetter(prevChar) && isLetter(nextChar)) {
            const nextNextChar = text.charAt(index + 2);

            // Apostrophe between letters, could be part of the word
            // Check if it's a possessive 's'
            if (nextChar.toLowerCase() === 's' && !isLetter(nextNextChar)) {
                // Apostrophe 's' is possessive, not part of the word
                return false;
            }
            return true;
        }
    }
    return false;
};

/**
 * Checks if a match is valid based on the provided options.
 * @param {string} text - The original text.
 * @param {number} matchStartIndex - The start index of the match.
 * @param {number} matchEndIndex - The end index of the match.
 * @param {RuleOptions} [options] - The options for the rule.
 * @returns {boolean} True if the match is valid, false otherwise.
 */
export const isValidMatch = (
    text: string,
    matchStartIndex: number,
    matchEndIndex: number,
    options?: RuleOptions,
): boolean => {
    if (options && options.match === MatchType.Whole) {
        const isPrevWordChar = isWordCharacterAt(text, matchStartIndex - 1);
        const isNextWordChar = isWordCharacterAt(text, matchEndIndex);

        return !isPrevWordChar && !isNextWordChar;
    }

    if (options?.match === MatchType.Alone) {
        const prevChar = text.charAt(matchStartIndex - 1) || '';
        const nextChar = text.charAt(matchEndIndex) || '';
        return /\s/.test(prevChar) && /\s/.test(nextChar);
    }

    return true;
};

/**
 * Determines if a rule is considered based on confirmation options.
 * @param {RuleOptions} [ruleOptions] - The options for the rule.
 * @param {ConfirmCallback} [callback] - The confirmation callback.
 * @returns {boolean} True if the rule is considered, false otherwise.
 */
export const isConsidered = (ruleOptions?: RuleOptions, callback?: ConfirmCallback) => {
    if (ruleOptions?.confirm && callback) {
        return callback(ruleOptions.confirm);
    }

    return true;
};

/**
 * Maps a clipping pattern to its corresponding regular expression.
 * @param {RegExp | TriePattern} pattern - The clipping pattern.
 * @returns {RegExp} The corresponding regular expression.
 */
export const mapTriePatternToRegex = (pattern: RegExp | TriePattern) => {
    if (pattern === TriePattern.Apostrophes) {
        return APOSTROPHE_LIKE_REGEX;
    }

    return pattern as RegExp;
};

/**
 * Adjusts the casing of the target text based on the matched text.
 * @param {string} matchedText - The text that was matched in the original text.
 * @param {string} targetText - The target replacement text.
 * @returns {string} The target text with adjusted casing.
 */
export const adjustCasing = (matchedText: string, targetText: string): string => {
    let result = '';
    let matchedIndex = 0;
    let targetIndex = 0;

    while (targetIndex < targetText.length) {
        const targetChar = targetText[targetIndex];

        if (isAlphabeticLetter(targetChar)) {
            // Find next alphabetic letter in matchedText
            let matchedChar = '';
            while (matchedIndex < matchedText.length) {
                const currentMatchedChar = matchedText[matchedIndex];
                matchedIndex++;

                if (isAlphabeticLetter(currentMatchedChar)) {
                    matchedChar = currentMatchedChar;
                    break;
                }
            }

            if (matchedChar) {
                if (isUpperCase(matchedChar)) {
                    result += targetChar.toLocaleUpperCase();
                } else if (isLowerCase(matchedChar)) {
                    result += targetChar.toLocaleLowerCase();
                } else {
                    result += targetChar;
                }
            } else {
                // No corresponding letter in matchedText
                result += targetChar;
            }
        } else {
            result += targetChar; // Non-alphabetic character, add as is
        }

        targetIndex++;
    }

    return result;
};

/**
 * Gets the replacement string to substitute the matched node with.
 * @param params The details of the node matched including the indices.
 * @returns The text to replace the match with.
 */
export const getReplacement = (params: {
    endIndex: number;
    matchedNode: TrieNode;
    options: SearchAndReplaceOptions;
    startIndex: number;
    text: string;
}): string => {
    const { endIndex, matchedNode, startIndex, text } = params;
    let replacement = '';

    if (matchedNode.options?.prefix) {
        const startOfPrefix = startIndex - matchedNode.options.prefix.length;
        const hasPrefix = startOfPrefix >= 0 && text.slice(startOfPrefix, startIndex) === matchedNode.options.prefix;

        if (!hasPrefix) {
            replacement += matchedNode.options.prefix;
        }
    }

    let replacementText = matchedNode.target;

    if (matchedNode.options?.casing === CaseSensitivity.Insensitive) {
        const matchedText = text.slice(startIndex, endIndex);
        replacementText = adjustCasing(matchedText, matchedNode.target as string);
    }

    return replacement + replacementText;
};

/**
 * Adjusts the clipping based on the provided options.
 * @param {string} text - The original text.
 * @param {number} endIndex - The end index of the match.
 * @param {string} resultString - The current accumulated result string.
 * @param {RuleOptions} options - The options for clipping.
 * @returns {{ adjustedIndex: number; clippingIndex: number }} The adjusted index and clipping index.
 */
export const adjustClipping = (
    text: string,
    endIndex: number,
    resultString: string,
    options: RuleOptions,
): { adjustedIndex: number; clippingIndex: number } => {
    let adjustedIndex = endIndex;
    let clippingIndex = resultString.length;

    if (options.clipStartPattern) {
        const regex = mapTriePatternToRegex(options.clipStartPattern);
        const lastChar = resultString.charAt(resultString.length - 1);

        if (regex.test(lastChar)) {
            clippingIndex--;
        }
    }

    if (options?.clipEndPattern) {
        const regex = mapTriePatternToRegex(options.clipEndPattern);
        if (regex.test(text.charAt(endIndex))) {
            adjustedIndex++;
        }
    }

    return { adjustedIndex, clippingIndex };
};

/**
 * Inserts a word into the trie with the associated target and options.
 * @param {TrieNode} trie - The trie to insert the word into.
 * @param {string} word - The word to insert.
 * @param {string} target - The target replacement string.
 * @param {RuleOptions} [options] - The options associated with the rule.
 */
export const insertWordIntoTrie = (trie: TrieNode, word: string, target: string, options?: RuleOptions): void => {
    let node = trie;
    for (const char of word) {
        if (!node[char]) {
            node[char] = {};
        }
        node = node[char] as TrieNode;
    }
    node.isEndOfWord = true;
    node.target = target;
    node.options = options;
};
