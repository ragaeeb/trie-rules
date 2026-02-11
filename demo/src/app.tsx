import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { buildTrie, type Rule, searchAndReplace, type TrieNode } from 'trie-rules';
import pkg from '../package.json';
import './index.css';

const trieRulesVersion = pkg.dependencies['trie-rules'].replace(/^\^|^~/, '');
const PACKAGE_LABEL = `trie-rules v${trieRulesVersion}`;

const RULES_URL =
    'https://gist.githubusercontent.com/ragaeeb/7fcf831a477a6cd021f07d4e42aa35d2/raw/77c0f65a7b7378e9a1b1923b320e5e1db4cac91b/trie.json';

const SAMPLE_COUNT = 18;

type Status = 'loading' | 'ready' | 'error';

function pickRandomWords(rules: Rule[], count: number): string {
    const allFroms: string[] = [];
    for (const rule of rules) {
        const sources = Array.isArray(rule.from) ? rule.from : [rule.from];
        for (const s of sources) {
            if (s.length > 2 && s.length < 30 && /^[\p{L}\p{M}\s'-]+$/u.test(s)) {
                allFroms.push(s);
            }
        }
    }

    const picked: string[] = [];
    const used = new Set<number>();
    const limit = Math.min(count, allFroms.length);

    while (picked.length < limit) {
        const idx = Math.floor(Math.random() * allFroms.length);
        if (!used.has(idx)) {
            used.add(idx);
            picked.push(allFroms[idx]);
        }
    }

    return picked.join(' ');
}

export function App() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [trie, setTrie] = useState<TrieNode | null>(null);
    const [status, setStatus] = useState<Status>('loading');
    const [originalText, setOriginalText] = useState('');
    const [displayText, setDisplayText] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [replacements, setReplacements] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch rules and build trie
    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                const res = await fetch(RULES_URL);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const data: Rule[] = await res.json();

                if (cancelled) {
                    return;
                }

                const trieNode = buildTrie(data);
                setRules(data);
                setTrie(trieNode);

                const text = pickRandomWords(data, SAMPLE_COUNT);
                setOriginalText(text);
                setDisplayText(text);
                setWordCount(text.split(/\s+/).filter(Boolean).length);
                setStatus('ready');
            } catch {
                if (!cancelled) {
                    setStatus('error');
                }
            }
        }

        init();
        return () => {
            cancelled = true;
        };
    }, []);

    const applyFormatting = useCallback(() => {
        if (!trie) {
            return;
        }
        const result = searchAndReplace(trie, originalText);
        setDisplayText(result);

        // Count replacements (simple diff by comparing words)
        const origWords = originalText.split(/\s+/);
        const resWords = result.split(/\s+/);
        let diffs = 0;
        for (let i = 0; i < Math.max(origWords.length, resWords.length); i++) {
            if (origWords[i] !== resWords[i]) {
                diffs++;
            }
        }
        setReplacements(diffs);
    }, [trie, originalText]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        applyFormatting();
    }, [applyFormatting]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        setDisplayText(originalText);
        setReplacements(0);
    }, [originalText]);

    const handleRandomize = useCallback(() => {
        if (rules.length === 0) {
            return;
        }
        const text = pickRandomWords(rules, SAMPLE_COUNT);
        setOriginalText(text);
        setWordCount(text.split(/\s+/).filter(Boolean).length);

        if (isFocused && trie) {
            const result = searchAndReplace(trie, text);
            setDisplayText(result);
            const origWords = text.split(/\s+/);
            const resWords = result.split(/\s+/);
            let diffs = 0;
            for (let i = 0; i < Math.max(origWords.length, resWords.length); i++) {
                if (origWords[i] !== resWords[i]) {
                    diffs++;
                }
            }
            setReplacements(diffs);
        } else {
            setDisplayText(text);
            setReplacements(0);
        }
    }, [rules, isFocused, trie]);

    const handleRetry = useCallback(() => {
        setStatus('loading');
        // Re-trigger fetch
        window.location.reload();
    }, []);

    return (
        <>
            <header class="header">
                <div class="header-badge">◆ {PACKAGE_LABEL}</div>
                <h1>Text Transliteration Demo</h1>
                <p>
                    Click into the text area to see trie-based search &amp; replace transform transliteration variants
                    into their canonical forms.
                </p>
            </header>

            <main class="demo-card">
                <div class="card-header">
                    <div class="card-header-left">
                        <span
                            class={`status-dot${status !== 'ready' ? ' loading' : ''}`}
                            style={
                                status !== 'ready'
                                    ? { background: 'var(--orange)', boxShadow: '0 0 8px var(--orange)' }
                                    : {}
                            }
                        />
                        <span class="card-header-label">
                            {status === 'loading'
                                ? 'Loading…'
                                : status === 'error'
                                  ? 'Error'
                                  : isFocused
                                    ? 'Formatted'
                                    : 'Original'}
                        </span>
                    </div>
                    {status === 'ready' && (
                        <span class="rules-count">{rules.length.toLocaleString()} rules loaded</span>
                    )}
                </div>

                {status === 'loading' && (
                    <div class="loading-state">
                        <div class="loading-spinner" />
                        <p>Fetching rules and building trie…</p>
                    </div>
                )}

                {status === 'error' && (
                    <div class="error-state">
                        <span class="error-icon">⚠</span>
                        <p>Failed to load the rule set. Check your connection and try again.</p>
                        <button type="button" class="btn btn-primary" onClick={handleRetry}>
                            <span class="btn-icon">↻</span> Retry
                        </button>
                    </div>
                )}

                {status === 'ready' && (
                    <>
                        <div class="textarea-wrap">
                            <textarea
                                id="demo-textarea"
                                ref={textareaRef}
                                value={displayText}
                                readOnly
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                placeholder="Random transliteration samples will appear here…"
                            />
                            <div class={`textarea-hint${isFocused ? ' active' : ''}`}>
                                <span class="hint-icon">{isFocused ? '✦' : '◇'}</span>
                                {isFocused
                                    ? 'Showing formatted output — click outside to see original'
                                    : 'Click the text area to apply formatting'}
                            </div>
                        </div>

                        <div class="stats-strip">
                            <div class="stat">
                                Words: <span class="stat-value">{wordCount}</span>
                            </div>
                            <div class="stat">
                                Replacements: <span class="stat-value">{replacements}</span>
                            </div>
                            <div class="stat">
                                Rules: <span class="stat-value">{rules.length.toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="card-actions">
                            <button type="button" id="randomize-btn" class="btn btn-primary" onClick={handleRandomize}>
                                <span class="btn-icon">⟳</span> Randomize
                            </button>
                            <a class="btn" href="https://github.com/ragaeeb/trie-rules" target="_blank" rel="noopener">
                                <span class="btn-icon">↗</span> GitHub
                            </a>
                        </div>
                    </>
                )}
            </main>

            <footer class="footer">
                <a href="https://github.com/ragaeeb/trie-rules" target="_blank" rel="noopener">
                    trie-rules — fast search &amp; replace with tries
                </a>
            </footer>
        </>
    );
}
