/// <reference types="bun" />
import { expect, test } from 'bun:test';
import { buildTrie, optimizeRules, searchAndReplace } from 'trie-rules';
import { examples, parseRules } from './examples';

test('bundled examples demonstrate their advertised replacement behavior', () => {
    const expected = [
        'ʿAlī studied ḥadīth with ʿUmar. Ḥadīth collections mention Allāh; Allahabad stays unchanged.',
        'kitten conkittenenate kitten. hound dogmatic hound. EX fox x! NYC is Old.',
        'do not / do not / do not. al-Bukhārī and al-Bukhārī. ʿUmar and ʿUmar. shayʾ.',
        'Doctor Ali reviewed the manuscript. This is a manuscript.',
        'color color and ten draft.',
    ];
    examples.forEach((example, index) => {
        const rules = parseRules(JSON.stringify(example.rules));
        const trie = buildTrie(rules, { normalizeApostrophes: example.normalizeApostrophes });
        expect(searchAndReplace(trie, example.text)).toBe(expected[index]);
    });
    const confirmation = examples[3];
    expect(
        searchAndReplace(buildTrie(confirmation.rules), confirmation.text, {
            confirmCallback: () => false,
        }),
    ).toBe('Dr. Ali reviewed the manuscript. This is a manuscript.');
    const report = optimizeRules(examples[4].rules);
    expect(report.savings.rulesRemoved).toBeGreaterThan(0);
    expect(report.warnings.conflicts).toContainEqual({
        conflictingTo: ['the', 'ten'],
        from: 'teh',
    });
});

test('JSON editor rejects malformed rules and options without rejecting empty replacement text', () => {
    const invalid = [
        '{',
        '{}',
        '[null]',
        '[{"from":"word","to":"text"}]',
        '[{"from":[],"to":"text"}]',
        '[{"from":[""],"to":"text"}]',
        '[{"from":[2],"to":"text"}]',
        '[{"from":["word"],"to":2}]',
        '[{"from":["word"],"to":"text","options":null}]',
        '[{"from":["word"],"to":"text","options":{"match":"invalid"}}]',
        '[{"from":["word"],"to":"text","options":{"clipStartPattern":{}}}]',
        '[{"from":["word"],"to":"text","options":{"confirm":{"anyOf":[1]}}}]',
        '[{"from":["word"],"to":"text","options":{"prefix":1}}]',
        '[{"from":["word"],"to":"text","options":{"unknown":true}}]',
        '[{"from":["word"],"to":"text","options":{"toString":"oops"}}]',
    ];
    for (const value of invalid) {
        expect(() => parseRules(value)).toThrow();
    }
    const removal = parseRules('[{"from":["remove"],"to":""}]');
    expect(searchAndReplace(buildTrie(removal), 'remove this')).toBe(' this');
    expect(parseRules('[]')).toEqual([]);
});
