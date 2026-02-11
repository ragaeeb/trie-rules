import { describe, expect, it } from 'bun:test';
// Import Types to verify they are exported correctly
import type {
    BuildTrieOptions,
    ConfirmCallback,
    OptimizeResult,
    Rule,
    RuleOptions,
    SearchAndReplaceOptions,
    TrieNode,
} from '../dist/index.js';
import * as trieRules from '../dist/index.js';
// Import enums as values (they're needed at runtime)
import { CaseSensitivity, MatchType, TriePattern } from '../dist/index.js';

describe('Build Exports Validation', () => {
    it('should export all expected functions and constants from the main bundle', () => {
        // Core Trie Functions
        expect(trieRules.buildTrie).toBeFunction();
        expect(trieRules.containsSource).toBeFunction();
        expect(trieRules.containsTarget).toBeFunction();
        expect(trieRules.searchAndReplace).toBeFunction();

        // Optimization
        expect(trieRules.optimizeRules).toBeFunction();

        // Constants
        expect(trieRules.APOSTROPHE_LIKE_REGEX).toBeInstanceOf(RegExp);
        expect(trieRules.LETTER_REGEX).toBeInstanceOf(RegExp);

        // Enums
        expect(trieRules.CaseSensitivity).toBeObject();
        expect(trieRules.MatchType).toBeObject();
        expect(trieRules.TriePattern).toBeObject();

        // Utils
        expect(trieRules.adjustCasing).toBeFunction();
        expect(trieRules.findFirstAlphaIndex).toBeFunction();
        expect(trieRules.generateCaseVariants).toBeFunction();
        expect(trieRules.isAlphabeticLetter).toBeFunction();
        expect(trieRules.isLetter).toBeFunction();
        expect(trieRules.isLowerCase).toBeFunction();
        expect(trieRules.isUpperCase).toBeFunction();
        expect(trieRules.isWordCharacterAt).toBeFunction();
    });

    it('should have valid type definitions for all public interfaces', () => {
        // No-op assignments to verify types are exported and usable

        // Core Types
        const _buildOptions: BuildTrieOptions = {} as any;
        const _rule: Rule = {} as any;
        const _ruleOptions: RuleOptions = {} as any;
        const _searchOptions: SearchAndReplaceOptions = {} as any;
        const _trieNode: TrieNode = {} as any;

        // Optimization
        const _optimizeRes: OptimizeResult = {} as any;

        // Callbacks
        const _confirmCb: ConfirmCallback = {} as any;

        // Enums
        const _caseSens: CaseSensitivity = CaseSensitivity.Insensitive;
        const _matchType: MatchType = MatchType.Any;
        const _pattern: TriePattern = TriePattern.Apostrophes;

        // Just to avoid unused var errors (though TS check handles this implicitly by compiling)
        expect([
            _buildOptions,
            _rule,
            _ruleOptions,
            _searchOptions,
            _trieNode,
            _optimizeRes,
            _confirmCb,
            _caseSens,
            _matchType,
            _pattern,
        ]).toBeDefined();
    });
});
