import { APOSTROPHE_LIKE_REGEX } from './constants.js';
import { CaseSensitivity, Rule, SearchAndReplaceOptions, TrieNode, TriePattern } from './types.js';
import {
    adjustClipping,
    generateCaseVariants,
    getReplacement,
    insertWordIntoTrie,
    isConsidered,
    isValidMatch,
} from './utils.js';

/**
 * Builds a trie based on the provided rules.
 */
export const buildTrie = (rules: Rule[]): TrieNode => {
    const trie: TrieNode = {};

    for (const rule of rules) {
        const { from: sources, options, to: target } = rule;

        for (const source of sources) {
            if (options?.casing === CaseSensitivity.Insensitive) {
                const variants = generateCaseVariants(source);
                for (const variant of variants) {
                    insertWordIntoTrie(trie, variant, target, options);
                }
            } else {
                insertWordIntoTrie(trie, source, target, options);
            }
        }
    }

    return trie;
};

/**
 * Checks if a source exists in the trie.
 * @returns {boolean} - True if the source exists, false otherwise.
 */
export const containsSource = (trie: TrieNode, text: string): boolean => {
    let node: TrieNode = trie;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (!node[char]) {
            return false;
        }
        node = node[char] as TrieNode;
    }

    return Boolean(node.target);
};

/**
 * Checks if a target exists in the trie.
 * @returns {boolean} - True if the target exists, false otherwise.
 */
export const containsTarget = (trie: TrieNode, text: string, options: { caseInsensitive?: boolean } = {}): boolean => {
    const { caseInsensitive } = options;
    const stack = [trie];

    while (stack.length > 0) {
        const currentNode: TrieNode = stack.pop() as TrieNode;

        if (currentNode.target) {
            const targetToCompare = caseInsensitive ? currentNode.target.toLowerCase() : currentNode.target;
            const textToCompare = caseInsensitive ? text.toLowerCase() : text;

            if (targetToCompare === textToCompare) {
                return true;
            }
        }

        const keys = Object.keys(currentNode);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key !== 'isEndOfWord' && key !== 'target' && key !== 'options') {
                stack.push(currentNode[key] as TrieNode);
            }
        }
    }

    return false;
};

/**
 * Searches for and replaces text based on the provided trie.
 * @param {TrieNode} trie - The trie constructed from rules.
 * @param {string} textToFormat - The input text to search and replace.
 * @param {SearchAndReplaceOptions} options - Optional configurations for search and replace.
 * @returns {string} The modified text after replacements.
 */
export const searchAndReplace = (
    trie: TrieNode,
    textToFormat: string,
    options: SearchAndReplaceOptions = {},
): string => {
    let resultString = '';
    let i = 0;
    let text = textToFormat;

    if (options.preformatters) {
        if (options.preformatters.includes(TriePattern.Apostrophes)) {
            text = text.replace(new RegExp(APOSTROPHE_LIKE_REGEX, 'g'), "'");
        }
    }

    while (i < text.length) {
        let node: TrieNode = trie;
        let j = i;
        let lastValidMatch: { endIndex: number; node: TrieNode; startIndex: number } | null = null;

        while (j < text.length && node[text[j]]) {
            node = node[text[j]] as TrieNode;
            j++;

            if (node.isEndOfWord) {
                if (isValidMatch(text, i, j, node.options) && isConsidered(node.options, options.confirmCallback)) {
                    lastValidMatch = { endIndex: j, node, startIndex: i };
                }
            }
        }

        if (lastValidMatch) {
            const { endIndex, node: matchedNode, startIndex } = lastValidMatch;

            if (options.log) {
                options.log(lastValidMatch);
            }

            const replacement = getReplacement({
                endIndex,
                matchedNode,
                options,
                startIndex,
                text,
            });

            // Handle clipping adjustments
            const { adjustedIndex, clippingIndex } = adjustClipping(
                text,
                endIndex,
                resultString,
                matchedNode.options || {},
            );
            resultString = resultString.slice(0, clippingIndex) + replacement;
            i = adjustedIndex;
        } else {
            resultString += text[i];
            i++;
        }
    }

    return resultString;
};
