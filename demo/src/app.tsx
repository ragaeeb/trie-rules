import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import {
    adjustCasing,
    buildTrie,
    containsSource,
    containsTarget,
    findFirstAlphaIndex,
    generateCaseVariants,
    isAlphabeticLetter,
    isLetter,
    isLowerCase,
    isUpperCase,
    isWordCharacterAt,
    optimizeRules,
    searchAndReplace,
} from 'trie-rules';
import pkg from '../package.json';
import { examples, parseRules } from './examples';
import './index.css';

const views = [
    { api: 'buildTrie · searchAndReplace', icon: '01', name: 'Replace text' },
    { api: 'containsSource · containsTarget', icon: '02', name: 'Look up a rule' },
    { api: 'optimizeRules', icon: '03', name: 'Optimize rules' },
    { api: 'Casing · letters · boundaries', icon: '04', name: 'Explore utilities' },
];
const json = (value: unknown): string => JSON.stringify(value, null, 2);

/** Interactive examples of the library's public functions. */
export function App(): JSX.Element {
    const [view, setView] = useState(0);
    const [exampleIndex, setExampleIndex] = useState(0);
    const [text, setText] = useState(examples[0].text);
    const [rulesText, setRulesText] = useState(json(examples[0].rules));
    const [normalize, setNormalize] = useState(examples[0].normalizeApostrophes);
    const [approve, setApprove] = useState(true);
    const [query, setQuery] = useState('hadith');
    const [ignoreCase, setIgnoreCase] = useState(false);
    const [filter, setFilter] = useState('');
    const [utilityText, setUtilityText] = useState("'Ali");
    const [targetText, setTargetText] = useState('ʿalī');
    const [characterIndex, setCharacterIndex] = useState(1);
    const [copyStatus, setCopyStatus] = useState('');
    const example = examples[exampleIndex];

    const compiled = useMemo(() => {
        try {
            const rules = parseRules(rulesText);
            return {
                error: '',
                rules,
                trie: buildTrie(rules, { normalizeApostrophes: normalize }),
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : String(error),
                rules: [],
                trie: null,
            };
        }
    }, [rulesText, normalize]);
    const result = useMemo(() => {
        const targets: string[] = [];
        const output = compiled.trie
            ? searchAndReplace(compiled.trie, text, {
                  confirmCallback: () => approve,
                  log: ({ node }) => targets.push(String(node.target)),
              })
            : '';
        return { output, targets };
    }, [compiled, text, approve]);
    const optimized = useMemo(
        () =>
            optimizeRules(compiled.rules, {
                normalizeApostrophes: normalize,
            }),
        [compiled.rules, normalize],
    );

    function loadExample(index: number): void {
        const next = examples[index];
        setExampleIndex(index);
        setRulesText(json(next.rules));
        setText(next.text);
        setNormalize(next.normalizeApostrophes);
        setApprove(true);
        setQuery(next.rules[0].from[0]);
        setFilter('');
        setCopyStatus('');
    }

    async function copyOutput(): Promise<void> {
        try {
            await navigator.clipboard.writeText(result.output);
            setCopyStatus('Copied');
        } catch {
            setCopyStatus('Copy unavailable — select the output to copy it.');
        }
    }

    const visibleRules = compiled.rules.filter((rule) =>
        [...rule.from, rule.to].some((s) => s.toLowerCase().includes(filter.toLowerCase())),
    );
    const char = utilityText.charAt(characterIndex);
    const helperResults = [
        [
            'generateCaseVariants',
            'Toggle the first alphabetic letter only.',
            generateCaseVariants(utilityText),
        ],
        [
            'findFirstAlphaIndex',
            'First alphabetic letter index; −1 if absent.',
            findFirstAlphaIndex(utilityText),
        ],
        [
            'adjustCasing',
            'Map matched letter casing onto the target, letter by letter.',
            adjustCasing(utilityText, targetText),
        ],
        ['isLetter', 'Does the selected character contain a Unicode letter?', isLetter(char)],
        [
            'isAlphabeticLetter',
            'A Unicode letter excluding apostrophe-like characters.',
            isAlphabeticLetter(char),
        ],
        ['isUpperCase', 'Does the selected character have uppercase casing?', isUpperCase(char)],
        ['isLowerCase', 'Does the selected character have lowercase casing?', isLowerCase(char)],
        [
            'isWordCharacterAt',
            'Letters belong to words; apostrophes depend on their neighbors.',
            isWordCharacterAt(utilityText, characterIndex),
        ],
    ];
    const buildCode =
        'const rules = ' +
        rulesText +
        ';\n' +
        'const trie = buildTrie(rules, { normalizeApostrophes: ' +
        normalize +
        ' });';
    const code = [
        "import { buildTrie, searchAndReplace } from 'trie-rules';\n\n" +
            buildCode +
            '\nconst output = searchAndReplace(trie, ' +
            json(text) +
            ', {\n    confirmCallback: () => ' +
            approve +
            ',\n});',
        "import { buildTrie, containsSource, containsTarget } from 'trie-rules';\n\n" +
            buildCode +
            '\ncontainsSource(trie, ' +
            json(query) +
            ');\ncontainsTarget(trie, ' +
            json(query) +
            ', { caseInsensitive: ' +
            ignoreCase +
            ' });',
        "import { optimizeRules } from 'trie-rules';\n\nconst result = optimizeRules(" +
            rulesText +
            ', { normalizeApostrophes: ' +
            normalize +
            ' });\n// Inspect result.warnings before using result.optimizedRules.',
    ][view];

    return (
        <div class="shell">
            <header class="masthead">
                <a class="brand" href="./">
                    <span aria-hidden="true">⌘</span> trie-rules
                </a>
                <span class="version">v{pkg.dependencies['trie-rules'].replace(/^[~^]/, '')}</span>
                <a
                    class="repo-link"
                    href="https://github.com/ragaeeb/trie-rules"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Documentation ↗
                </a>
            </header>
            <div class="workspace">
                <aside class="sidebar">
                    <div class="eyebrow">Interactive reference</div>
                    <h1>
                        A little rule.
                        <br />A better text.
                    </h1>
                    <p>See what each function does. Edit the inputs and watch the results.</p>
                    <nav aria-label="Function demos">
                        {views.map((item, index) => (
                            <button
                                type="button"
                                key={item.name}
                                aria-current={view === index ? 'page' : undefined}
                                class={view === index ? 'nav-item selected' : 'nav-item'}
                                onClick={() => setView(index)}
                            >
                                <span class="nav-number">{item.icon}</span>
                                <span>
                                    <strong>{item.name}</strong>
                                    <small>{item.api}</small>
                                </span>
                            </button>
                        ))}
                    </nav>
                    <div class="sidebar-note">
                        <span class="live-dot" /> Runs in your browser
                        <small>Bundled examples. No data upload.</small>
                    </div>
                </aside>
                <main>
                    <div class="page-heading">
                        <div>
                            <div class="eyebrow">Playground / {views[view].icon}</div>
                            <h2>{views[view].name}</h2>
                        </div>
                        <span class="live-label">Live results</span>
                    </div>
                    {view !== 3 && (
                        <>
                            <section class="example-bar" aria-label="Example presets">
                                <label for="example">Start with an example</label>
                                <select
                                    id="example"
                                    value={exampleIndex}
                                    onChange={(event) =>
                                        loadExample(Number(event.currentTarget.value))
                                    }
                                >
                                    {examples.map((item, index) => (
                                        <option key={item.name} value={index}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                <button type="button" onClick={() => loadExample(exampleIndex)}>
                                    Reset example ↺
                                </button>
                            </section>
                            <p class="example-description">{example.description}</p>
                            <div class="options-row">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={normalize}
                                        onChange={(e) => setNormalize(e.currentTarget.checked)}
                                    />
                                    Normalize apostrophes
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={approve}
                                        onChange={(e) => setApprove(e.currentTarget.checked)}
                                    />
                                    Approve confirmation rules
                                </label>
                                <span>
                                    {compiled.rules.length} rules ·{' '}
                                    {compiled.rules.reduce(
                                        (count, rule) => count + rule.from.length,
                                        0,
                                    )}{' '}
                                    sources
                                </span>
                            </div>
                            {compiled.error && (
                                <p class="error" role="alert">
                                    {compiled.error}
                                </p>
                            )}
                        </>
                    )}

                    {view === 0 && (
                        <>
                            <div class="editor-grid">
                                <section class="panel">
                                    <div class="panel-heading">
                                        <label for="input-text">Input text</label>
                                        <span>Editable</span>
                                    </div>
                                    <textarea
                                        id="input-text"
                                        value={text}
                                        spellcheck={false}
                                        onInput={(e) => {
                                            setText(e.currentTarget.value);
                                            setCopyStatus('');
                                        }}
                                    />
                                </section>
                                <section class="panel output-panel">
                                    <div class="panel-heading">
                                        <label for="output-text">Output text</label>
                                        <button
                                            type="button"
                                            disabled={!!compiled.error}
                                            onClick={copyOutput}
                                        >
                                            Copy output
                                        </button>
                                    </div>
                                    <textarea
                                        id="output-text"
                                        value={result.output}
                                        readOnly
                                        placeholder={
                                            compiled.error
                                                ? 'Fix the rules to see output.'
                                                : 'Output appears here.'
                                        }
                                    />
                                </section>
                            </div>
                            <output class="result-strip">
                                <strong>{result.targets.length} matches</strong>
                                <span>
                                    {result.output === text
                                        ? 'Text is unchanged.'
                                        : 'Output stays visible as you edit.'}
                                </span>
                                <span>{copyStatus}</span>
                            </output>
                            <details class="reference">
                                <summary>How it works · buildTrie → searchAndReplace</summary>
                                <p>
                                    <code>buildTrie(rules, options)</code> indexes source strings
                                    once.
                                    <code> searchAndReplace(trie, text, options)</code> scans text
                                    and uses the longest valid match. Its log callback counts actual
                                    matches above.
                                </p>
                                <p>
                                    Case-insensitive rules generate upper/lower initial variants,
                                    not every mixed-case spelling. <code>confirmCallback</code>{' '}
                                    decides whether a guarded rule applies.
                                </p>
                                <pre>{json(result.targets)}</pre>
                            </details>
                        </>
                    )}

                    {view === 1 && (
                        <section class="panel lookup-panel">
                            <label for="lookup">Source or target to look up</label>
                            <input
                                id="lookup"
                                value={query}
                                onInput={(e) => setQuery(e.currentTarget.value)}
                            />
                            <label class="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={ignoreCase}
                                    onChange={(e) => setIgnoreCase(e.currentTarget.checked)}
                                />{' '}
                                Ignore target casing
                            </label>
                            <div class="lookup-results">
                                <div>
                                    <code>containsSource(trie, text)</code>
                                    <strong>
                                        {compiled.trie
                                            ? String(containsSource(compiled.trie, query))
                                            : '—'}
                                    </strong>
                                    <p>
                                        Exact lookup of a stored source path. A prefix or a sentence
                                        is not a match; apostrophes are not normalized by this
                                        lookup.
                                    </p>
                                </div>
                                <div>
                                    <code>containsTarget(trie, text, options)</code>
                                    <strong>
                                        {compiled.trie
                                            ? String(
                                                  containsTarget(compiled.trie, query, {
                                                      caseInsensitive: ignoreCase,
                                                  }),
                                              )
                                            : '—'}
                                    </strong>
                                    <p>
                                        Find a stored replacement value. This checks the target, not
                                        text produced by casing, clipping, or prefix options.
                                    </p>
                                </div>
                            </div>
                            <div class="quick-queries">
                                <span>Try:</span>
                                {[example.rules[0].from[0], example.rules[0].to, 'not-a-rule'].map(
                                    (value) => (
                                        <button
                                            type="button"
                                            key={value}
                                            onClick={() => setQuery(value)}
                                        >
                                            {value}
                                        </button>
                                    ),
                                )}
                            </div>
                        </section>
                    )}

                    {view === 2 && (
                        <section class="panel optimize-panel">
                            <div class="panel-heading">
                                <strong>Optimization report</strong>
                                <span>
                                    {optimized.optimizedRules.length} rules after optimization
                                </span>
                            </div>
                            <p>
                                Consolidate redundant rules and sources, and flag conflicts for
                                review. Try “Duplicates &amp; conflicts” to see warnings.
                            </p>
                            <div class="savings">
                                <span>
                                    <strong>{optimized.savings.rulesRemoved}</strong> rules removed
                                </span>
                                <span>
                                    <strong>{optimized.savings.sourcesRemoved}</strong> sources
                                    removed
                                </span>
                            </div>
                            <details open>
                                <summary>Optimized rules</summary>
                                <pre>{json(optimized.optimizedRules)}</pre>
                            </details>
                            <details open>
                                <summary>Warnings · review before using</summary>
                                <pre>{json(optimized.warnings)}</pre>
                            </details>
                        </section>
                    )}

                    {view === 3 && (
                        <section class="panel utility-panel">
                            <p>
                                Explore the building blocks behind casing and word matching. Indices
                                are zero-based JavaScript string positions.
                            </p>
                            <div class="utility-inputs">
                                <label>
                                    Source text
                                    <input
                                        value={utilityText}
                                        onInput={(e) => setUtilityText(e.currentTarget.value)}
                                    />
                                </label>
                                <label>
                                    Target for adjustCasing
                                    <input
                                        value={targetText}
                                        onInput={(e) => setTargetText(e.currentTarget.value)}
                                    />
                                </label>
                                <label>
                                    Character index
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={characterIndex}
                                        onInput={(e) =>
                                            setCharacterIndex(
                                                Math.max(
                                                    0,
                                                    Math.trunc(Number(e.currentTarget.value)),
                                                ),
                                            )
                                        }
                                    />
                                </label>
                            </div>
                            <p class="character-note">
                                Selected character: <code>{json(char)}</code>
                                {char === '' && ' (outside the string)'}
                            </p>
                            <div class="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Function</th>
                                            <th>What it does</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {helperResults.map(([name, description, value]) => (
                                            <tr key={String(name)}>
                                                <td>
                                                    <code>{name}</code>
                                                </td>
                                                <td>{description}</td>
                                                <td>
                                                    <code>{json(value)}</code>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <details class="reference">
                                <summary>Enums &amp; patterns</summary>
                                <p>
                                    <code>MatchType</code>: Any (<code>""</code>), Whole (
                                    <code>"w"</code>), Alone (<code>"a"</code>, whitespace on both
                                    sides).
                                </p>
                                <p>
                                    <code>CaseSensitivity</code>: Sensitive (<code>""</code>),
                                    Insensitive (<code>"i"</code>).{' '}
                                    <code>TriePattern.Apostrophes</code> clips apostrophe-like
                                    characters. <code>LETTER_REGEX</code> tests Unicode letters;
                                    <code> APOSTROPHE_LIKE_REGEX</code> tests apostrophe-like
                                    characters.
                                </p>
                            </details>
                        </section>
                    )}

                    {view !== 3 && (
                        <>
                            <section class="panel rule-panel">
                                <div class="panel-heading">
                                    <h3>Rule book</h3>
                                    <input
                                        aria-label="Filter rules"
                                        placeholder="Find a source or target…"
                                        value={filter}
                                        onInput={(e) => setFilter(e.currentTarget.value)}
                                    />
                                </div>
                                <div class="table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sources →</th>
                                                <th>Target</th>
                                                <th>Options</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleRules.map((rule, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {rule.from.map((source, sourceIndex) => (
                                                            <code class="source" key={sourceIndex}>
                                                                {source}
                                                            </code>
                                                        ))}
                                                    </td>
                                                    <td>
                                                        <code>{rule.to || '""'}</code>
                                                    </td>
                                                    <td class="rule-options">
                                                        {rule.options
                                                            ? JSON.stringify(rule.options)
                                                            : 'Default'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!visibleRules.length && <p class="empty">No rules to show.</p>}
                                <details class="json-editor">
                                    <summary>Edit rules as JSON</summary>
                                    <p>
                                        <code>from</code> is an array; <code>to</code> is the
                                        replacement. Match: <code>""</code> any, <code>"w"</code>{' '}
                                        whole word, <code>"a"</code>
                                        whitespace-only. Casing: <code>"i"</code> initial variants.
                                        Clipping accepts <code>"apostrophes"</code> in this JSON
                                        editor.
                                    </p>
                                    <label for="rules-json" class="sr-only">
                                        Rules JSON
                                    </label>
                                    <textarea
                                        id="rules-json"
                                        value={rulesText}
                                        spellcheck={false}
                                        aria-invalid={!!compiled.error}
                                        onInput={(e) => setRulesText(e.currentTarget.value)}
                                    />
                                </details>
                            </section>
                            <details class="reference code-example">
                                <summary>Use this example in your code</summary>
                                <pre>{code}</pre>
                            </details>
                        </>
                    )}
                    <footer>
                        Small examples, real library calls. Change one thing and see what happens.
                    </footer>
                </main>
            </div>
        </div>
    );
}
