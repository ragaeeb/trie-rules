import { APOSTROPHE_LIKE_REGEX } from './constants.js';
import {
    type BuildTrieOptions,
    CaseSensitivity,
    MatchType,
    type Rule,
    type RuleOptions,
    TriePattern,
} from './types.js';

/**
 * Result of rule optimization including optimized rules and statistics.
 */
export type OptimizeResult = {
    /**
     * The optimized array of rules with redundancies removed and options consolidated.
     */
    optimizedRules: Rule[];

    /**
     * Statistics about the optimization process.
     */
    savings: {
        /**
         * Number of complete rules removed (e.g., subset rules).
         */
        rulesRemoved: number;

        /**
         * Number of individual source strings removed from rules.
         */
        sourcesRemoved: number;
    };

    /**
     * Warnings about potential issues found during optimization.
     */
    warnings: {
        /**
         * From values that have conflicting to values.
         */
        conflicts: Array<{
            from: string;
            conflictingTo: string[];
        }>;

        /**
         * From values with conflicting match types.
         */
        matchTypeConflicts: Array<{
            from: string;
            rules: Rule[];
        }>;

        /**
         * Rules that would be overwritten in the trie.
         */
        overwrittenRules: Array<{
            from: string;
            kept: Rule;
            discarded: Rule[];
        }>;
    };
};

/**
 * Internal representation of a from string with its normalized form and metadata.
 */
type SourceEntry = {
    clipEndChars: string[];
    clipStartChars: string[];
    hasPrefix: string | null;
    normalized: string;
    original: string;
};

/**
 * Groups rules by their to value for analysis.
 */
type RuleGroup = {
    options?: RuleOptions;
    rules: Rule[];
    sources: SourceEntry[];
    to: string;
};

/**
 * Normalizes a from string for comparison by removing apostrophe variants if needed.
 * @param {string} from - The from string to normalize.
 * @param {boolean} normalizeApostrophes - Whether to normalize apostrophe-like characters.
 * @returns {string} The normalized from string.
 */
const APOSTROPHE_LIKE_REGEX_GLOBAL = new RegExp(APOSTROPHE_LIKE_REGEX.source, 'gu');

const normalizeSource = (from: string, normalizeApostrophes: boolean): string => {
    return normalizeApostrophes ? from.replace(APOSTROPHE_LIKE_REGEX_GLOBAL, "'") : from;
};

/**
 * Analyzes a from string to extract clipping and prefix information.
 * @param {string} from - The from string to analyze.
 * @param {string} to - The to replacement string.
 * @param {boolean} normalizeApostrophes - Whether apostrophes are being normalized.
 * @returns {SourceEntry} Metadata about the from string.
 */
const analyzeSource = (from: string, to: string, normalizeApostrophes: boolean): SourceEntry => {
    const normalized = normalizeSource(from, normalizeApostrophes);

    // Detect leading apostrophes
    const clipStartChars: string[] = [];
    let i = 0;
    while (i < from.length && APOSTROPHE_LIKE_REGEX.test(from[i])) {
        clipStartChars.push(from[i]);
        i++;
    }

    // Detect trailing apostrophes
    const clipEndChars: string[] = [];
    let j = from.length - 1;
    while (j >= 0 && APOSTROPHE_LIKE_REGEX.test(from[j])) {
        clipEndChars.unshift(from[j]);
        j--;
    }

    // Detect prefix
    let hasPrefix: string | null = null;
    const commonPrefixes = ['al-', 'ash-', 'an-', 'ar-', 'as-', 'ath-', 'ad-'];
    for (const prefix of commonPrefixes) {
        if (from.startsWith(prefix) && to.startsWith(prefix)) {
            const withoutPrefix = from.slice(prefix.length);
            const toWithoutPrefix = to.slice(prefix.length);
            // Check if removing prefix from both gives us matching base
            if (
                withoutPrefix.toLowerCase() === toWithoutPrefix.toLowerCase() ||
                normalizeSource(withoutPrefix, normalizeApostrophes).toLowerCase() ===
                    normalizeSource(toWithoutPrefix, normalizeApostrophes).toLowerCase()
            ) {
                hasPrefix = prefix;
                break;
            }
        }
    }

    return {
        clipEndChars,
        clipStartChars,
        hasPrefix,
        normalized,
        original: from,
    };
};

/**
 * Groups rules by to value and options for optimization analysis.
 * @param {Rule[]} rules - The rules to group.
 * @param {BuildTrieOptions} [buildOptions] - Build options affecting normalization.
 * @returns {Map<string, RuleGroup>} Map of grouped rules.
 */
const groupRulesByTarget = (
    rules: Rule[],
    buildOptions?: BuildTrieOptions,
): { groups: Map<string, RuleGroup>; rulesMerged: number } => {
    const groups = new Map<string, RuleGroup>();
    const normalizeApostrophes = Boolean(buildOptions?.normalizeApostrophes);
    let rulesMerged = 0;

    for (const rule of rules) {
        const optObj = rule.options || {};
        const key = `${rule.to}::${JSON.stringify(optObj, Object.keys(optObj).sort())}`;

        if (!groups.has(key)) {
            groups.set(key, {
                options: rule.options,
                rules: [],
                sources: [],
                to: rule.to,
            });
        } else {
            // This rule is being merged into an existing group
            rulesMerged++;
        }

        const group = groups.get(key)!;
        group.rules.push(rule);

        for (const from of rule.from) {
            group.sources.push(analyzeSource(from, rule.to, normalizeApostrophes));
        }
    }

    return { groups, rulesMerged };
};

/**
 * Detects if sources can be consolidated using case-insensitive matching.
 * @param {SourceEntry[]} sources - The sources to analyze.
 * @returns {boolean} True if case consolidation is possible.
 */
const canConsolidateCase = (sources: SourceEntry[]): boolean => {
    const seenLowerCase = new Map<string, string>();

    for (const source of sources) {
        const lowerCase = source.normalized.toLowerCase();

        // If we've seen this lowercase version before, check if it's a different case
        if (seenLowerCase.has(lowerCase)) {
            const original = seenLowerCase.get(lowerCase)!;
            // Only consolidate if the originals actually differ in case
            if (original !== source.normalized) {
                return true;
            }
        } else {
            seenLowerCase.set(lowerCase, source.normalized);
        }
    }

    return false;
};

/**
 * Detects if sources can be consolidated using apostrophe normalization.
 * @param {SourceEntry[]} sources - The sources to analyze.
 * @returns {boolean} True if apostrophe consolidation is possible.
 */
const canConsolidateApostrophes = (sources: SourceEntry[]): boolean => {
    const uniqueNormalized = new Set(sources.map((s) => s.normalized));
    return uniqueNormalized.size < sources.length;
};

/**
 * Detects if sources can use clip start pattern.
 * @param {SourceEntry[]} sources - The sources to analyze.
 * @returns {boolean} True if clip start pattern can be applied.
 */
const canUseClipStart = (sources: SourceEntry[]): boolean => {
    const withClipStart = sources.filter((s) => s.clipStartChars.length > 0);
    if (withClipStart.length === 0) {
        return false;
    }

    // Check if we have both versions (with and without start clips)
    const normalizedBases = new Set<string>();
    for (const source of sources) {
        const base = source.original.slice(source.clipStartChars.length);
        normalizedBases.add(base.toLowerCase());
    }

    return normalizedBases.size < sources.length;
};

/**
 * Detects if sources can use clip end pattern.
 * @param {SourceEntry[]} sources - The sources to analyze.
 * @returns {boolean} True if clip end pattern can be applied.
 */
const canUseClipEnd = (sources: SourceEntry[]): boolean => {
    const withClipEnd = sources.filter((s) => s.clipEndChars.length > 0);
    if (withClipEnd.length === 0) {
        return false;
    }

    // Check if we have both versions (with and without end clips)
    const normalizedBases = new Set<string>();
    for (const source of sources) {
        const base = source.original.slice(0, source.original.length - source.clipEndChars.length);
        normalizedBases.add(base.toLowerCase());
    }

    return normalizedBases.size < sources.length;
};

/**
 * Detects if sources can use prefix option.
 * @param {SourceEntry[]} sources - The sources to analyze.
 * @param {string} to - The target to value.
 * @returns {string | null} The detected prefix or null.
 */
const detectPrefix = (sources: SourceEntry[], to: string): string | null => {
    const withPrefix = sources.filter((s) => s.hasPrefix);
    if (withPrefix.length === 0) {
        return null;
    }

    // Check if all prefixes are the same
    const prefixes = new Set(withPrefix.map((s) => s.hasPrefix!));
    if (prefixes.size !== 1) {
        return null;
    }

    const prefix = [...prefixes][0];

    // Check if we have both versions (with and without prefix)
    const withPrefixCount = sources.filter((s) => s.hasPrefix === prefix).length;
    const withoutPrefixCount = sources.filter((s) => !s.hasPrefix).length;

    // Only optimize if we have at least one without prefix and one with prefix
    return withPrefixCount > 0 && withoutPrefixCount > 0 ? prefix : null;
};

/**
 * Optimizes a single rule group by consolidating sources and adding options.
 * @param {RuleGroup} group - The rule group to optimize.
 * @returns {{ optimizedRule: Rule; sourcesRemoved: number }} The optimized rule and count.
 */
const optimizeGroup = (group: RuleGroup): { optimizedRule: Rule; sourcesRemoved: number } => {
    let sources = [...group.sources];
    const options: RuleOptions = { ...group.options };
    let sourcesRemoved = 0;

    // STEP 0: Initial deduplication by exact match (handles multiple rules with same sources)
    // This prevents false positives in case/apostrophe detection
    const exactMatchMap = new Map<string, SourceEntry>();
    for (const source of sources) {
        if (!exactMatchMap.has(source.original)) {
            exactMatchMap.set(source.original, source);
        } else {
            sourcesRemoved++;
        }
    }
    sources = [...exactMatchMap.values()];

    // STEP 1: Deduplicate by normalized value (apostrophe consolidation)
    // This MUST happen before case consolidation to avoid false positives
    if (canConsolidateApostrophes(sources)) {
        const uniqueMap = new Map<string, SourceEntry>();
        for (const source of sources) {
            if (!uniqueMap.has(source.normalized)) {
                uniqueMap.set(source.normalized, source);
            } else {
                sourcesRemoved++;
            }
        }
        sources = [...uniqueMap.values()];
    }

    // STEP 2: Check for case consolidation
    // First, check if we should add the casing option (if not already set)
    if (!options.casing && canConsolidateCase(sources)) {
        options.casing = CaseSensitivity.Insensitive;
    }

    // Then, deduplicate case variants if casing is Insensitive (whether we just added it or it was already there)
    if (options.casing === CaseSensitivity.Insensitive) {
        const uniqueMap = new Map<string, SourceEntry>();
        for (const source of sources) {
            const key = source.normalized.toLowerCase();
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, source);
            } else {
                sourcesRemoved++;
            }
        }
        sources = [...uniqueMap.values()];
    }

    // STEP 3: Check for prefix (on deduplicated sources)
    const detectedPrefix = detectPrefix(sources, group.to);
    const activePrefix = detectedPrefix || options.prefix || null;
    if (activePrefix) {
        if (!options.prefix) {
            options.prefix = activePrefix;
        }
        const baseMap = new Map<string, SourceEntry>();
        for (const source of sources) {
            // Check if this source starts with the active prefix
            const sourceHasPrefix: boolean =
                source.hasPrefix === activePrefix || source.original.startsWith(activePrefix);
            const base: string = sourceHasPrefix ? source.original.slice(activePrefix.length) : source.original;
            const key: string = base.toLowerCase();
            if (!baseMap.has(key)) {
                baseMap.set(key, source);
            } else {
                // Prefer the version without prefix
                if (!sourceHasPrefix) {
                    const existing: SourceEntry = baseMap.get(key)!;
                    const existingHasPrefix: boolean =
                        existing.hasPrefix === activePrefix || existing.original.startsWith(activePrefix);
                    if (existingHasPrefix) {
                        baseMap.set(key, source);
                    }
                }
            }
            if (baseMap.get(key) !== source) {
                sourcesRemoved++;
            }
        }
        sources = [...baseMap.values()];

        // Adjust to value to remove prefix if it still has it
        const toValue = group.to.startsWith(activePrefix) ? group.to.slice(activePrefix.length) : group.to;
        return {
            optimizedRule: {
                from: sources.map((s) => {
                    const sourceHasPrefix = s.hasPrefix === activePrefix || s.original.startsWith(activePrefix);
                    return sourceHasPrefix ? s.original.slice(activePrefix.length) : s.original;
                }),
                options: Object.keys(options).length > 0 ? options : undefined,
                to: toValue,
            },
            sourcesRemoved,
        };
    }

    // STEP 4: Check for clip start pattern
    // First, check if we should add the option
    if (!options.clipStartPattern && canUseClipStart(sources)) {
        options.clipStartPattern = TriePattern.Apostrophes;
    }

    // Then deduplicate if the option is set
    if (options.clipStartPattern === TriePattern.Apostrophes) {
        const baseMap = new Map<string, SourceEntry>();
        for (const source of sources) {
            const base = source.original.slice(source.clipStartChars.length);
            const key = base.toLowerCase();
            if (!baseMap.has(key)) {
                baseMap.set(key, source);
            } else {
                // Prefer the version without clip chars
                if (source.clipStartChars.length === 0 && baseMap.get(key)!.clipStartChars.length > 0) {
                    baseMap.set(key, source);
                }
            }
            if (baseMap.get(key) !== source) {
                sourcesRemoved++;
            }
        }
        sources = [...baseMap.values()];
    }

    // STEP 5: Check for clip end pattern
    // First, check if we should add the option
    if (!options.clipEndPattern && canUseClipEnd(sources)) {
        options.clipEndPattern = TriePattern.Apostrophes;
    }

    // Then deduplicate if the option is set
    if (options.clipEndPattern === TriePattern.Apostrophes) {
        const baseMap = new Map<string, SourceEntry>();
        for (const source of sources) {
            const base = source.original.slice(0, source.original.length - source.clipEndChars.length);
            const key = base.toLowerCase();
            if (!baseMap.has(key)) {
                baseMap.set(key, source);
            } else {
                // Prefer the version without clip chars
                if (source.clipEndChars.length === 0 && baseMap.get(key)!.clipEndChars.length > 0) {
                    baseMap.set(key, source);
                }
            }
            if (baseMap.get(key) !== source) {
                sourcesRemoved++;
            }
        }
        sources = [...baseMap.values()];
    }

    return {
        optimizedRule: {
            from: sources.map((s) => s.original),
            options: Object.keys(options).length > 0 ? options : undefined,
            to: group.to,
        },
        sourcesRemoved,
    };
};

/**
 * Detects conflicts where the same from value has different to values.
 * @param {Rule[]} rules - The rules to check.
 * @param {BuildTrieOptions} [buildOptions] - Build options affecting normalization.
 * @returns {Array} Array of conflicts found.
 */
const detectConflicts = (
    rules: Rule[],
    buildOptions?: BuildTrieOptions,
): Array<{ from: string; conflictingTo: string[] }> => {
    const fromToTargets = new Map<string, Set<string>>();
    const normalizeApostrophes = Boolean(buildOptions?.normalizeApostrophes);

    for (const rule of rules) {
        for (const from of rule.from) {
            const normalized = normalizeSource(from, normalizeApostrophes);
            if (!fromToTargets.has(normalized)) {
                fromToTargets.set(normalized, new Set());
            }
            fromToTargets.get(normalized)!.add(rule.to);
        }
    }

    const conflicts: Array<{ from: string; conflictingTo: string[] }> = [];
    for (const [from, toValues] of fromToTargets) {
        if (toValues.size > 1) {
            conflicts.push({ conflictingTo: [...toValues], from });
        }
    }

    return conflicts;
};

/**
 * Detects match type conflicts and consolidates compatible ones.
 * @param {Rule[]} rules - The rules to check.
 * @param {BuildTrieOptions} [buildOptions] - Build options.
 * @returns {Object} Consolidated rules and conflicts found.
 */
const handleMatchTypeConflicts = (
    rules: Rule[],
    buildOptions?: BuildTrieOptions,
): {
    conflicts: Array<{ from: string; rules: Rule[] }>;
    consolidatedRules: Rule[];
    rulesRemoved: number;
} => {
    const normalizeApostrophes = Boolean(buildOptions?.normalizeApostrophes);

    // Per-source entry: links each individual source back to its originating rule
    type SourceEntry = { rule: Rule; source: string; matchType: MatchType };

    // Expand every rule into per-source entries
    const fromMap = new Map<string, SourceEntry[]>();
    for (const rule of rules) {
        const matchType = rule.options?.match || MatchType.Any;
        for (const source of rule.from) {
            const normalized = normalizeSource(source, normalizeApostrophes);
            if (!fromMap.has(normalized)) {
                fromMap.set(normalized, []);
            }
            fromMap.get(normalized)!.push({ matchType, rule, source });
        }
    }

    const conflicts: Array<{ from: string; rules: Rule[] }> = [];
    // Track which individual sources survive per rule
    const survivingSources = new Map<Rule, Set<string>>();
    // Track original source count per rule
    const originalSourceCount = new Map<Rule, number>();

    // Initialize: all sources survive by default
    for (const rule of rules) {
        survivingSources.set(rule, new Set(rule.from));
        originalSourceCount.set(rule, rule.from.length);
    }

    for (const [normalizedFrom, entries] of fromMap) {
        if (entries.length <= 1) {
            continue;
        }

        // Deduplicate entries from the same rule
        const uniqueRules = [...new Set(entries.map((e) => e.rule))];

        // Check if to values differ
        const uniqueTo = new Set(uniqueRules.map((r) => r.to));
        if (uniqueTo.size > 1) {
            // Different to values - this is a conflict
            conflicts.push({ from: normalizedFrom, rules: uniqueRules });
            continue;
        }

        // Same to value - check if we can consolidate match types
        const matchTypes = entries.map((e) => e.matchType);
        const hasAlone = matchTypes.includes(MatchType.Alone);
        const hasWhole = matchTypes.includes(MatchType.Whole);
        const hasAny = matchTypes.includes(MatchType.Any);

        // Only consolidate if we have multiple different match types for same from/to
        if ((hasAlone ? 1 : 0) + (hasWhole ? 1 : 0) + (hasAny ? 1 : 0) > 1) {
            // Consolidate to most permissive
            const mostPermissive = hasAny ? MatchType.Any : hasWhole ? MatchType.Whole : MatchType.Alone;

            // Find the entry with the most permissive match type to keep
            let entryToKeep: SourceEntry | null = null;
            for (const entry of entries) {
                if (entry.matchType === mostPermissive) {
                    entryToKeep = entry;
                    break;
                }
            }

            if (entryToKeep) {
                // Remove this source from all other rules' surviving sets
                for (const entry of entries) {
                    if (entry !== entryToKeep) {
                        survivingSources.get(entry.rule)?.delete(entry.source);
                    }
                }
            }
        }
    }

    // Reconstruct consolidated rules
    const consolidatedRules: Rule[] = [];
    let rulesRemoved = 0;

    for (const rule of rules) {
        const surviving = survivingSources.get(rule)!;
        if (surviving.size === 0) {
            // All sources were consolidated away — entire rule removed
            rulesRemoved++;
        } else if (surviving.size === originalSourceCount.get(rule)!) {
            // All sources survived — keep original rule as-is
            if (!consolidatedRules.includes(rule)) {
                consolidatedRules.push(rule);
            }
        } else {
            // Some sources were removed — create modified rule with surviving sources
            const modifiedRule: Rule = {
                ...rule,
                from: rule.from.filter((s) => surviving.has(s)),
            };
            consolidatedRules.push(modifiedRule);
        }
    }

    return { conflicts, consolidatedRules, rulesRemoved };
};

/**
 * Detects rules that would be overwritten in the trie.
 * @param {Rule[]} rules - The rules to check.
 * @param {BuildTrieOptions} [buildOptions] - Build options.
 * @returns {Array} Array of overwritten rule information.
 */
const detectOverwrittenRules = (
    rules: Rule[],
    buildOptions?: BuildTrieOptions,
): Array<{ from: string; kept: Rule; discarded: Rule[] }> => {
    const normalizeApostrophes = Boolean(buildOptions?.normalizeApostrophes);
    const fromToRules = new Map<string, Rule[]>();

    for (const rule of rules) {
        for (const from of rule.from) {
            const normalized = normalizeSource(from, normalizeApostrophes);
            if (!fromToRules.has(normalized)) {
                fromToRules.set(normalized, []);
            }
            fromToRules.get(normalized)!.push(rule);
        }
    }

    const overwritten: Array<{ from: string; kept: Rule; discarded: Rule[] }> = [];
    for (const [from, rulesForFrom] of fromToRules) {
        if (rulesForFrom.length > 1) {
            // Last rule wins in trie
            const kept = rulesForFrom[rulesForFrom.length - 1];
            const discarded = rulesForFrom.slice(0, -1);
            overwritten.push({ discarded, from, kept });
        }
    }

    return overwritten;
};

/**
 * Removes subset rules that are redundant.
 * @param {Rule[]} rules - The rules to check.
 * @returns {{ optimizedRules: Rule[]; rulesRemoved: number }} Result with subsets removed.
 */
const removeSubsets = (rules: Rule[]): { optimizedRules: Rule[]; rulesRemoved: number } => {
    const toRemove = new Set<Rule>();

    const precomputed = rules.map((r) => {
        const optObj = r.options || {};
        return {
            fromSet: new Set(r.from),
            optKey: JSON.stringify(optObj, Object.keys(optObj).sort()),
            rule: r,
        };
    });

    for (let i = 0; i < precomputed.length; i++) {
        for (let j = 0; j < precomputed.length; j++) {
            if (i === j || toRemove.has(precomputed[i].rule) || toRemove.has(precomputed[j].rule)) {
                continue;
            }

            const p1 = precomputed[i];
            const p2 = precomputed[j];

            // Check if they have the same target
            if (p1.rule.to !== p2.rule.to) {
                continue;
            }

            // Check if options match
            if (p1.optKey !== p2.optKey) {
                continue;
            }

            // Check if rule2 is a subset of rule1
            if (p2.fromSet.size < p1.fromSet.size) {
                const isSubset = [...p2.fromSet].every((source) => p1.fromSet.has(source));
                if (isSubset) {
                    toRemove.add(p2.rule);
                }
            }
        }
    }

    return {
        optimizedRules: rules.filter((r) => !toRemove.has(r)),
        rulesRemoved: toRemove.size,
    };
};

/**
 * Optimizes a set of rules by consolidating redundant variations and detecting conflicts.
 *
 * @param {Rule[]} rules - Array of rules to optimize.
 * @param {BuildTrieOptions} [buildOptions] - Optional build configuration affecting optimization.
 * @returns {OptimizeResult} The optimization result including optimized rules, savings, and warnings.
 *
 * @example
 * ```typescript
 * const rules = [
 *   { from: ['Source', 'source'], to: 'Target' }
 * ];
 *
 * const result = optimizeRules(rules);
 * // result.optimizedRules: [{ from: ['Source'], options: { casing: 'i' }, to: 'Target' }]
 * // result.savings.sourcesRemoved: 1
 * ```
 */
export const optimizeRules = (rules: Rule[], buildOptions?: BuildTrieOptions): OptimizeResult => {
    if (rules.length === 0) {
        return {
            optimizedRules: [],
            savings: { rulesRemoved: 0, sourcesRemoved: 0 },
            warnings: { conflicts: [], matchTypeConflicts: [], overwrittenRules: [] },
        };
    }

    // Detect conflicts on ORIGINAL rules before optimization
    // so that case-variant conflicts are properly found
    const conflicts = detectConflicts(rules, buildOptions);

    // First, handle match type conflicts and consolidation
    const matchTypeResult = handleMatchTypeConflicts(rules, buildOptions);
    const workingRules = matchTypeResult.consolidatedRules;
    let totalRulesRemoved = matchTypeResult.rulesRemoved;

    // Group rules by target and options
    const { groups, rulesMerged } = groupRulesByTarget(workingRules, buildOptions);
    totalRulesRemoved += rulesMerged;

    // Optimize each group
    let totalSourcesRemoved = 0;
    const optimizedRules: Rule[] = [];

    for (const group of groups.values()) {
        const { optimizedRule, sourcesRemoved } = optimizeGroup(group);
        optimizedRules.push(optimizedRule);
        totalSourcesRemoved += sourcesRemoved;
    }

    // Remove subset rules
    const subsetResult = removeSubsets(optimizedRules);
    totalRulesRemoved += subsetResult.rulesRemoved;

    // Detect overwritten rules on final optimized output
    const overwrittenRules = detectOverwrittenRules(subsetResult.optimizedRules, buildOptions);

    return {
        optimizedRules: subsetResult.optimizedRules,
        savings: {
            rulesRemoved: totalRulesRemoved,
            sourcesRemoved: totalSourcesRemoved,
        },
        warnings: {
            conflicts,
            matchTypeConflicts: matchTypeResult.conflicts,
            overwrittenRules,
        },
    };
};
