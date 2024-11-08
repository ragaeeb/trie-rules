interface ConfirmOptions {
    anyOf: string[];
}

export interface ConfirmCallback {
    (confirmOptions: ConfirmOptions): boolean;
}

export enum MatchType {
    Alone = 'alone',
    Any = 'any',
    Whole = 'whole',
}

export enum CaseSensitivity {
    Insensitive = 'insensitive',
    Sensitive = 'sensitive',
}

export enum ClipStartPattern {
    Apostrophes = 'apostrophes',
}

export interface RuleOptions {
    casing?: CaseSensitivity;
    clipEndPattern?: ClipStartPattern | RegExp;
    clipStartPattern?: ClipStartPattern | RegExp;
    confirm?: ConfirmOptions;
    match?: MatchType;
    prefix?: string;
}

export interface Rule {
    from: string[];
    options?: RuleOptions;
    to: string;
}

export interface TrieNode {
    [key: string]: boolean | RuleOptions | string | TrieNode | undefined;
    isEndOfWord?: boolean;
    options?: RuleOptions;
    target?: string;
}

export type SearchAndReplaceOptions = {
    confirmCallback?: ConfirmCallback;
    log?({ node }: { node: TrieNode }): void;
};
