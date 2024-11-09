import { defineSuite } from 'esbench';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { buildTrie, containsSource, containsTarget, searchAndReplace } from '../src/index.ts';
import { Rule, TrieNode } from '../src/types';

export default defineSuite(async (scene) => {
    const rules = JSON.parse(await fs.readFile(path.join('testing', 'rules.json'), 'utf-8')) as Rule[];
    const text = await fs.readFile(path.format({ dir: 'testing', ext: '.txt', name: 'content' }), 'utf-8');
    const trie: TrieNode = buildTrie(rules);

    scene.bench('buildTrie', () => {
        buildTrie(rules);
    });

    scene.bench('containsSource', () => {
        containsSource(trie, `Qur'an`);
    });

    scene.bench('containsTarget', () => {
        containsTarget(trie, 'Qurʾān');
    });

    scene.bench('searchAndReplace', () => {
        searchAndReplace(trie, text);
    });
});
