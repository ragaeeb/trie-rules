import { CaseSensitivity, Rule, SearchAndReplaceOptions, TrieNode } from './types';
import { adjustCasing, generateCaseVariants, isConsidered, isValidMatch, normalizeApostrophes } from './utils';

/**
 * Builds a trie based on the provided rules.
 */
export const buildTrie = (rules: Rule[]): TrieNode => {
    const trie: TrieNode = {};

    for (const rule of rules) {
        const { from: sources, options, to: target } = rule;
        for (const source of sources) {
            let variants = [source];

            if (options?.casing === CaseSensitivity.Insensitive) {
                variants = variants.flatMap(generateCaseVariants);
            }

            if (options?.normalizeApostrophes) {
                variants = variants.map(normalizeApostrophes);
            }

            for (const variant of variants) {
                let node = trie;
                for (const char of variant) {
                    if (!node[char]) {
                        node[char] = {};
                    }
                    node = node[char] as TrieNode;
                }
                node.isEndOfWord = true;
                node.target = target;
                node.options = options;
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
 * @returns {string} - The modified text.
 */
export const searchAndReplace = (trie: TrieNode, text: string, options: SearchAndReplaceOptions = {}): string => {
    let result = '';
    let i = 0;

    while (i < text.length) {
        let node: TrieNode = trie;
        let j = i;
        const potentialMatches = [];

        while (j < text.length && node[text[j]]) {
            node = node[text[j]] as TrieNode;
            j++;

            if (node.isEndOfWord) {
                potentialMatches.push({ endIndex: j, node, startIndex: i });
            }
        }

        let longestValidMatch = null;

        for (let k = potentialMatches.length - 1; k >= 0; k--) {
            const { endIndex, node: potentialNode, startIndex } = potentialMatches[k];
            if (
                isValidMatch(text, startIndex, endIndex, potentialNode.options) &&
                isConsidered(potentialNode.options, options.confirmCallback)
            ) {
                longestValidMatch = { endIndex, node: potentialNode, startIndex };
                break;
            }
        }

        if (longestValidMatch) {
            const { endIndex, node: matchedNode, startIndex } = longestValidMatch;

            if (options.log) {
                options.log({ node: matchedNode });
            }

            // Handle prefix option
            if (matchedNode.options?.prefix) {
                const prefixLength = matchedNode.options.prefix.length;
                const startOfPrefix = startIndex - prefixLength;
                const hasPrefix =
                    startOfPrefix >= 0 && text.slice(startOfPrefix, startIndex) === matchedNode.options.prefix;
                if (!hasPrefix) {
                    result += matchedNode.options.prefix;
                }
            }

            // Determine whether to adjust casing based on the 'casing' option
            let replacementText = matchedNode.target;
            const casingOption = matchedNode.options?.casing;

            if (casingOption === CaseSensitivity.Insensitive) {
                const matchedText = text.slice(startIndex, endIndex);
                replacementText = adjustCasing(matchedText, matchedNode.target as string);
            }

            result += replacementText;
            i = endIndex;
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
};
