const WORD_BOUNDARY = /[a-zA-ZāáḏḍēġḥīōṭūʿʾĀḌḎĒĠṬḤĪŌŪʿʾ]/;

/**
 * Builds a trie based on the provided rules.
 *
 * @param {Array<Object>} rules - An array of objects representing the rules for building the trie.
 * @returns {Object} - The constructed trie.
 */
export const buildTrie = (rules) => {
    const trie = {};
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
                node = node[char];
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
 *
 * @param {Object} trie - The trie to use for searching.
 * @param {string} text - The text to search within.
 * @returns {boolean} - True if the source exists, false otherwise.
 */
export const containsSource = (trie, text) => {
    let node = trie;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        if (!node[char]) {
            return false;
        }
        node = node[char];
    }

    return Boolean(node.target);
};

/**
 * Checks if a target exists in the trie.
 *
 * @param {Object} trie - The trie to use for searching.
 * @param {string} text - The text to search within.
 * @param {Object} [options] - Optional parameters.
 * @param {boolean} [options.caseInsensitive] - Whether the search should be case-insensitive.
 * @returns {boolean} - True if the target exists, false otherwise.
 */
export const containsTarget = (trie, text, { caseInsensitive } = {}) => {
    const stack = [trie];

    while (stack.length > 0) {
        const currentNode = stack.pop();

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
                stack.push(currentNode[key]);
            }
        }
    }

    return false;
};

/**
 * Checks if a match is valid based on the provided options.
 *
 * @param {string} prevChar - The character immediately preceding the match.
 * @param {string} nextChar - The character immediately following the match.
 * @param {Object} options - Options for matching.
 * @returns {boolean} - True if the match is valid, false otherwise.
 */
const isValidMatch = (prevChar, nextChar, options) => {
    if (options && options.match === 'whole') {
        return !WORD_BOUNDARY.test(prevChar) && !WORD_BOUNDARY.test(nextChar);
    }

    if (options?.match === 'alone') {
        return /\s/.test(prevChar) && /\s/.test(nextChar);
    }

    return true;
};

/**
 * Searches for and replaces text based on the provided trie.
 *
 * @param {Object} trie - The trie to use for searching and replacing.
 * @param {string} text - The text to search and replace within.
 * @returns {string} - The modified text.
 */
export const searchAndReplace = (trie, text) => {
    let result = '';
    let i = 0;

    while (i < text.length) {
        let node = trie;
        let j = i;
        const potentialMatches = [];

        while (node[text[j]] && j < text.length) {
            node = node[text[j]];
            j++;
            if (node.isEndOfWord) {
                // Here, we use j - 1 to include the last character of the matched word
                potentialMatches.push({ index: j - 1, node });
            }
        }

        let longestValidMatch = null;

        for (let k = potentialMatches.length - 1; k >= 0; k--) {
            const { index, node: potentialNode } = potentialMatches[k];
            const prevChar = text[i - 1] || '';
            const nextChar = text[index + 1] || ''; // +1 to get the character immediately after the match
            if (isValidMatch(prevChar, nextChar, potentialNode.options)) {
                longestValidMatch = potentialNode;
                j = index + 1; // +1 to move to the character immediately after the match
                break;
            }
        }

        if (longestValidMatch) {
            result += longestValidMatch.target;
            i = j;
        } else {
            result += text[i];
            i++;
        }
    }

    return result;
};

/**
 * Compiles regex patterns based on the provided rules.
 *
 * @param {Array<Object>} rules - An array of objects representing the regex rules.
 * @returns {Array<Object>} - An array of compiled regex rules.
 */
export const compileRegexPatterns = (rules) => {
    const compiled = rules.map(({ flags, pattern, ...rule }) => {
        return { regex: new RegExp(pattern, flags), ...rule };
    });

    return compiled;
};

/**
 * Applies regex replacements to the text based on the provided rules.
 *
 * @param {Array<Object>} rules - An array of objects representing the regex rules.
 * @param {string} text - The text to apply regex replacements to.
 * @returns {string} - The modified text.
 */
export const applyRegexReplacements = (rules, text) => {
    let modifiedText = text;

    rules.forEach((rule) => {
        modifiedText = modifiedText.replace(rule.regex, rule.replacement);
    });

    return modifiedText;
};
