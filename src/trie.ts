import { CaseSensitivity, Rule, RuleOptions, SearchAndReplaceOptions, TrieNode } from './types';
import { adjustCasing, generateCaseVariants, isConsidered, isValidMatch, mapClipPatternToRegex } from './utils';

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

function insertWordIntoTrie(trie: TrieNode, word: string, target: string, options?: RuleOptions): void {
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
}

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
    const resultArray: string[] = [];
    let i = 0;
    const textLength = text.length;

    while (i < textLength) {
        let node: TrieNode = trie;
        let j = i;
        let lastValidMatch: { endIndex: number; node: TrieNode; startIndex: number } | null = null;

        while (j < textLength && node[text[j]]) {
            node = node[text[j]] as TrieNode;
            j++;

            if (node.isEndOfWord) {
                const startIndex = i;
                const endIndex = j;

                if (
                    isValidMatch(text, startIndex, endIndex, node.options) &&
                    isConsidered(node.options, options.confirmCallback)
                ) {
                    lastValidMatch = { endIndex, node, startIndex };
                }
            }
        }

        if (lastValidMatch) {
            const { endIndex, node: matchedNode, startIndex } = lastValidMatch;

            // Use a reference to i so that getReplacement can update it
            const iRef = { value: endIndex };

            // Handle the match
            const replacement = getReplacement({
                endIndex,
                iRef,
                matchedNode,
                options,
                resultArray,
                startIndex,
                text,
            });

            resultArray.push(replacement);
            i = iRef.value; // Update i based on any adjustments
        } else {
            resultArray.push(text[i]);
            i++;
        }
    }

    return resultArray.join('');
};

function getReplacement(params: {
    endIndex: number;
    iRef: { value: number }; // Reference to i
    matchedNode: TrieNode;
    options: SearchAndReplaceOptions;
    resultArray: string[];
    startIndex: number;
    text: string;
}): string {
    const { endIndex, iRef, matchedNode, options, resultArray, startIndex, text } = params;
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

    replacement += replacementText;

    // Handle clipEndPattern
    let adjustedEndIndex = endIndex;
    if (matchedNode.options?.clipEndPattern) {
        const regex = mapClipPatternToRegex(matchedNode.options.clipEndPattern);
        if (regex.test(text.charAt(endIndex))) {
            adjustedEndIndex = endIndex + 1; // Skip the character
        }
    }

    // Update iRef to the adjusted end index
    iRef.value = adjustedEndIndex;

    return replacement;
}
