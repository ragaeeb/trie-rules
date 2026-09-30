import { CaseSensitivity, MatchType, type Rule, TriePattern } from 'trie-rules';

/** Small, deterministic examples for the interactive playground. */
export const examples: {
    name: string;
    description: string;
    text: string;
    rules: Rule[];
    normalizeApostrophes: boolean;
}[] = [
    {
        description:
            'Normalize a mock translation, like the legacy-v2-builder workflow. ' +
            'Whole-word rules leave larger words untouched; casing follows the matched letters.',
        name: 'Transliteration',
        normalizeApostrophes: false,
        rules: [
            {
                from: ['hadith', 'hadeeth'],
                options: { casing: CaseSensitivity.Insensitive, match: MatchType.Whole },
                to: 'ḥadīth',
            },
            { from: ['Ali'], options: { match: MatchType.Whole }, to: 'ʿAlī' },
            {
                from: ['Umar'],
                options: { clipStartPattern: TriePattern.Apostrophes, match: MatchType.Whole },
                to: 'ʿUmar',
            },
            { from: ['Allah'], options: { match: MatchType.Whole }, to: 'Allāh' },
        ],
        text: "Ali studied hadith with 'Umar. Hadith collections mention Allah; Allahabad stays unchanged.",
    },
    {
        description:
            'Compare any-context, whole-word, and whitespace-only matches. ' +
            'The longest valid source wins: “New York” takes priority over “New”.',
        name: 'Word boundaries',
        normalizeApostrophes: false,
        rules: [
            { from: ['cat'], to: 'kitten' },
            { from: ['dog'], options: { match: MatchType.Whole }, to: 'hound' },
            { from: ['x'], options: { match: MatchType.Alone }, to: 'EX' },
            { from: ['New'], options: { match: MatchType.Whole }, to: 'Old' },
            { from: ['New York'], options: { match: MatchType.Whole }, to: 'NYC' },
        ],
        text: 'cat concatenate cat. dog dogmatic dog. x fox x! New York is New.',
    },
    {
        description:
            'Treat straight and curly apostrophes alike. Add a prefix once, ' +
            'and clip surrounding apostrophes when a canonical spelling supplies its own.',
        name: 'Apostrophes & prefixes',
        normalizeApostrophes: true,
        rules: [
            { from: ["don't"], options: { match: MatchType.Whole }, to: 'do not' },
            {
                from: ['Bukhari'],
                options: { match: MatchType.Whole, prefix: 'al-' },
                to: 'Bukhārī',
            },
            {
                from: ['Umar'],
                options: { clipStartPattern: TriePattern.Apostrophes, match: MatchType.Whole },
                to: 'ʿUmar',
            },
            {
                from: ['shai'],
                options: { clipEndPattern: TriePattern.Apostrophes, match: MatchType.Whole },
                to: 'shayʾ',
            },
        ],
        text: "don't / don’t / don‘t. Bukhari and al-Bukhari. 'Umar and ’Umar. shai’.",
    },
    {
        description:
            'A confirmation callback can accept or skip a rule. ' +
            'Toggle approval below; rules without confirm options still apply.',
        name: 'Confirmation',
        normalizeApostrophes: false,
        rules: [
            { from: ['Dr.'], options: { confirm: { anyOf: ['expand-titles'] } }, to: 'Doctor' },
            { from: ['draft'], options: { match: MatchType.Whole }, to: 'manuscript' },
        ],
        text: 'Dr. Ali reviewed the draft. This is a draft.',
    },
    {
        description:
            'Inspect redundant sources and a deliberately conflicting rule. ' +
            'Optimization reports warnings; you decide which target is correct.',
        name: 'Duplicates & conflicts',
        normalizeApostrophes: false,
        rules: [
            { from: ['colour', 'colour'], options: { match: MatchType.Whole }, to: 'color' },
            { from: ['colour'], options: { match: MatchType.Whole }, to: 'color' },
            { from: ['teh'], options: { match: MatchType.Whole }, to: 'the' },
            { from: ['teh'], options: { match: MatchType.Whole }, to: 'ten' },
        ],
        text: 'colour color and teh draft.',
    },
];

function validateOptions(options: unknown, label: string): void {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error(`${label}: options must be an object.`);
    }
    const allowed: Record<string, readonly unknown[]> = {
        casing: Object.values(CaseSensitivity),
        clipEndPattern: [TriePattern.Apostrophes],
        clipStartPattern: [TriePattern.Apostrophes],
        match: Object.values(MatchType),
    };
    for (const [key, option] of Object.entries(options)) {
        if (Object.hasOwn(allowed, key) && allowed[key].includes(option)) {
            continue;
        }
        if (key === 'prefix' && typeof option === 'string') {
            continue;
        }
        if (
            key === 'confirm' &&
            option &&
            typeof option === 'object' &&
            'anyOf' in option &&
            Array.isArray(option.anyOf) &&
            option.anyOf.every((s: unknown) => typeof s === 'string')
        ) {
            continue;
        }
        throw new Error(`${label}: unsupported or invalid option “${key}”.`);
    }
}

/** Parse editor JSON, rejecting malformed rules before calling the library. */
export function parseRules(json: string): Rule[] {
    const value: unknown = JSON.parse(json);
    if (!Array.isArray(value)) {
        throw new Error('Rules must be a JSON array.');
    }
    for (const [index, rule] of value.entries()) {
        const label = `Rule ${index + 1}`;
        if (
            !rule ||
            typeof rule !== 'object' ||
            !Array.isArray(rule.from) ||
            !rule.from.length ||
            rule.from.some((s: unknown) => typeof s !== 'string' || !s.length) ||
            typeof rule.to !== 'string'
        ) {
            throw new Error(`${label}: use a non-empty “from” array of strings and a “to” string.`);
        }
        if (rule.options !== undefined) {
            validateOptions(rule.options, label);
        }
    }
    return value;
}
