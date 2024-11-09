import { describe, expect, it } from 'vitest';

import { APOSTROPHE_LIKE_REGEX } from './constants';
import { CaseSensitivity, MatchType, RuleOptions, TrieNode, TriePattern } from './types';
import {
    adjustCasing,
    adjustClipping,
    generateCaseVariants,
    getReplacement,
    insertWordIntoTrie,
    isConsidered,
    isLetter,
    isLowerCase,
    isUpperCase,
    isValidMatch,
    isWordCharacterAt,
    mapTriePatternToRegex,
} from './utils';

describe('utils', () => {
    describe('isLetter', () => {
        it('should return true for letters', () => {
            expect(isLetter('a')).toBe(true);
            expect(isLetter('Z')).toBe(true);
            expect(isLetter('ñ')).toBe(true);
            expect(isLetter('😊')).toBe(false);
        });

        it('should return false for non-letters', () => {
            expect(isLetter('1')).toBe(false);
            expect(isLetter('@')).toBe(false);
            expect(isLetter(' ')).toBe(false);
            expect(isLetter('!')).toBe(false);
        });
    });

    describe('isUpperCase', () => {
        it('should return true for uppercase letters', () => {
            expect(isUpperCase('A')).toBe(true);
            expect(isUpperCase('Z')).toBe(true);
            expect(isUpperCase('Ñ')).toBe(true);
        });

        it('should return false for lowercase letters and non-letters', () => {
            expect(isUpperCase('a')).toBe(false);
            expect(isUpperCase('z')).toBe(false);
            expect(isUpperCase('ñ')).toBe(false);
            expect(isUpperCase('1')).toBe(false);
            expect(isUpperCase('@')).toBe(false);
        });
    });

    describe('isLowerCase', () => {
        it('should return true for lowercase letters', () => {
            expect(isLowerCase('a')).toBe(true);
            expect(isLowerCase('z')).toBe(true);
            expect(isLowerCase('ñ')).toBe(true);
        });

        it('should return false for uppercase letters and non-letters', () => {
            expect(isLowerCase('A')).toBe(false);
            expect(isLowerCase('Z')).toBe(false);
            expect(isLowerCase('Ñ')).toBe(false);
            expect(isLowerCase('1')).toBe(false);
            expect(isLowerCase('@')).toBe(false);
        });
    });

    describe('isWordCharacterAt', () => {
        it('should return true for letters', () => {
            expect(isWordCharacterAt('hello', 1)).toBe(true); // 'e'
            expect(isWordCharacterAt('H', 0)).toBe(true);
            expect(isWordCharacterAt('ñandú', 2)).toBe(true); // 'a'
        });

        it('should return true for apostrophes between letters', () => {
            expect(isWordCharacterAt("O'Connor", 1)).toBe(true);
        });

        it('should return false for apostrophes not between letters', () => {
            expect(isWordCharacterAt("'hello", 0)).toBe(false);
            expect(isWordCharacterAt("hello'", 5)).toBe(false);
            expect(isWordCharacterAt("it's", 2)).toBe(false); // 's' is possessive
            expect(isWordCharacterAt("O'", 1)).toBe(false); // 'O' followed by '''
        });

        it('should return false for non-word characters', () => {
            expect(isWordCharacterAt('hello', -1)).toBe(false);
            expect(isWordCharacterAt('hello', 10)).toBe(false);
            expect(isWordCharacterAt('hello!', 5)).toBe(false);
            expect(isWordCharacterAt('12345', 2)).toBe(false);
        });
    });

    describe('isValidMatch', () => {
        const text = "Hello world! It's a beautiful day.";

        it('should validate whole word matches correctly', () => {
            // Match "world" as whole
            expect(isValidMatch(text, 6, 11, { match: MatchType.Whole })).toBe(true);
            // Match "world" within "world!"
            expect(isValidMatch(text, 6, 11, { match: MatchType.Whole })).toBe(true);
            // Match "world" in "world!It's"
            expect(isValidMatch(text, 6, 11, { match: MatchType.Whole })).toBe(true);
            // Match "world" not as whole
            expect(isValidMatch(text, 6, 10, { match: MatchType.Whole })).toBe(false);
        });

        it('should validate alone matches correctly', () => {
            // Corrected indices to match the start and end of "beautiful"
            expect(isValidMatch(text, 20, 29, { match: MatchType.Alone })).toBe(true);
        });

        it('should return true for matches with no specific match type', () => {
            expect(isValidMatch(text, 0, 5)).toBe(true); // "Hello"
            expect(isValidMatch(text, 6, 11)).toBe(true); // "world"
            expect(isValidMatch(text, 13, 17)).toBe(true); // "It's"
        });
    });

    describe('isConsidered', () => {
        it('should return true if no confirm option is provided', () => {
            expect(isConsidered()).toBe(true);
            expect(isConsidered({})).toBe(true);
        });

        it('should return true if confirm callback returns true', () => {
            const callback = ({ anyOf }) => anyOf.includes('test');
            expect(isConsidered({ confirm: { anyOf: ['test'] } }, callback)).toBe(true);
        });

        it('should return false if confirm callback returns false', () => {
            const callback = ({ anyOf }) => anyOf.includes('test');
            expect(isConsidered({ confirm: { anyOf: ['not-test'] } }, callback)).toBe(false);
        });
    });

    describe('mapTriePatternToRegex', () => {
        it('should map TriePattern.Apostrophes to APOSTROPHE_LIKE_REGEX', () => {
            expect(mapTriePatternToRegex(TriePattern.Apostrophes)).toEqual(APOSTROPHE_LIKE_REGEX);
        });

        it('should return the regex if a RegExp is provided', () => {
            const customRegex = /['’]/;
            expect(mapTriePatternToRegex(customRegex)).toEqual(customRegex);
        });
    });

    describe('adjustCasing', () => {
        it('should adjust casing based on the matched text', () => {
            expect(adjustCasing('hello', 'WORLD')).toBe('world');
            expect(adjustCasing('HELLO', 'world')).toBe('WORLD');
            expect(adjustCasing('Hello', 'World')).toBe('World');
        });

        it('should handle non-alphabetic characters correctly', () => {
            expect(adjustCasing('h3llo', 'W0rld')).toBe('w0rld'); // Corrected expectation
            expect(adjustCasing('he!!o', 'wo!!d')).toBe('wo!!d');
            expect(adjustCasing('hello!', 'WORLD!')).toBe('world!');
        });

        it('should handle cases where matched text has more letters than target text', () => {
            expect(adjustCasing('HELLO', 'WO')).toBe('WO');
        });
    });

    describe('generateCaseVariants', () => {
        it('should return the original string if no alphabetic letters are present', () => {
            expect(generateCaseVariants('12345')).toEqual(['12345']);
            expect(generateCaseVariants('!!!')).toEqual(['!!!']);
            expect(generateCaseVariants('')).toEqual(['']);
        });

        it('should generate uppercase and lowercase variants based on the first alphabetic letter', () => {
            expect(generateCaseVariants('hello')).toEqual(['Hello', 'hello']);
            expect(generateCaseVariants('Hello')).toEqual(['Hello', 'hello']);
            expect(generateCaseVariants("'Umar")).toEqual(["'Umar", "'umar"]);
        });

        it('should not generate duplicates if uppercase and lowercase are the same', () => {
            expect(generateCaseVariants('123A45')).toEqual(['123A45', '123a45']);
            expect(generateCaseVariants('123Ά45')).toEqual(['123Ά45', '123ά45']); // Greek capital and small alpha tonos
        });
    });

    describe('adjustClipping', () => {
        it('should handle cases where no clipping is needed', () => {
            const text = 'hello';
            const endIndex = 5;
            const resultString = 'hello';
            const options: RuleOptions = {};

            const { adjustedIndex, clippingIndex } = adjustClipping(text, endIndex, resultString, options);
            expect(adjustedIndex).toBe(5);
            expect(clippingIndex).toBe(5);
        });

        it('should only clip start if only clipStartPattern is provided', () => {
            const text = "'Umar";
            const endIndex = 5;
            const resultString = "'";
            const options: RuleOptions = {
                clipStartPattern: TriePattern.Apostrophes,
            };

            const { adjustedIndex, clippingIndex } = adjustClipping(text, endIndex, resultString, options);
            expect(adjustedIndex).toBe(5);
            expect(clippingIndex).toBe(0); // Removed the apostrophe
        });

        it('should only clip end if only clipEndPattern is provided', () => {
            const text = "Umar'";
            const endIndex = 4;
            const resultString = 'Umar';
            const options: RuleOptions = {
                clipEndPattern: /[`'ʾʿ‘’]+$/,
            };

            const { adjustedIndex } = adjustClipping(text, endIndex, resultString, options);
            expect(adjustedIndex).toBe(5); // Skipping the apostrophe at index 4
        });
    });

    describe('getReplacement', () => {
        it('should handle prefix addition when prefix is not present', () => {
            const params = {
                endIndex: 5,
                matchedNode: {
                    isEndOfWord: true,
                    options: { prefix: 'Hello ' },
                    target: 'World',
                } as TrieNode,
                options: {},
                startIndex: 0,
                text: 'hello',
            };

            expect(getReplacement(params)).toBe('Hello World');
        });

        it('should not add prefix if it is already present', () => {
            const params = {
                endIndex: 11,
                matchedNode: {
                    isEndOfWord: true,
                    options: { prefix: 'Hello ' },
                    target: 'World',
                } as TrieNode,
                options: {},
                startIndex: 6,
                text: 'Hello world',
            };

            expect(getReplacement(params)).toBe('World');
        });

        it('should adjust casing when casing option is insensitive', () => {
            const params = {
                endIndex: 5,
                matchedNode: {
                    isEndOfWord: true,
                    options: { casing: CaseSensitivity.Insensitive },
                    target: 'World',
                } as TrieNode,
                options: {},
                startIndex: 0,
                text: 'HELLO',
            };

            expect(getReplacement(params)).toBe('WORLD');
        });

        it('should not adjust casing when casing option is not provided', () => {
            const params = {
                endIndex: 5,
                matchedNode: {
                    isEndOfWord: true,
                    options: {},
                    target: 'World',
                } as TrieNode,
                options: {},
                startIndex: 0,
                text: 'hello',
            };

            expect(getReplacement(params)).toBe('World');
        });

        it('should handle non-alphabetic characters correctly', () => {
            const params = {
                endIndex: 6,
                matchedNode: {
                    isEndOfWord: true,
                    options: { prefix: 'Hello ' },
                    target: 'World!',
                } as TrieNode,
                options: {},
                startIndex: 0,
                text: 'hello',
            };

            expect(getReplacement(params)).toBe('Hello World!');
        });
    });

    describe('insertWordIntoTrie', () => {
        it('should insert a word into the trie correctly', () => {
            const trie: TrieNode = {};
            const word = 'hello';
            const target = 'world';
            const options: RuleOptions = { match: MatchType.Whole };

            insertWordIntoTrie(trie, word, target, options);

            expect(trie).toHaveProperty(['h', 'e', 'l', 'l', 'o']);
            const node = trie['h']['e']['l']['l']['o'];
            expect(node.isEndOfWord).toBe(true);
            expect(node.target).toBe(target);
            expect(node.options).toEqual(options);
        });

        it('should create necessary nodes if they do not exist', () => {
            const trie: TrieNode = {};
            const word = 'test';
            const target = 'exam';
            const options: RuleOptions = {};

            insertWordIntoTrie(trie, word, target, options);

            expect(trie).toHaveProperty(['t', 'e', 's', 't']);
            const node = trie['t']['e']['s']['t'];
            expect(node.isEndOfWord).toBe(true);
            expect(node.target).toBe(target);
            expect(node.options).toEqual(options);
        });

        it('should overwrite existing node data if the same word is inserted again', () => {
            const trie: TrieNode = {};
            const word = 'duplicate';
            const target1 = 'first';
            const target2 = 'second';
            const options1: RuleOptions = {};
            const options2: RuleOptions = { match: MatchType.Alone };

            insertWordIntoTrie(trie, word, target1, options1);
            insertWordIntoTrie(trie, word, target2, options2);

            const node = trie['d']['u']['p']['l']['i']['c']['a']['t']['e'];
            expect(node.isEndOfWord).toBe(true);
            expect(node.target).toBe(target2);
            expect(node.options).toEqual(options2);
        });
    });
});
