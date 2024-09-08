interface ConfirmOptions {
    anyOf: string[];
}

export interface ConfirmCallback {
    (confirmOptions: ConfirmOptions): boolean;
}

export interface RuleOptions {
    confirm?: ConfirmOptions;
    match?: 'whole' | 'alone';
    prefix?: string;
}

export interface Rule {
    options?: RuleOptions;
    sources: string[];
    target: string;
}

export interface TrieNode {
    [key: string]: TrieNode | boolean | string | RuleOptions | undefined;
    isEndOfWord?: boolean;
    options?: RuleOptions;
    target?: string;
}
