interface ConfirmOptions {
    anyOf: string[];
}

export interface ConfirmCallback {
    (confirmOptions: ConfirmOptions): boolean;
}

export interface RuleOptions {
    confirm?: ConfirmOptions;
    match?: 'alone' | 'whole';
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
