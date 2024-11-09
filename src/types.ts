/**
 * Options for confirmation callbacks.
 * Specifies conditions under which a rule should be confirmed.
 */
interface ConfirmOptions {
    anyOf: string[];
}

/**
 * A callback function used to determine if a rule should be considered based on confirmation options.
 *
 * @param confirmOptions - The options specifying the conditions for confirmation.
 * @returns A boolean indicating whether the rule is considered (true) or not (false).
 */
export interface ConfirmCallback {
    (confirmOptions: ConfirmOptions): boolean;
}

/**
 * Enumerates the types of matches that can be performed.
 */
export enum MatchType {
    Alone = 'alone', // The rule should match the word when it appears alone, surrounded by whitespace.
    Any = 'any', // The rule should match the word in any context, regardless of surrounding characters.
    Whole = 'whole', // The rule should match the word as a whole, ensuring it is not part of a larger word.
}

/**
 * Enumerates the case sensitivity options for matching and replacement.
 */
export enum CaseSensitivity {
    Insensitive = 'insensitive', // The matching is case-insensitive, and replacement should take into account the case of the initial of the "from". If the "from" starts with a capital (ignoring all symbols), then so will the replacement.
    Sensitive = 'sensitive', // The matching is case-sensitive, so the replacement's first initial will not reflect the initial casing of the first letter of the "from"
}

/**
 * Enumerates predefined patterns for clipping and preformatting during search and replace operations.
 */
export enum TriePattern {
    Apostrophes = 'apostrophes', // Represents apostrophe-like characters used in word boundaries or contractions
}

/**
 * Options that define how a rule behaves during search and replace operations.
 */
export interface RuleOptions {
    /**
     * Specifies how casing should be handled during replacement.
     * Defaults to case-sensitive if not provided.
     */
    casing?: CaseSensitivity;

    /**
     * A regular expression or predefined pattern to determine characters to clip at the end of a match.
     * Useful for removing trailing punctuation or symbols.
     */
    clipEndPattern?: RegExp | TriePattern;

    /**
     * A regular expression or predefined pattern to determine characters to clip at the start of a match.
     * Useful for removing leading punctuation or symbols.
     */
    clipStartPattern?: RegExp | TriePattern;

    /**
     * Options that determine whether the rule should be confirmed before being applied.
     */
    confirm?: ConfirmOptions;

    /**
     * Specifies the type of match required for the rule to be applied.
     * Determines the context in which the rule should match words.
     */
    match?: MatchType;

    /**
     * A prefix string to be added before the replacement text.
     * Useful for maintaining consistent formatting or adding necessary context.
     */
    prefix?: string;
}

/**
 * Represents a single search and replace rule.
 * Defines the source words to search for and the target replacement.
 */
export interface Rule {
    /**
     * An array of strings representing the words or patterns to search for.
     * Each string in the array is treated as an individual search target.
     */
    from: string[];

    /**
     * Options that modify the behavior of the rule, such as casing and clipping.
     */
    options?: RuleOptions;

    /**
     * The target string to replace the matched source words with.
     * Can include additional formatting or contextual information.
     */
    to: string;
}

/**
 * Represents a node within a trie data structure used for efficient search and replace operations.
 */
export interface TrieNode {
    /**
     * An index signature allowing dynamic properties.
     * Each key represents a character, and the value can be:
     * - A boolean indicating if it's the end of a word.
     * - RuleOptions modifying the rule's behavior.
     * - A string representing the target replacement.
     * - Another TrieNode for nested characters.
     * - Undefined if the character path does not exist.
     */
    [key: string]: boolean | RuleOptions | string | TrieNode | undefined;

    /**
     * Indicates whether the current node marks the end of a complete word.
     * Useful for determining when a match is found.
     */
    isEndOfWord?: boolean;

    /**
     * Options associated with the rule at this node.
     * Can modify behavior such as casing, clipping, and matching types.
     */
    options?: RuleOptions;

    /**
     * The target replacement string for the rule at this node.
     * Defines what the matched word should be replaced with.
     */
    target?: string;
}

/**
 * Options for configuring search and replace operations.
 */
export type SearchAndReplaceOptions = {
    /**
     * A callback function that determines whether a rule should be considered based on confirmation options.
     * Allows for dynamic decision-making during the replacement process.
     */
    confirmCallback?: ConfirmCallback;

    /**
     * A logging function that receives information about the current node being processed.
     * Useful for debugging or tracking the replacement process.
     *
     * @param params - An object containing the current TrieNode.
     */
    log?({ node }: { node: TrieNode }): void;

    /**
     * An array of predefined patterns to preformat the input text before performing replacements.
     * Useful for handling specific character patterns like apostrophes.
     */
    preformatters?: TriePattern[];
};
