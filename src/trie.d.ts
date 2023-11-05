/**
 * Represents options for matching rules in the trie.
 */
export interface RuleOption {
  /** The matching strategy to be used ('whole' or 'alone'). */
  match?: 'whole' | 'alone';
  
  /** An optional prefix to prepend to the target when a source is matched. */
  prefix?: string;
}

/**
 * Defines a rule for how a source string should be replaced with a target string.
 */
export interface Rule {
  /** The source strings to search for. */
  sources: string[];

  /** The target string to replace found sources. */
  target: string;

  /** Additional options for the matching rule. */
  options?: RuleOption;
}

/**
 * Represents a node in the trie structure.
 */
export type TrieNode = Record<string, any> & {
  /** Indicates whether this node marks the end of a word. */
  isEndOfWord?: boolean;

  /** The replacement target for the source word. */
  target?: string;

  /** Additional options for how the match should be performed. */
  options?: RuleOption;
};

/**
 * Builds a trie data structure from an array of rules.
 * @param rules - The replacement rules to build into the trie.
 * @returns The root node of the constructed trie.
 */
export function buildTrie(rules: Rule[]): TrieNode;

/**
 * Searches and replaces source strings in the text using the trie.
 * @param trie - The trie structure containing the replacement rules.
 * @param text - The text in which to search and replace strings.
 * @returns The text after performing replacements.
 */
export function searchAndReplace(trie: TrieNode, text: string): string;

/**
 * Checks if the trie contains a specific target string.
 * @param trie - The trie structure to check.
 * @param target - The target string to search for.
 * @returns `true` if the target is found, `false` otherwise.
 */
export function containsTarget(trie: TrieNode, target: string): boolean;

/**
 * Determines if a source string is present in the trie.
 * @param trie - The trie structure to check.
 * @param source - The source string to search for.
 * @returns `true` if the source is found, `false` otherwise.
 */
export function containsSource(trie: TrieNode, source: string): boolean;
