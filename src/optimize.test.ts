import { describe, expect, it } from 'bun:test';

import { optimizeRules } from './optimize';
import { CaseSensitivity, MatchType, type Rule, TriePattern } from './types';

describe('optimizeRules', () => {
    describe('case sensitivity consolidation', () => {
        it('should consolidate rules differing only in case', () => {
            const rules: Rule[] = [{ from: ['Source', 'source'], to: 'Target' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Source'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(1);
        });

        it('should handle multiple case variations', () => {
            const rules: Rule[] = [{ from: ['Word', 'word', 'WORD'], to: 'Target' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Word'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(2);
        });

        it('should preserve existing casing option if already case insensitive', () => {
            const rules: Rule[] = [
                {
                    from: ['Source', 'source'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Source'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target',
                },
            ]);
        });

        it('should not consolidate when targets differ', () => {
            const rules: Rule[] = [
                { from: ['Source'], to: 'Target1' },
                { from: ['source'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toHaveLength(2);
            expect(result.savings.sourcesRemoved).toBe(0);
        });

        it('should handle case-insensitive sources across multiple rules', () => {
            const rules: Rule[] = [
                { from: ['Word1', 'word1'], to: 'Target1' },
                { from: ['Word2', 'word2'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Word1'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target1',
                },
                {
                    from: ['Word2'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target2',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(2);
        });

        it('should not consolidate when sources normalize to identical values after apostrophe normalization', () => {
            // Both sources normalize to "Qur'an" (same case), so no case variant exists
            const rules: Rule[] = [{ from: ["Qur'an", 'Qur\u2019an'], to: 'Qurʾān' }];

            const result = optimizeRules(rules, { normalizeApostrophes: true });

            // Should consolidate via apostrophe normalization, NOT case sensitivity
            expect(result.optimizedRules[0].options?.casing).toBeUndefined();
            expect(result.savings.sourcesRemoved).toBe(1);
        });
    });

    describe('apostrophe normalization', () => {
        it('should consolidate rules differing only in apostrophe characters when normalizeApostrophes is true', () => {
            const rules: Rule[] = [{ from: ["Qur'an", "Qur'an", 'Qur`an'], to: 'Qurʾān' }];

            const result = optimizeRules(rules, { normalizeApostrophes: true });

            expect(result.optimizedRules).toEqual([{ from: ["Qur'an"], to: 'Qurʾān' }]);
            expect(result.savings.sourcesRemoved).toBe(2);
        });

        it('should not consolidate apostrophe variants when normalizeApostrophes is false', () => {
            const rules: Rule[] = [{ from: ["Qur'an", 'Qur’an'], to: 'Qurʾān' }];

            const result = optimizeRules(rules, { normalizeApostrophes: false });

            expect(result.optimizedRules).toEqual([{ from: ["Qur'an", 'Qur’an'], options: undefined, to: 'Qurʾān' }]);
            expect(result.savings.sourcesRemoved).toBe(0);
        });

        it('should handle multiple apostrophe-like characters', () => {
            const rules: Rule[] = [{ from: ["Ka'bah", "Ka'bah", 'Ka`bah', 'Kaʼbah', 'Kaʾbah'], to: 'Kaʿbah' }];

            const result = optimizeRules(rules, { normalizeApostrophes: true });

            expect(result.optimizedRules).toEqual([{ from: ["Ka'bah"], to: 'Kaʿbah' }]);
            expect(result.savings.sourcesRemoved).toBe(4);
        });
    });

    describe('prefix optimization', () => {
        it('should optimize rules with redundant prefix variations when bases match', () => {
            const rules: Rule[] = [{ from: ['Bukhari', 'al-Bukhari'], to: 'al-Bukhari' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Bukhari'],
                    options: { prefix: 'al-' },
                    to: 'Bukhari',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(1);
        });

        it('should handle multiple prefix variations when bases match', () => {
            const rules: Rule[] = [{ from: ['Shawkani', 'al-Shawkani', 'ash-Shawkani'], to: 'al-Shawkani' }];

            const result = optimizeRules(rules);

            // ash- is a different prefix than al- and target doesn't start with ash-,
            // so ash-Shawkani cannot be consolidated with the al- prefix option.
            expect(result.optimizedRules).toEqual([
                {
                    from: ['Shawkani', 'ash-Shawkani'],
                    options: { prefix: 'al-' },
                    to: 'Shawkani',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(1);
        });

        it('should not optimize when sources have mixed different prefix types', () => {
            // al- and ar- are two different prefixes, detectPrefix should return null
            const rules: Rule[] = [{ from: ['Bukhari', 'al-Bukhari', 'ar-Bukhari'], to: 'al-Bukhari' }];

            const result = optimizeRules(rules);

            // Prefix optimization should still work for al- since al- matches target
            // but the ar- variant stays because it has a different prefix
            expect(result.optimizedRules[0].from).toContain('ar-Bukhari');
        });

        it('should prefer the non-prefixed version when it appears after the prefixed version', () => {
            // Order matters: prefixed version listed first, non-prefixed second
            // Include an extra prefixed variant so sourcesRemoved is correctly tracked
            const rules: Rule[] = [{ from: ['al-Nawawi', 'An-Nawawi', 'Nawawi'], to: 'al-Nawawi' }];

            const result = optimizeRules(rules);

            // Non-prefixed 'Nawawi' should be kept; both al- prefixed variants removed
            expect(result.optimizedRules[0].from).toContain('Nawawi');
            expect(result.optimizedRules[0].options?.prefix).toBe('al-');
        });

        it('should not optimize when targets have different bases from sources', () => {
            const rules: Rule[] = [{ from: ['Bukhari', 'al-Bukhari'], to: 'al-Bukhārī' }];

            const result = optimizeRules(rules);

            // Can't optimize because 'Bukhari' != 'Bukhārī' (different characters)
            expect(result.optimizedRules).toEqual([
                {
                    from: ['Bukhari', 'al-Bukhari'],
                    to: 'al-Bukhārī',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(0);
        });

        it('should preserve existing prefix option', () => {
            const rules: Rule[] = [
                {
                    from: ['Bukhari', 'al-Bukhari'],
                    options: { prefix: 'al-' },
                    to: 'Bukhari',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Bukhari'],
                    options: { prefix: 'al-' },
                    to: 'Bukhari',
                },
            ]);
        });
    });

    describe('clip pattern optimization', () => {
        it('should optimize start clipping with apostrophes', () => {
            const rules: Rule[] = [{ from: ['Umar', "'Umar", 'ʻUmar'], to: 'ʿUmar' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Umar'],
                    options: { clipStartPattern: TriePattern.Apostrophes },
                    to: 'ʿUmar',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(2);
        });

        it('should optimize end clipping with apostrophes', () => {
            const rules: Rule[] = [{ from: ['ulamaa', "ulamaa'", 'ulamaaʾ'], to: 'ʿulamāʾ' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['ulamaa'],
                    options: { clipEndPattern: TriePattern.Apostrophes },
                    to: 'ʿulamāʾ',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(2);
        });

        it('should prefer version without clip-start chars when it appears after clipped version', () => {
            // Clipped variants listed first, non-clipped last. The first clipped entry claims
            // the map slot, the second clipped entry increments sourcesRemoved (same key as first),
            // then the non-clipped entry replaces the first via the else-branch preference.
            const rules: Rule[] = [{ from: ['\u2018Uthman', '\u02BBUthman', 'Uthman'], to: '\u02BFUthm\u0101n' }];

            const result = optimizeRules(rules);

            // The non-clipped 'Uthman' should be preferred
            expect(result.optimizedRules[0].from).toEqual(['Uthman']);
            expect(result.optimizedRules[0].options?.clipStartPattern).toBe(TriePattern.Apostrophes);
        });

        it('should prefer version without clip-end chars when it appears after clipped version', () => {
            // Clipped variants listed first, non-clipped last.
            const rules: Rule[] = [{ from: ["du'a\u2019", "du'a\u02BE", "du'a"], to: 'du\u02BF\u0101\u02BE' }];

            const result = optimizeRules(rules);

            // The non-clipped "du'a" should be preferred
            expect(result.optimizedRules[0].from).toEqual(["du'a"]);
            expect(result.optimizedRules[0].options?.clipEndPattern).toBe(TriePattern.Apostrophes);
        });

        it('should preserve existing clip patterns', () => {
            const rules: Rule[] = [
                {
                    from: ['ulamaa', "ulamaa'"],
                    options: { clipEndPattern: TriePattern.Apostrophes },
                    to: 'ʿulamāʾ',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['ulamaa'],
                    options: { clipEndPattern: TriePattern.Apostrophes },
                    to: 'ʿulamāʾ',
                },
            ]);
        });
    });

    describe('combined optimizations', () => {
        it('should apply multiple optimizations together', () => {
            const rules: Rule[] = [
                {
                    from: ['Source', 'source', "'Source", "'source", "Source'", "source'"],
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules, { normalizeApostrophes: true });

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Source'],
                    options: {
                        casing: CaseSensitivity.Insensitive,
                        clipEndPattern: TriePattern.Apostrophes,
                        clipStartPattern: TriePattern.Apostrophes,
                    },
                    to: 'Target',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(5);
        });

        it('should combine case sensitivity with prefix', () => {
            const rules: Rule[] = [{ from: ['Bukhari', 'bukhari', 'al-Bukhari', 'al-bukhari'], to: 'al-Bukhari' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['Bukhari'],
                    options: {
                        casing: CaseSensitivity.Insensitive,
                        prefix: 'al-',
                    },
                    to: 'Bukhari',
                },
            ]);
            expect(result.savings.sourcesRemoved).toBe(3);
        });
    });

    describe('subset elimination', () => {
        it('should remove redundant subset rules', () => {
            const rules: Rule[] = [
                { from: ['Source1', 'Source2', 'Source3'], to: 'Target' },
                { from: ['Source1', 'Source2'], to: 'Target' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([{ from: ['Source1', 'Source2', 'Source3'], to: 'Target' }]);
            expect(result.savings.rulesRemoved).toBe(1);
        });

        it('should not remove subsets with different targets', () => {
            const rules: Rule[] = [
                { from: ['Source1', 'Source2', 'Source3'], to: 'Target1' },
                { from: ['Source1', 'Source2'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toHaveLength(2);
            expect(result.savings.rulesRemoved).toBe(0);
        });

        it('should not remove rules with same target and options but overlapping non-subset sources', () => {
            // Use different targets so groupRulesByTarget won't merge them into one group
            const rules: Rule[] = [
                { from: ['Alpha', 'Gamma'], to: 'Target1' },
                { from: ['Beta', 'Delta'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            // Different targets means removeSubsets skips them
            expect(result.optimizedRules).toHaveLength(2);
            expect(result.savings.rulesRemoved).toBe(0);
        });

        it('should not remove rules with same target but different options', () => {
            // Same target but different options → different groupRulesByTarget keys → separate optimized rules
            // removeSubsets will compare them but optKey won't match (line 689)
            const rules: Rule[] = [
                { from: ['Alpha', 'Beta', 'Gamma'], options: { match: MatchType.Whole }, to: 'Target' },
                { from: ['Delta', 'Epsilon'], options: { match: MatchType.Alone }, to: 'Target' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toHaveLength(2);
        });

        it('should keep both rules when optimized rules have same target and options but non-subset from arrays', () => {
            // Rule A: already has casing option, group key includes it
            // Rule B: no casing option initially, but optimizeGroup detects case variants and adds it
            // After optimization, both end up with same target + same options ({casing: 'i'})
            // but different from arrays, so neither is a strict subset of the other.
            const rules: Rule[] = [
                {
                    from: ['Alpha'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target',
                },
                {
                    from: ['Beta', 'beta'],
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            // Both rules should survive:
            // Rule A → { from: ['Alpha'], options: { casing: 'i' }, to: 'Target' }
            // Rule B → { from: ['Beta'], options: { casing: 'i' }, to: 'Target' } (after case dedup)
            // In removeSubsets: same target, same optKey, but from ['Alpha'] is NOT a subset of ['Beta']
            expect(result.optimizedRules).toHaveLength(2);
            expect(result.savings.rulesRemoved).toBe(0);
        });

        it('should remove a rule via removeSubsets when it is a proper subset of another after optimization', () => {
            // Rule A: has casing already set, from: ['Alpha', 'Beta']
            // Rule B: no casing initially, but gains it via case variant detection, from: ['Alpha', 'alpha']
            // After optimizeGroup:
            //   A → { from: ['Alpha', 'Beta'], options: { casing: 'i' }, to: 'Target' }
            //   B → { from: ['Alpha'], options: { casing: 'i' }, to: 'Target' } (alpha deduped)
            // In removeSubsets: same target, same optKey, B.fromSet {Alpha} ⊂ A.fromSet {Alpha, Beta} → removed
            const rules: Rule[] = [
                {
                    from: ['Alpha', 'Beta'],
                    options: { casing: CaseSensitivity.Insensitive },
                    to: 'Target',
                },
                {
                    from: ['Alpha', 'alpha'],
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toHaveLength(1);
            expect(result.optimizedRules[0].from).toEqual(['Alpha', 'Beta']);
        });
    });

    describe('conflict detection', () => {
        it('should detect identical sources with different targets', () => {
            const rules: Rule[] = [
                { from: ['Source'], to: 'Target1' },
                { from: ['Source'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            expect(result.warnings.conflicts).toHaveLength(1);
            expect(result.warnings.conflicts[0]).toEqual({
                conflictingTo: ['Target1', 'Target2'],
                from: 'Source',
            });
        });

        it('should detect conflicts within a single rule when sources normalize to same', () => {
            const rules: Rule[] = [
                { from: ['Source', 'source'], to: 'Target1' },
                { from: ['source'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            expect(result.warnings.conflicts.length).toBeGreaterThan(0);
        });
    });

    describe('match type optimizations', () => {
        it('should detect match type conflicts with same source', () => {
            const rules: Rule[] = [
                {
                    from: ['word'],
                    options: { match: MatchType.Whole },
                    to: 'Target1',
                },
                {
                    from: ['word'],
                    options: { match: MatchType.Alone },
                    to: 'Target2',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.warnings.matchTypeConflicts).toHaveLength(1);
            expect(result.warnings.matchTypeConflicts[0].from).toBe('word');
        });

        it('should consolidate redundant match types with same target - Alone and Whole', () => {
            const rules: Rule[] = [
                {
                    from: ['word'],
                    options: { match: MatchType.Alone },
                    to: 'Target',
                },
                {
                    from: ['word'],
                    options: { match: MatchType.Whole },
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['word'],
                    options: { match: MatchType.Whole },
                    to: 'Target',
                },
            ]);
            expect(result.savings.rulesRemoved).toBe(1);
        });

        it('should consolidate Whole and Any match types', () => {
            const rules: Rule[] = [
                {
                    from: ['word'],
                    options: { match: MatchType.Whole },
                    to: 'Target',
                },
                {
                    from: ['word'],
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['word'],
                    to: 'Target',
                },
            ]);
            expect(result.savings.rulesRemoved).toBe(1);
        });

        it('should handle all three match types and keep the most permissive', () => {
            const rules: Rule[] = [
                {
                    from: ['word'],
                    options: { match: MatchType.Alone },
                    to: 'Target',
                },
                {
                    from: ['word'],
                    options: { match: MatchType.Whole },
                    to: 'Target',
                },
                {
                    from: ['word'],
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual([
                {
                    from: ['word'],
                    to: 'Target',
                },
            ]);
            expect(result.savings.rulesRemoved).toBe(2);
        });

        it('should not discard other sources when consolidating a shared source across rules', () => {
            const rules: Rule[] = [
                {
                    from: ['x', 'y'],
                    options: { match: MatchType.Alone },
                    to: 'Target',
                },
                {
                    from: ['x'],
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            // "x" should be consolidated to the most permissive (Any from Rule B)
            // "y" from Rule A should NOT be silently lost
            expect(result.optimizedRules).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ from: ['y'], to: 'Target' }),
                    expect.objectContaining({ from: ['x'], to: 'Target' }),
                ]),
            );
        });
    });

    describe('overwritten rules detection', () => {
        it('should detect when rules would be overwritten in trie', () => {
            const rules: Rule[] = [
                { from: ['word'], to: 'First' },
                { from: ['word'], to: 'Second' },
                { from: ['word'], to: 'Third' },
            ];

            const result = optimizeRules(rules);

            expect(result.warnings.overwrittenRules).toHaveLength(1);
            expect(result.warnings.overwrittenRules[0]).toEqual({
                discarded: [
                    { from: ['word'], to: 'First' },
                    { from: ['word'], to: 'Second' },
                ],
                from: 'word',
                kept: { from: ['word'], to: 'Third' },
            });
        });

        it('should handle overwritten rules with different options', () => {
            const rules: Rule[] = [
                {
                    from: ['word'],
                    options: { match: MatchType.Whole },
                    to: 'First',
                },
                {
                    from: ['word'],
                    options: { match: MatchType.Alone },
                    to: 'Second',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.warnings.overwrittenRules).toHaveLength(1);
        });
    });

    describe('edge cases', () => {
        it('should handle empty rules array', () => {
            const result = optimizeRules([]);

            expect(result.optimizedRules).toEqual([]);
            expect(result.savings.sourcesRemoved).toBe(0);
            expect(result.savings.rulesRemoved).toBe(0);
        });

        it('should handle single rule with single source', () => {
            const rules: Rule[] = [{ from: ['Source'], to: 'Target' }];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual(rules);
            expect(result.savings.sourcesRemoved).toBe(0);
        });

        it('should preserve rules with options that cannot be optimized', () => {
            const rules: Rule[] = [
                {
                    from: ['word'],
                    options: {
                        confirm: { anyOf: ['test'] },
                        match: MatchType.Whole,
                    },
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual(rules);
        });

        it('should handle rules with multiple different optimizations needed', () => {
            const rules: Rule[] = [
                { from: ['Word1', 'word1'], to: 'Target1' },
                { from: ['Bukhari', 'al-Bukhari'], to: 'al-Bukhārī' },
                { from: ['Umar', "'Umar"], to: 'ʿUmar' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toHaveLength(3);
            // Rule 1: case consolidation removes 1
            // Rule 2: can't optimize (base mismatch), removes 0
            // Rule 3: clip start removes 1
            expect(result.savings.sourcesRemoved).toBe(2);
        });
    });

    describe('statistics', () => {
        it('should accurately count sources removed', () => {
            const rules: Rule[] = [
                { from: ['A', 'a', 'B', 'b'], to: 'Target1' },
                { from: ['C', 'c'], to: 'Target2' },
            ];

            const result = optimizeRules(rules);

            // Rule 1: Combines [A,a] and [B,b] using case insensitive, removes 2 (a and b)
            // Rule 2: Combines [C,c] using case insensitive, removes 1 (c)
            expect(result.savings.sourcesRemoved).toBe(3);
        });

        it('should accurately count rules removed', () => {
            const rules: Rule[] = [
                { from: ['Source1', 'Source2', 'Source3'], to: 'Target' },
                { from: ['Source1', 'Source2'], to: 'Target' },
                { from: ['Source1'], to: 'Target' },
            ];

            const result = optimizeRules(rules);

            expect(result.savings.rulesRemoved).toBe(2);
        });
    });

    describe('preserving rule order and structure', () => {
        it('should preserve the order of non-optimizable rules', () => {
            const rules: Rule[] = [
                { from: ['First'], to: 'Target1' },
                { from: ['Second'], to: 'Target2' },
                { from: ['Third'], to: 'Target3' },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules).toEqual(rules);
        });

        it('should merge options correctly without losing existing options', () => {
            const rules: Rule[] = [
                {
                    from: ['Word', 'word'],
                    options: { match: MatchType.Whole },
                    to: 'Target',
                },
            ];

            const result = optimizeRules(rules);

            expect(result.optimizedRules[0].options).toEqual({
                casing: CaseSensitivity.Insensitive,
                match: MatchType.Whole,
            });
        });
    });
});
