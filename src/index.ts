import { buildTrie, containsSource, containsTarget, searchAndReplace } from './trie.js';

export { buildTrie, containsSource, containsTarget, searchAndReplace };
export * from './constants.js';
export * from './types.js';
export {
    adjustCasing,
    findFirstAlphaIndex,
    generateCaseVariants,
    isAlphabeticLetter,
    isLetter,
    isLowerCase,
    isUpperCase,
    isWordCharacterAt,
} from './utils.js';
