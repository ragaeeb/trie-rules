# Table of Contents

-   [Introduction](#introduction)
-   [Usage Guide](#trie-rules-usage-guide)
    -   [Installation](#installation)
    -   [API](#api)
        -   [buildTrie](#buildtrie)
        -   [searchAndReplace](#searchandreplace)
        -   [containsTarget](#containstarget)
        -   [containsSource](#containssource)
-   [Performance](#performance)
    -   [Background History](#background-history)
    -   [Advantages of trie-based search over regex](#advantages-of-trie-based-search-over-regex)

# Introduction

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/58624615-104c-4910-9245-ff6a17984295.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/58624615-104c-4910-9245-ff6a17984295)
![David](https://img.shields.io/david/ragaeeb/trie-rules)
![GitHub](https://img.shields.io/github/license/ragaeeb/trie-rules)
![npm](https://img.shields.io/npm/v/trie-rules)
![npm](https://img.shields.io/npm/dm/trie-rules)
![GitHub issues](https://img.shields.io/github/issues/ragaeeb/trie-rules)
![GitHub stars](https://img.shields.io/github/stars/ragaeeb/trie-rules?style=social)

The `trie-rules` project is an efficient search and replace algorithm that performs replacements on any given text based on a predefined rule set.

This project was mainly created to replace transliterations of Arabic words in Roman text along with their appropriate diacritics in a performant way.

However the rule set structure is flexible enough to apply to a wide range of applications.

# trie-rules Usage Guide

This guide explains how to use the exported functions from `trie-rules`.

## Installation

```bash
npm i trie-rules
```

## `buildTrie(rules: Rule[]): TrieNode`

The `buildTrie` function constructs a trie data structure from an array of `rules`. This trie is used to efficiently search through text and replace specified source words with their corresponding target words.

### Parameters:

-   `rules` (Array of `Rule` objects): Each `Rule` object should have the following properties:
    -   `sources` (Array of strings): The words to search for in the text.
    -   `target` (string): The word to replace the sources with in the text.
    -   `options` (optional `RuleOption` object): Additional options for matching rules which may include:
        -   `match` (optional string): Can be `'whole'` or `'alone'`, indicating how the match should be treated.
            -   `'whole'`: The match should be on an entire word, not surrounded by other alphabet characters or special characters with diacritics. Punctuation or symbols around it are allowed.
            -   `'alone'`: The match should only be considered when the text is surrounded by spaces.
        -   `prefix` (optional string): A prefix that, if not present in the text, should be added to the target replacement.

### Returns:

-   `TrieNode`: The root node of the trie data structure that represents the rules for search and replacement.

### Usage:

```js
import { buildTrie } from './trie';

const rules = [
    {
        sources: ['example', 'sample'],
        target: 'demo',
    },
    {
        sources: ['specificword'],
        target: 'replacement',
        options: {
            match: 'whole',
        },
    },
    {
        sources: ['anotherword'],
        target: 'substitute',
        options: {
            match: 'alone',
            prefix: 'pre-',
        },
    },
];

const trie = buildTrie(rules);

// The trie can now be used with the searchAndReplace function to process text.
```

Note:
The function assumes case-sensitive matching. The trie constructed is optimized for the `searchAndReplace` function provided in the same library, and it may not be compatible with other search functions or trie implementations.

## `searchAndReplace(trie: TrieNode, text: string): string`

The `searchAndReplace` function takes a trie data structure and a text string as inputs and searches the text for words that match any of the sources described in the trie. When a match is found, it replaces the word in the text with the corresponding target word from the trie.

### Parameters:

-   `trie` (`TrieNode`): The trie data structure that should be used for the search-and-replace operation. This trie should be constructed using the `buildTrie` function.
-   `text` (string): The text in which to search for and replace words.

### Returns:

-   `string`: A new string with all occurrences of the source words replaced by their corresponding target words as defined by the rules in the trie.

### Usage:

```js
import { buildTrie, searchAndReplace } from './trie';

// Define your rules
const rules = [
    // ... (rules as defined in the buildTrie documentation) ...
];

// Build the trie from the rules
const trie = buildTrie(rules);

// The text you want to process
const text = 'This is an example text with specificword and anotherword in it.';

// Perform the search and replace operation
const replacedText = searchAndReplace(trie, text);

console.log(replacedText); // Outputs the text with 'example' and 'specificword' replaced by 'demo' and 'replacement', respectively.
```

## `containsTarget(trie: TrieNode, target: string): boolean`

The `containsTarget` function checks whether a given target string is present as a replacement in the trie data structure.

### Parameters:

-   `trie` (`TrieNode`): The trie data structure to search within. This trie should be constructed using the `buildTrie` function.
-   `target` (string): The target replacement string to search for in the trie.

### Returns:

-   `boolean`: Returns `true` if the target is present in the trie as a replacement, `false` otherwise.

### Usage:

```js
// Assuming trie is already built using buildTrie
const targetExists = containsTarget(trie, 'demo');
console.log(targetExists); // Outputs true if 'demo' is a target in the trie, false otherwise.
```

## `containsSource(trie: TrieNode, source: string): boolean`

The `containsSource` function determines if a given source string is represented within the trie data structure. This can be particularly useful to verify if a source word has been included in the trie and is therefore searchable and replaceable using the `searchAndReplace` function.

### Parameters:

-   `trie` (`TrieNode`): The trie data structure previously built using the `buildTrie` function.
-   `source` (string): The source string for which to check presence in the trie.

### Returns:

-   `boolean`: True if the source string is present in the trie, false otherwise.

### Usage Example:

```js
// Assuming the trie has been built using the buildTrie function with your rules
const trie = buildTrie(rules);

// Check if the source 'example' is in the trie
const isSourceInTrie = containsSource(trie, 'example');
console.log(isSourceInTrie); // Outputs true if 'example' is a source in the trie, false otherwise.
```

# Performance

## Background History

Initially the rule sets were being compiled into a single Regex function.

```js
const Alone = (word) => `(?<!\\S)${word}(?!\\S) `;
const Bounded = (word) => `\\b${word}\\b`;

const sentenceCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const applyRules = (dictionary, text) => {
    const regex = new RegExp(Object.keys(dictionary).join('|'), 'g');

    return text.replace(
        regex,
        (matched) => dictionary[Alone(matched.trim())] || dictionary[Bounded(matched)] || dictionary[matched] || '',
    );
};

const boundedSource = (whole, source) => {
    if (Number(whole) === 2) {
        return Alone(source);
    }

    return whole ? Bounded(source) : source;
};

const reduceSourceToTarget =
    ({ target, whole, caseless }) =>
    (full, source) => {
        const toReturn = { ...full };
        const wrappedSource = boundedSource(whole, source);

        toReturn[wrappedSource] = target;

        if (caseless) {
            toReturn[boundedSource(whole, sentenceCase(source))] =
                Number(caseless) === 1 ? sentenceCase(target) : target;
            toReturn[boundedSource(whole, source.toLowerCase())] =
                Number(caseless) === 1 ? target.toLowerCase() : target;
        }

        return toReturn;
    };

const reduceRuleToDictionary = (dictionary, rule) =>
    rule.sources.split('|').reduce(reduceSourceToTarget(rule), dictionary);

describe('applyRules', () => {
    it('sentence with whole word and normal text', () => {
        const dictionary = {
            Sufyan: 'Sufyān',
            '\\bAli\\b': 'ʿAlī',
        };

        expect(applyRules(dictionary, 'Ali and Sufyan went with Alison to the park.')).toEqual(
            'ʿAlī and Sufyān went with Alison to the park.',
        );
    });

    it('should not replace az to al-', () => {
        const dictionary = {
            '\\baz\\b': 'al-',
        };

        expect(applyRules(dictionary, 'az-Zuhri')).toEqual('al--Zuhri');
    });

    it('should not replace az to al-', () => {
        const dictionary = {
            '(?<!\\S)az(?!\\S) ': 'al-',
            '(?<!\\S)Az(?!\\S) ': 'al-',
            '(?<!\\S)ath(?!\\S) ': 'al-',
            '(?<!\\S)al(?!\\S) ': 'al-',
            '(?<!\\S)Al(?!\\S) ': 'al-',
        };

        expect(applyRules(dictionary, 'az-Zuhri')).toEqual('az-Zuhri');
        expect(applyRules(dictionary, 'az Zuhri')).toEqual('al-Zuhri');
        expect(applyRules(dictionary, 'Az Zuhri')).toEqual('al-Zuhri');
        expect(applyRules(dictionary, 'ath Thawri')).toEqual('al-Thawri');
        expect(applyRules(dictionary, 'al Imam')).toEqual('al-Imam');
        expect(applyRules(dictionary, 'Al Imam')).toEqual('al-Imam');
    });
});
```

However this was very expensive to perform and it was increasingly complex to support custom rules as look-aheads and lookbacks can become more and more inefficient.

The `\b` word boundaries also did not match the diacritic characters.

The Regex engine performance is also platform dependent, so while on a Intel based chip it can perform well, on a ARM64 Apple silicon chip it can be suboptimal as has been witnessed.

### Advantages of regex based search and replacements:

The trie-based `searchAndReplace` algorithm has several advantages over a regular expression (regex) that uses the pipe `|` to match any one of multiple substrings:

1. **Performance for Large Sets of Patterns**: When you have a large number of strings to match against, a regex with many alternatives separated by pipes can become inefficient. The regex engine must check each alternative one by one every time it attempts a match. In contrast, a trie structures the search patterns in a tree, allowing for simultaneous comparison of multiple patterns. This can lead to faster searches, especially when the set of source strings share common prefixes.

2. **Worst-Case Time Complexity**: The time complexity of matching text using a regex can vary depending on the regex engine and the specific patterns being matched. In the worst case, particularly with complex patterns or when backtracking occurs, regex matching can degrade to exponential time complexity. On the other hand, a trie-based search can be performed in linear time relative to the length of the text being searched, which is generally more predictable and often faster.

3. **Memory Efficiency**: Although a trie may consume more memory than a compact regex pattern, the trie's memory usage is more predictable and scales linearly with the size of the input patterns. A complex regex, particularly one with many capturing groups or backreferences, can consume a large and unpredictable amount of memory during matching.

4. **Match Precedence and Overlap**: With a regex, if multiple patterns can match the same part of the text, the regex engine will choose based on the order of the patterns. This can be problematic if you have overlapping patterns and need to prioritize longer matches over shorter ones, which can be easily handled by a trie by storing the length of the matched patterns and checking for the longest match first.

5. **Custom Matching Rules**: A trie-based approach allows for custom matching logic, such as the `whole` and `alone` match options in your case, which would be more complex to implement with regex. With regex, you'd need to construct lookbehind and lookahead assertions for each pattern, which can become cumbersome and may not be supported in all regex engines.

6. **Dynamic Updates**: If the set of patterns needs to be updated frequently, updating a trie can be more efficient. Adding or removing a pattern from a trie is a matter of inserting or deleting nodes, whereas modifying a regex pattern string requires recompiling the entire regex.

7. **Complex Replacements**: Your trie-based approach allows for complex replacements based on custom logic, like adding prefixes where they are missing. This kind of logic goes beyond simple pattern matching and substitution and would require additional processing outside of the regex replace function.

In summary, while a regex can be a powerful tool for pattern matching, a trie-based approach can offer better performance, especially with a large and complex set of patterns, and provides more flexibility for custom matching and replacement logic.

### Runtime Complexity

Let's analyze the runtime complexity of both functions separately:

#### `buildTrie` Function

The `buildTrie` function takes an array of rule objects, each with a `sources` array and a `target` string. For each source word in each rule, it inserts the word into the trie.

-   Let \( n \) be the number of rules.
-   Let \( m \) be the average number of source words per rule.
-   Let \( k \) be the average length of the source words.

The function iterates over each rule and each source word within that rule. For each character in a source word, it performs a constant time check and possibly inserts a new node into the trie.

The complexity is then \( O(n \cdot m \cdot k) \). Since \( n \), \( m \), and \( k \) are independent, you can think of this as the total number of characters across all source words in all rules.

#### `searchAndReplace` Function

The `searchAndReplace` function iterates over the characters in the input text and attempts to match substrings to words in the trie.

-   Let \( l \) be the length of the text to search through.
-   Let \( k \) be the average length of the source words (as defined above).

For each character in the text, in the worst case, the function might have to check \( k \) characters deep into the trie (if there's a potential match). However, note that due to the nature of a trie, the function does not always perform a linear scan of \( k \) characters for every character in \( l \); it can skip ahead whenever a complete word is matched and replaced. Therefore, the worst-case scenario would be if the text consisted of repeating patterns that are all present in the trie.

The complexity for this function can be \( O(l \cdot k) \) in the worst case.

However, if we consider that each character leads to a potential match and we have to check the longest possible match each time, and if there are \( p \) potential matches for each position in the worst case, we might need to consider this as well, leading to a complexity of \( O(l \cdot k \cdot p) \). The value of \( p \) would typically be small and could be considered constant if we assume a limit on the number of variations for a source word in the rules.

In the average and best-case scenarios, where the text doesn't consist of repeating patterns and not every character leads to a match, the performance would be closer to \( O(l) \), since the trie structure allows for quick elimination of non-matching paths.

In practice, the actual performance would depend on the specifics of the input data, such as the size and structure of the trie, and the distribution and frequency of potential matches in the text.
