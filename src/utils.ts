// utils.ts
import { ConfirmCallback, MatchType, RuleOptions } from './types';

const APOSTROPHE_LIKE_CHARS = new Set(["'", '`', 'ʾ', 'ʿ', '‘', '’']);

// Use Unicode property escape for letters (includes all letters)
const LETTER_REGEX = /\p{L}/u;

export const isLetter = (char: string): boolean => {
    return LETTER_REGEX.test(char);
};

const isAlphabeticLetter = (char: string): boolean => {
    return LETTER_REGEX.test(char) && !APOSTROPHE_LIKE_CHARS.has(char);
};

const findFirstAlphaIndex = (str: string): number => {
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (isAlphabeticLetter(char)) {
            return i;
        }
    }
    return -1;
};

export const generateCaseVariants = (source: string): string[] => {
    const variants = [];
    const index = findFirstAlphaIndex(source);
    if (index === -1) {
        variants.push(source);
        return variants;
    }

    const firstChar = source[index];
    const upperFirstChar = firstChar.toLocaleUpperCase();
    const lowerFirstChar = firstChar.toLocaleLowerCase();

    if (upperFirstChar === lowerFirstChar) {
        variants.push(source);
    } else {
        const chars = source.split('');
        chars[index] = upperFirstChar;
        variants.push(chars.join(''));

        chars[index] = lowerFirstChar;
        variants.push(chars.join(''));
    }

    return variants;
};

export const normalizeApostrophes = (str: string): string => {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (!APOSTROPHE_LIKE_CHARS.has(char)) {
            result += char;
        }
    }
    return result;
};

/**
 * Determines if a character at a given position is considered a word character.
 * An apostrophe is considered a word character only if it's between letters.
 */
export const isWordCharacterAt = (text: string, index: number): boolean => {
    const char = text.charAt(index);
    if (!char) return false;

    if (isLetter(char)) {
        return true;
    }

    if (APOSTROPHE_LIKE_CHARS.has(char)) {
        const prevChar = text.charAt(index - 1);
        const nextChar = text.charAt(index + 1);
        const nextNextChar = text.charAt(index + 2);

        if (isLetter(prevChar) && isLetter(nextChar)) {
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
 * @returns {boolean} - True if the match is valid, false otherwise.
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

export const isConsidered = (ruleOptions?: RuleOptions, callback?: ConfirmCallback) => {
    if (ruleOptions?.confirm && callback) {
        return callback(ruleOptions.confirm);
    }

    return true;
};

export function adjustCasing(matchedText: string, targetText: string): string {
    let result = '';
    let matchedIndex = 0;
    let targetIndex = 0;
    const matchedLength = matchedText.length;
    const targetLength = targetText.length;

    while (targetIndex < targetLength) {
        const targetChar = targetText[targetIndex];

        if (isAlphabeticLetter(targetChar)) {
            // Find next alphabetic letter in matchedText
            let matchedChar = '';
            while (matchedIndex < matchedLength) {
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
            // Non-alphabetic character, add as is
            result += targetChar;
        }
        targetIndex++;
    }

    return result;
}

function isUpperCase(char: string): boolean {
    return char === char.toLocaleUpperCase() && char !== char.toLocaleLowerCase();
}

function isLowerCase(char: string): boolean {
    return char === char.toLocaleLowerCase() && char !== char.toLocaleUpperCase();
}
