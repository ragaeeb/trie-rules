import {
    CaseSensitivity,
    ClipStartPattern,
    ConfirmCallback,
    MatchType,
    RuleOptions,
    SearchAndReplaceOptions,
    TrieNode,
} from './types';

export const APOSTROPHE_LIKE_REGEX = /['’‘`ʾʿ]/;

// Use Unicode property escape for letters (includes all letters)
const LETTER_REGEX = /\p{L}/u;

export const isLetter = (char: string): boolean => {
    return LETTER_REGEX.test(char);
};

export const isUpperCase = (char: string): boolean => {
    return char === char.toLocaleUpperCase() && char !== char.toLocaleLowerCase();
};

export const isLowerCase = (char: string): boolean => {
    return char === char.toLocaleLowerCase() && char !== char.toLocaleUpperCase();
};

const isAlphabeticLetter = (char: string): boolean => {
    return LETTER_REGEX.test(char) && !APOSTROPHE_LIKE_REGEX.test(char);
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

        const variantUpper = prefix + upperFirstChar + suffix;
        const variantLower = prefix + lowerFirstChar + suffix;

        return [variantUpper, variantLower];
    }
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

export const mapClipPatternToRegex = (pattern: ClipStartPattern | RegExp) => {
    if (pattern === ClipStartPattern.Apostrophes) {
        return APOSTROPHE_LIKE_REGEX;
    }

    return pattern as RegExp;
};

export const adjustCasing = (matchedText: string, targetText: string): string => {
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
};

export const getReplacement = (params: {
    endIndex: number;
    matchedNode: TrieNode;
    options: SearchAndReplaceOptions;
    resultArray: string[];
    startIndex: number;
    text: string;
}): string => {
    const { endIndex, matchedNode, options, resultArray, startIndex, text } = params;
    let replacement = '';

    if (options.log) {
        options.log({ node: matchedNode });
    }

    // Handle prefix option
    if (matchedNode.options?.prefix) {
        const prefixLength = matchedNode.options.prefix.length;
        const startOfPrefix = startIndex - prefixLength;
        const hasPrefix = startOfPrefix >= 0 && text.slice(startOfPrefix, startIndex) === matchedNode.options.prefix;
        if (!hasPrefix) {
            replacement += matchedNode.options.prefix;
        }
    }

    // Handle clipStartPattern
    if (matchedNode.options?.clipStartPattern) {
        const regex = mapClipPatternToRegex(matchedNode.options.clipStartPattern);
        const lastIndex = resultArray.length - 1;
        if (lastIndex >= 0) {
            const lastSegment = resultArray[lastIndex];
            if (lastSegment && regex.test(lastSegment.charAt(lastSegment.length - 1))) {
                resultArray[lastIndex] = lastSegment.slice(0, -1);
            }
        }
    }

    // Determine whether to adjust casing based on the 'casing' option
    let replacementText = matchedNode.target;
    const casingOption = matchedNode.options?.casing;

    if (casingOption === CaseSensitivity.Insensitive) {
        const matchedText = text.slice(startIndex, endIndex);
        replacementText = adjustCasing(matchedText, matchedNode.target as string);
    }

    return replacement + replacementText;
};

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
