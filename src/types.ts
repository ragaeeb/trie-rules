interface ConfirmOptions {
    anyOf: string[];
}

export interface ConfirmCallback {
    (confirmOptions: ConfirmOptions): boolean;
}

export enum MatchType {
    Alone = 'alone',
    Whole = 'whole',
}

export interface RuleOptions {
    confirm?: ConfirmOptions;
    match?: MatchType;
    prefix?: string;
}

export interface Rule {
    options?: RuleOptions;
    sources: string[];
    target: string;
}

export interface TrieNode {
    [key: string]: boolean | RuleOptions | string | TrieNode | undefined;
    isEndOfWord?: boolean;
    options?: RuleOptions;
    target?: string;
}
