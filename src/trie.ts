import { APOSTROPHE_LIKE_REGEX } from './constants.js';
import {
    type BuildTrieOptions,
    CaseSensitivity,
    type Rule,
    type SearchAndReplaceOptions,
    type TrieNode,
} from './types.js';
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
 * @param {Rule[]} rules - Array of search and replace rules to build the trie from.
 * @param {BuildTrieOptions} [options] - Optional build configuration.
 * @param {boolean} [options.normalizeApostrophes=false] - When true, treats all apostrophe-like
 *   characters as equivalent during matching. This allows a rule with "don't" to match variants
 *   like "don't", "don`t", etc. Normalization is applied to rule sources during build time and
 *   to input text during search time.
 * @returns {TrieNode} The constructed trie with build options stored for use during search operations.
 */
export const buildTrie = (rules: Rule[], buildOptions?: BuildTrieOptions): TrieNode => {
    const trie: TrieNode = { ...(buildOptions && { buildOptions }) };
    const normalizeApostrophes = Boolean(buildOptions?.normalizeApostrophes);

    for (const rule of rules) {
        const { from: sources, options, to: target } = rule;

        for (let source of sources) {
            source = normalizeApostrophes ? source.replace(APOSTROPHE_LIKE_REGEX, "'") : source;

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
export const searchAndReplace = (trie: TrieNode, text: string, searchOptions: SearchAndReplaceOptions = {}): string => {
    let resultString = '';
    let i = 0;
    const normalizeApostrophes = Boolean(trie.buildOptions?.normalizeApostrophes);

    while (i < text.length) {
        let node: TrieNode = trie;
        let j = i;
        let lastValidMatch: null | { endIndex: number; node: TrieNode; startIndex: number } = null;

        while (j < text.length) {
            const currentChar = text[j];
            let lookupChar = currentChar;

            // If apostrophe normalization is enabled, normalize apostrophe-like chars to standard apostrophe
            if (normalizeApostrophes && APOSTROPHE_LIKE_REGEX.test(currentChar)) {
                lookupChar = "'";
            }

            if (!node[lookupChar]) {
                break;
            }

            node = node[lookupChar] as TrieNode;
            j++;

            if (node.isEndOfWord) {
                if (
                    isValidMatch(text, i, j, node.options) &&
                    isConsidered(node.options, searchOptions.confirmCallback)
                ) {
                    lastValidMatch = { endIndex: j, node, startIndex: i };
                }
            }
        }

        if (lastValidMatch) {
            const { endIndex, node: matchedNode, startIndex } = lastValidMatch;

            if (searchOptions.log) {
                searchOptions.log({ node: matchedNode });
            }

            const replacement = getReplacement({
                endIndex,
                matchedNode,
                options: searchOptions,
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
