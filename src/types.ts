interface ConfirmOptions {
    anyOf: string[];
}

export interface ConfirmCallback {
    (confirmOptions: ConfirmOptions): boolean;
}

export interface RuleOptions {
    match?: 'whole' | 'alone';
    prefix?: string;
    confirm?: ConfirmOptions;
}

export interface Rule {
    sources: string[];
    target: string;
    options?: RuleOptions;
}

export interface TrieNode {
    [key: string]: TrieNode | boolean | string | RuleOptions | undefined;
    isEndOfWord?: boolean;
    target?: string;
    options?: RuleOptions;
}
