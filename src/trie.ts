import { ConfirmCallback, Rule, RuleOptions, TrieNode } from './types';

const WORD_BOUNDARY = /[a-zA-ZāáḏḍēġḥṣīōṭūĀḌḎĒĠṬḤĪṢŌŪʿʾ']/;

/**
 * Builds a trie based on the provided rules.
 */
export const buildTrie = (rules: Rule[]): TrieNode => {
    const trie: TrieNode = {};

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        for (let j = 0; j < rule.sources.length; j++) {
            const source = rule.sources[j];
            let node = trie;
            for (let k = 0; k < source.length; k++) {
                const char = source[k];
                if (!node[char]) {
                    node[char] = {};
                }
                node = node[char] as TrieNode;
            }
            node.isEndOfWord = true;
            node.target = rule.target;
            node.options = rule.options || {};
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
 * Checks if a match is valid based on the provided options.
 * @returns {boolean} - True if the match is valid, false otherwise.
 */
const isValidMatch = (
    prevChar: string,
    nextChar: string,
    options: RuleOptions | undefined,
    text: string,
    matchStartIndex: number,
): boolean => {
    if (options && options.match === 'whole') {
        return !WORD_BOUNDARY.test(prevChar) && !WORD_BOUNDARY.test(nextChar);
    }

    if (options?.match === 'alone') {
        return /\s/.test(prevChar) && /\s/.test(nextChar);
    }

    if (options?.prefix) {
        const prefixLength = options.prefix.length;
        const startOfPrefix = matchStartIndex - prefixLength;
        // It's a valid match if the prefix is not present, as we will add it
        return startOfPrefix < 0 || text.slice(startOfPrefix, matchStartIndex) !== options.prefix;
    }

    return true;
};

const isConsidered = (ruleOptions?: RuleOptions, callback?: ConfirmCallback) => {
    if (ruleOptions?.confirm && callback) {
        return callback(ruleOptions.confirm);
    }

    return true;
};

/**
 * Searches for and replaces text based on the provided trie.
 * @returns {string} - The modified text.
 */
export const searchAndReplace = (
    trie: TrieNode,
    text: string,
    options: { confirmCallback?: ConfirmCallback } = {},
): string => {
    let result = '';
    let i = 0;

    while (i < text.length) {
        let node: TrieNode = trie;
        let j = i;
        const potentialMatches = [];

        while (node[text[j]] && j < text.length) {
            node = node[text[j]] as TrieNode;
            j++;
            if (node.isEndOfWord) {
                // Here, we use j - 1 to include the last character of the matched word
                potentialMatches.push({ index: j - 1, node });
            }
        }

        let longestValidMatch = null;

        for (let k = potentialMatches.length - 1; k >= 0; k--) {
            const { index, node: potentialNode } = potentialMatches[k] as { index: number; node: TrieNode };
            const prevChar = text[i - 1] || '';
            const nextChar = text[index + 1] || ''; // +1 to get the character immediately after the match
            if (
                isValidMatch(prevChar, nextChar, potentialNode.options, text, i) &&
                isConsidered(potentialNode.options, options.confirmCallback)
            ) {
                longestValidMatch = potentialNode;
                j = index + 1; // +1 to move to the character immediately after the match
                break;
            }
        }

        if (longestValidMatch) {
            if (longestValidMatch.options?.prefix) {
                const prefixLength = longestValidMatch.options.prefix.length;
                const startOfPrefix = i - prefixLength;
                const hasPrefix =
                    startOfPrefix >= 0 && text.slice(startOfPrefix, i) === longestValidMatch.options.prefix;
                if (!hasPrefix) {
                    result += longestValidMatch.options.prefix;
                }
            }

            result += longestValidMatch.target;
            i = j;
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
};
