import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildTrie, containsSource, containsTarget, searchAndReplace } from './trie';
import { MatchType, Rule, TrieNode } from './types';

describe('trie', () => {
    let rules: Rule[] = [];
    let trie: TrieNode;

    describe('containsSource', () => {
        beforeAll(() => {
            rules = [
                {
                    sources: ['Source1', 'Src1'],
                    target: 'Target1',
                },
                {
                    sources: ['Source2'],
                    target: 'Target2',
                },
            ];

            trie = buildTrie(rules);
        });

        it('should return true for words that exist in the trie', () => {
            expect(containsSource(trie, 'Source1')).toBe(true);
            expect(containsSource(trie, 'Src1')).toBe(true);
            expect(containsSource(trie, 'Source2')).toBe(true);
        });

        it('should return false for words that do not exist in the trie', () => {
            expect(containsSource(trie, 'NotInTrie')).toBe(false);
            expect(containsSource(trie, 'AnotherMissingWord')).toBe(false);
        });
    });

    describe('containsTarget', () => {
        beforeEach(() => {
            rules = [
                { options: { match: MatchType.Whole }, sources: ['ibn'], target: 'b.' },
                { options: { match: MatchType.Whole }, sources: ['ibn ‘Abbaas'], target: 'Ibn ʿAbbās' },
            ];

            trie = buildTrie(rules);
        });

        it('should validate the targets are found', () => {
            expect(containsTarget(trie, 'b.')).toBe(true);
            expect(containsTarget(trie, 'Ibn ʿAbbās')).toBe(true);
        });

        it('should not find a source', () => {
            expect(containsTarget(trie, 'ibn')).toBe(false);
        });

        it('should match case insensitive target', () => {
            expect(containsTarget(trie, 'ibn ʿAbbās', { caseInsensitive: true })).toBe(true);
        });
    });

    describe('searchAndReplace', () => {
        it('should replace all the abbreviations with the target', () => {
            rules = [
                {
                    sources: [
                        'RA',
                        'عنه هللا رضي',
                        "radi Allahu 'anhu",
                        'radiya Llahu ‘anhu',
                        'r.a',
                        'radiyallāhu ‘anhu',
                        'رضیﷲ عنه',
                    ],
                    target: '(may Allah be pleased with him)',
                },
                { sources: ['RAA', 'رضي الله عنها'], target: '(may Allah be pleased with her)' },
                {
                    options: { match: MatchType.Alone },
                    sources: ['RH'],
                    target: '(may Allah be pleased with him) reported that the Messenger ﷺ said:',
                },
                {
                    options: { match: MatchType.Whole },
                    sources: ['ASWJ'],
                    target: 'Ahl al-Sunnah waʿl-Jamāʿah',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                "The belief of ASWJ is that Aisha RAA, Zaynab رضي الله عنها, Abu Hurayrah RA, Abu Bakr r.a, Umar رضیﷲ عنه, Uthman radi Allahu 'anhu, and ARH Ali RH Actions are judged by their intentions.",
            );
            expect(actual).toEqual(
                'The belief of Ahl al-Sunnah waʿl-Jamāʿah is that Aisha (may Allah be pleased with her), Zaynab (may Allah be pleased with her), Abu Hurayrah (may Allah be pleased with him), Abu Bakr (may Allah be pleased with him), Umar (may Allah be pleased with him), Uthman (may Allah be pleased with him), and ARH Ali (may Allah be pleased with him) reported that the Messenger ﷺ said: Actions are judged by their intentions.',
            );
        });

        it('should replace the small terms within a sentence as well', () => {
            rules = [
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['ibn'],
                    target: 'b.',
                },
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['ibn ‘Abbaas'],
                    target: 'Ibn ʿAbbās',
                },
            ];

            trie = buildTrie(rules);

            const actual = searchAndReplace(trie, 'al-Muʿāfá ibn ʿImrān and ibn ‘Abbaas');
            expect(actual).toEqual('al-Muʿāfá b. ʿImrān and Ibn ʿAbbās');
        });

        it('should replace the Awf without affecting Awfá', () => {
            rules = [
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['Awfa'],
                    target: 'Awfá',
                },
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['Awf'],
                    target: 'ʿAwf',
                },
            ];

            trie = buildTrie(rules);

            const actual = searchAndReplace(trie, 'Awfa and Awfá went with Awf');
            expect(actual).toEqual('Awfá and Awfá went with ʿAwf');
        });

        it('should replace the sources with their targets', () => {
            rules = [
                { sources: ['--'], target: '-' },
                { sources: ['Abaan'], target: 'Abān' },
                { options: { match: MatchType.Whole }, sources: ['Abee', 'Abi', 'abi', 'abee'], target: 'Abī' },
                { options: { match: MatchType.Whole }, sources: ['Abu', 'Aboo', 'Abû', 'Abü'], target: 'Abū' },
                {
                    options: { match: MatchType.Whole },
                    sources: ['akhi'],
                    target: 'akhī',
                },
                {
                    options: { match: MatchType.Whole },
                    sources: ['Akhi'],
                    target: 'Akhī',
                },
                {
                    options: { match: MatchType.Whole },
                    sources: ['Ayoob', 'Ayuub', 'Ayyoob', 'Ayyoub', 'Ayyub', 'Ayoub', 'Ayub', 'Ayyüb'],
                    target: 'Ayyūb',
                },
            ];
            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                'Akhi, Abaan has been spoken about by Ayyub, and Ayuubi, Nakhi, Abu Ayub, Ibn Abi Shaybah, Ibn abi Asim, and Abd al--Rahman akhi.',
            );
            expect(actual).toEqual(
                'Akhī, Abān has been spoken about by Ayyūb, and Ayuubi, Nakhi, Abū Ayyūb, Ibn Abī Shaybah, Ibn Abī Asim, and Abd al-Rahman akhī.',
            );
        });

        it('should replace with all the rules properly', () => {
            rules = [
                { options: { match: MatchType.Whole }, sources: ['Abul'], target: 'Abū al-' },
                { options: { match: MatchType.Whole }, sources: ['Adaab'], target: 'Adāb' },
                { options: { match: MatchType.Whole }, sources: ['adaab'], target: 'adāb' },
                { sources: ['Ahl-ul-', 'Ahlul', 'Ahlus', 'ahl-ul-'], target: 'Ahl al-' },
                {
                    options: { match: MatchType.Whole },
                    sources: ['Ameen', 'ameen'],
                    target: 'Amīn',
                },
                {
                    options: { match: MatchType.Whole },
                    sources: ["A'oodhu", "a'oodhu"],
                    target: 'Aʿūḏu',
                },
                {
                    options: { match: MatchType.Whole },
                    sources: ['Adhaa', "Ad'haa", 'Adha'],
                    target: 'Aḍḥá',
                },
                { sources: ['...'], target: '…' },
            ];
            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                'Abul Hasan had no adaab with the Adhan on Eid al-Adha, so he is not from Ahlul-fiqh... Nameen, Ameen?',
            );
            expect(actual).toEqual(
                'Abū al- Hasan had no adāb with the Adhan on Eid al-Aḍḥá, so he is not from Ahl al--fiqh… Nameen, Amīn?',
            );
        });

        it('should only replace to Dhuhr when it is by itself', () => {
            rules = [
                {
                    options: { match: MatchType.Whole },
                    sources: ['Thuhr', 'Zuhr', 'thuhr', 'zuhr'],
                    target: 'Dhuhr',
                },
                {
                    sources: ['Zuhri', 'Zuhree', 'Dhuhri'],
                    target: 'Zuhrī',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                "al-Zuhri and Hisham prayed al-Zuhr, when they finished praying thuhr Hisham and Dhuhri headed back to Zuhri's house.",
            );
            expect(actual).toEqual(
                "al-Zuhrī and Hisham prayed al-Dhuhr, when they finished praying Dhuhr Hisham and Zuhrī headed back to Zuhrī's house.",
            );
        });

        it('should only replace to ʿalá when the word is by itself', () => {
            rules = [
                {
                    options: { match: MatchType.Alone },
                    sources: ['ala', 'Ala', 'alaa'],
                    target: 'ʿalá',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                'al-Alaa went ala park, then alaa went to the zoo Ala’as al-alaa Hilal ibn al-‘Ala narrated:',
            );
            expect(actual).toEqual(
                'al-Alaa went ʿalá park, then ʿalá went to the zoo Ala’as al-alaa Hilal ibn al-‘Ala narrated:',
            );
        });

        it('should only replace Asr when it is by itself', () => {
            rules = [
                {
                    options: { match: MatchType.Whole },
                    sources: ['Asr', 'asr'],
                    target: 'ʿAṣr',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(trie, 'During Asr, see Kashf al-Asrār 2/383');
            expect(actual).toEqual('During ʿAṣr, see Kashf al-Asrār 2/383');
        });

        it('should match the special character in the beginning of the string', () => {
            rules = [
                {
                    options: { match: MatchType.Whole },
                    sources: ['Ṣafwan'],
                    target: 'Ṣafwān',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(trie, 'Safwan went to the store with Ṣafwan and al-Ṣafwan.');
            expect(actual).toEqual('Safwan went to the store with Ṣafwān and al-Ṣafwān.');
        });

        it('should replace the salutations', () => {
            rules = [
                {
                    sources: [
                        ', peace and blessings be upon him,',
                        ', sallallaahu ‘alayhi wa sallam,',
                        "sallalaahu alayhi wa'sallam",
                        "sallalahu alayhi wa'sallam",
                        "sallallaahu 'alayhi wa sallam",
                        'sallAllaahu alayhi wa sallam',
                        'sallallaahu ‘alayhi wa sallam',
                        'SAWS',
                        'sws',
                        'صلى الله عليه وسلم',
                        'صلي الله عليه وسلم',
                        'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
                        '– SallAllāhu alayhi wa sallam –',
                        '–sallAllāhu alayhi wa Salām–',
                        "sallaa Allahu 'alaihi wa sallam",
                        'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ',
                        'صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ',
                        'صلَّى اللهُ عليهِ وسلَّمَ',
                        'صلّى اللَّهُ عليه وسلّم',
                        'p.b.u.h',
                        'SAAS',
                        'pbuh',
                        'عليه الصَّلاة والسَّلام',
                        'صلي الله عليه و سلم',
                        'صلى الله عليه و سلم',
                        'صلى الله عليه وآله وسلم',
                        'صَلَّى اللَّه عَلَيْهِ وَسَلَّمَ',
                        'عليه الصلاة والسلام',
                        "sallaa Allahu 'alaihi wa Aalihi wa sallam",
                        'Sallallāhu alayhi wa sallam',
                        'sallallaahu alahyi wa sallam',
                        'salla Llahu ‘alayhi wa sallam',
                        'sallallahualaihiwasallam',
                        'sallallahoalaihiwasalam',
                        'salla Allaahu ‘alaihe wasallam',
                        'PBUH',
                        'sallaa Allahu alayhi wa sallam',
                        'sal-Allaahu ‘alayhe wa sallam',
                        'sallAllaahu ‘alayhi wa sallam',
                        'SAllaahu Alihee Wasallam',
                        "sallAllaahu 'alayhi wa sallam",
                        'صلى الله عليه وعلى آله وسلم',
                        'صلى الله ليه وسلم',
                        'sallallaahu alaihi wa sallam',
                        "sallallaahu 'alayhe wa sallam",
                        'صلوات الله وسلامه عليه',
                        'صلى الله تعالى عليه وآله وسلم',
                        'sallallaahu aalaihi wa sallam',
                        'صلى وسلم عليه هللا',
                        'salla llahu alayhi wa sallam',
                        'sallallaahu alayhi was salaam',
                        'sall Allaahu alayhi was sallam',
                        "sallAllahu 'alayhi wassallam",
                        "sallallāhu 'alayhi wassallam",
                        'sallallahu alayhi wa sallam',
                        'sallahu alaihi wa sallam',
                        'sallahu alayhi wa sallam',
                        'sallahu alayhi wa salām',
                        "sallallaahu 'alaihi wa sallam",
                        'sallallahu alaihi wa sallam',
                        "sallallaahu 'alaihi was salām",
                        'sallallahu alaihi was salam',
                        "sallallahu 'alaihi wasallam",
                        'sallallahu alaihi wasallam',
                        "sallaa Allahu 'alaihi wa-sallam",
                        'salla Allahu alaihi wasallam',
                        'sallallaahu ‘alayhe wa sallam',
                        'sallallahu ‘alayhe wa sallam',
                        'sallal laahu alayhi wasallam',
                        'sallal lahu alayhi wasallam',
                        'peace and blessings of Allah be upon him',
                        'blessings and peace of Allah be upon him',
                        'peace and blessings of Allaah be upon him',
                        'sallallaahu ʿalayhi wa sallam',
                        '-ﷺ-',
                    ],
                    target: 'ﷺ',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                `The history of the Prophet –sallAllāhu alayhi wa Salām– is profound. From his early days, those who narrated his life events would often mention his name followed by phrases of blessings and respect, such as ", peace and blessings be upon him,". In many cultures, "sallalaahu alayhi wa'sallam" is widely used, while others prefer "sallalahu alayhi wa'sallam" or "sallallaahu 'alayhi wa sallam". The importance of sending blessings upon him is emphasized in many religious texts, where "sallAllaahu alayhi wa sallam" and "sallallaahu ‘alayhi wa sallam" are frequently found. Some shorten the blessing to "SAWS" or "sws", while others, particularly in Arabic texts, use "صلى الله عليه وسلم". Some variants include "صلي الله عليه وسلم" and "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ". The emphasis on these blessings, such as "Sallallāhu alayhi wa sallam" and "sallaa Allahu 'alaihi wa sallam", showcase the love and reverence Muslims have for their Prophet. Acronyms like "p.b.u.h", "SAAS", and "pbuh" have become popular in English texts, while "عليه الصَّلاة والسَّلام" and "صلي الله عليه و سلم" are common in Arabic literature. Some phrases, like "sallallahualaihiwasallam" and "sallallahoalaihiwasalam", have been adapted in various languages and regions. Whether it's "PBUH", "sallaa Allahu alayhi wa sallam", "sal-Allaahu ‘alayhe wa sallam", or "SAllaahu Alihee Wasallam", the intent remains the same – to send blessings upon the Prophet. In various cultures, "صلوات الله وسلامه عليه" and "صلى الله تعالى عليه وآله وسلم" are expressions of profound respect. From "sallallaahu alayhi was salaam" to "sallahu alaihi wa sallam", and from "sallallahu alaihi wasallam" to "peace and blessings of Allah be upon him", the common thread is the love and respect for the Prophet. Indeed, "blessings and peace of Allah be upon him" is a sentiment shared by many, and as one delves into history, they will encounter "sallallaahu ʿalayhi wa sallam" and "-ﷺ-" as enduring symbols of respect.`,
            );
            expect(actual).toEqual(
                `The history of the Prophet ﷺ is profound. From his early days, those who narrated his life events would often mention his name followed by phrases of blessings and respect, such as "ﷺ". In many cultures, "ﷺ" is widely used, while others prefer "ﷺ" or "ﷺ". The importance of sending blessings upon him is emphasized in many religious texts, where "ﷺ" and "ﷺ" are frequently found. Some shorten the blessing to "ﷺ" or "ﷺ", while others, particularly in Arabic texts, use "ﷺ". Some variants include "ﷺ" and "ﷺ". The emphasis on these blessings, such as "ﷺ" and "ﷺ", showcase the love and reverence Muslims have for their Prophet. Acronyms like "ﷺ", "ﷺ", and "ﷺ" have become popular in English texts, while "ﷺ" and "ﷺ" are common in Arabic literature. Some phrases, like "ﷺ" and "ﷺ", have been adapted in various languages and regions. Whether it's "ﷺ", "ﷺ", "ﷺ", or "ﷺ", the intent remains the same – to send blessings upon the Prophet. In various cultures, "ﷺ" and "ﷺ" are expressions of profound respect. From "ﷺ" to "ﷺ", and from "ﷺ" to "ﷺ", the common thread is the love and respect for the Prophet. Indeed, "ﷺ" is a sentiment shared by many, and as one delves into history, they will encounter "ﷺ" and "ﷺ" as enduring symbols of respect.`,
            );
        });

        it('should replace the quotations properly', () => {
            rules = [
                {
                    sources: ['❝'],
                    target: '“',
                },
                {
                    sources: ['❞'],
                    target: '”',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(trie, '❝This is a sample text❞');
            expect(actual).toEqual('“This is a sample text”');
        });

        it('should replace with the diacritical marks', () => {
            rules = [
                {
                    sources: ['t_'],
                    target: 'ṭ',
                },
                {
                    sources: ['T_'],
                    target: 'Ṭ',
                },
                {
                    sources: ['d_'],
                    target: 'ḍ',
                },
                {
                    sources: ['D_'],
                    target: 'Ḍ',
                },
                {
                    sources: ['d\\'],
                    target: 'ḏ',
                },
                {
                    sources: ['D\\'],
                    target: 'Ḏ',
                },
                {
                    sources: ['g_'],
                    target: 'ġ',
                },
                {
                    sources: ['G_'],
                    target: 'Ġ',
                },
                {
                    sources: ['h_'],
                    target: 'ḥ',
                },
                {
                    sources: ['H_'],
                    target: 'Ḥ',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(trie, 't_ T_ d_ D_ d\\ D\\ g_ G_ h_ H_');
            expect(actual).toEqual('ṭ Ṭ ḍ Ḍ ḏ Ḏ ġ Ġ ḥ Ḥ');
        });

        it('should replace Isha', () => {
            rules = [
                {
                    sources: ['Isha', 'Ishaa', "'Ishaa", "'Isha"],
                    target: 'ʿIshāʾ',
                },
            ];

            trie = buildTrie(rules);
            const actual = searchAndReplace(
                trie,
                `We are going to pray 'Isha later than usual since Ishaa ends at half the night, but 'Ishaa begins right after Maghrib.`,
            );
            expect(actual).toEqual(
                'We are going to pray ʿIshāʾ later than usual since ʿIshāʾ ends at half the night, but ʿIshāʾ begins right after Maghrib.',
            );
        });

        it('should replace fi, but not fit', () => {
            rules = [
                {
                    sources: ['fitra'],
                    target: 'fiṭra',
                },
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['fi'],
                    target: 'fī',
                },
            ];

            trie = buildTrie(rules);
            expect(searchAndReplace(trie, 'fi fit with the fee')).toEqual('fī fit with the fee');
        });

        it('should not replace Aslam', () => {
            rules = [
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['Aas', 'Aass'],
                    target: 'ʿĀṣ',
                },
            ];

            trie = buildTrie(rules);
            expect(searchAndReplace(trie, 'Zayd b. Aslam')).toEqual('Zayd b. Aslam');
        });

        describe('fixQuotes', () => {
            beforeEach(() => {
                rules = [
                    { sources: ['‛ʿ', '’ʿ', 'ʿʿ', '‘ʿ', "ʿ'", "'ʿ", 'ʿ’', '`', 'ˋ'], target: 'ʿ' },
                    { sources: ['Abbas'], target: 'ʿAbbās' },
                    { sources: ['ʾ’', 'ʾʾ', '’ʾ', "ʾ'", "'ʾ"], target: 'ʾ' },
                ];

                trie = buildTrie(rules);
            });

            it('Uthman with two single quotes', () => {
                expect(searchAndReplace(trie, 'ʿʿUthman')).toEqual('ʿUthman');
            });

            it('Abbas to ʿAbbās while not adding double ʿʿ', () => {
                expect(searchAndReplace(trie, 'Abbas')).toEqual('ʿAbbās');
            });

            it('2 single quotes', () => {
                expect(searchAndReplace(trie, "'ʿAlawī")).toEqual('ʿAlawī');
            });

            it('Two different kinds of ayn quotes', () => {
                expect(searchAndReplace(trie, '‘ʿAtā')).toEqual('ʿAtā');
                expect(searchAndReplace(trie, '‘ʿAbbās')).toEqual('ʿAbbās');
            });

            it('Hamza', () => {
                expect(searchAndReplace(trie, 'Atāʾ’')).toEqual('Atāʾ');
            });

            it('ʿAṭāʾʾ', () => {
                expect(searchAndReplace(trie, 'ʿAṭāʾʾ')).toEqual('ʿAṭāʾ');
            });

            it('Abd', () => {
                expect(searchAndReplace(trie, '’ʿAbd')).toEqual('ʿAbd');
            });

            it('Mawḍūʿ’', () => {
                expect(searchAndReplace(trie, 'Mawḍūʿ’')).toEqual('Mawḍūʿ');
            });

            it('ʿaqīdah', () => {
                expect(searchAndReplace(trie, '‛ʿaqīdah')).toEqual('ʿaqīdah');
            });
        });

        describe('singleToDoubleQuotes', () => {
            beforeEach(() => {
                rules = [
                    {
                        sources: ['‘‘'],
                        target: '“',
                    },
                    {
                        sources: ['’’'],
                        target: '”',
                    },
                ];

                trie = buildTrie(rules);
            });

            it('quotes', () => {
                expect(searchAndReplace(trie, 'The ‘‘quick brown’’ fox.')).toEqual('The “quick brown” fox.');
            });

            it('no-op', () => {
                expect(searchAndReplace(trie, 'this is')).toEqual('this is');
            });
        });

        describe('searchAndReplace with prefix option', () => {
            it('should add the prefix if not present', () => {
                rules = [
                    { options: { match: MatchType.Whole, prefix: 'al-' }, sources: ['Bukhari'], target: 'Bukhārī' },
                ];
                trie = buildTrie(rules);
                const actual = searchAndReplace(trie, 'I read Bukhari yesterday.');
                expect(actual).toEqual('I read al-Bukhārī yesterday.');
            });

            it('should not add the prefix if it is already present', () => {
                rules = [
                    { options: { match: MatchType.Whole, prefix: 'al-' }, sources: ['Bukhari'], target: 'Bukhārī' },
                ];
                trie = buildTrie(rules);
                const actual = searchAndReplace(trie, 'I read al-Bukhari yesterday.');
                expect(actual).toEqual('I read al-Bukhārī yesterday.');
            });

            it('should handle multiple rules and cases where prefix is not needed', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole, prefix: 'al-' },
                        sources: ['Bukhari', 'Bukharee'],
                        target: 'Bukhārī',
                    },
                    { options: { match: MatchType.Whole }, sources: ['Muslim'], target: 'Muslim' },
                ];
                trie = buildTrie(rules);
                const actual = searchAndReplace(trie, 'Bukharee and Muslim are both hadith books.');
                expect(actual).toEqual('al-Bukhārī and Muslim are both hadith books.');
            });

            it('should handle multiple variations', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole, prefix: 'al-' },
                        sources: ['Bukhari', 'Bukharee', 'Bukhaaree'],
                        target: 'Bukhārī',
                    },
                    {
                        options: { match: MatchType.Whole, prefix: 'al-' },
                        sources: ['Shawkani', 'Shawkaanee', 'Shawkaani', 'ash-Shawkani'],
                        target: 'Shawkānī',
                    },
                ];
                trie = buildTrie(rules);
                const actual = searchAndReplace(
                    trie,
                    'Bukhari went to the store with ash-Shawkani. Then Shawkaanee and al-Bukharee went home, except Shawkaani went to sleep and al-Shawkānī should be untouched.',
                );
                expect(actual).toEqual(
                    'al-Bukhārī went to the store with al-Shawkānī. Then al-Shawkānī and al-Bukhārī went home, except al-Shawkānī went to sleep and al-Shawkānī should be untouched.',
                );
            });
        });

        it('should handle ʿalá', () => {
            rules = [
                {
                    options: {
                        match: MatchType.Whole,
                    },
                    sources: ['Ala', 'ala', 'alaa'],
                    target: 'ʿalá',
                },
            ];

            trie = buildTrie(rules);

            expect(searchAndReplace(trie, `ḥaṣala`)).toEqual(`ḥaṣala`);
        });

        describe('apostrophes and possessive', () => {
            it('should handle apostrophes', () => {
                rules = [
                    {
                        options: {
                            match: MatchType.Whole,
                        },
                        sources: ['Musa', 'Mûsā', 'Moosaa', 'Moosa', 'Moses', 'Mūsā', 'Mūsa', 'Moussa'],
                        target: 'Mūsá',
                    },
                    {
                        options: {
                            match: MatchType.Whole,
                        },
                        sources: ['Mus‘ab', 'Musab', 'Mus’ab', "Mus'ab"],
                        target: 'Muṣʿab',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `Musa'ab is here`)).toEqual(`Musa'ab is here`);
            });

            it('should handle the apostrophe with the whole word', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: [
                            'Saaleh',
                            'Saalih',
                            'Salih',
                            'S\u0101lih',
                            'Saleh',
                            'Sw\u0101li\u1e25',
                            'Shalih',
                            'S\u0101leh',
                        ],
                        target: '\u1e62\u0101li\u1e25',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `It is Salih's book`)).toEqual(`It is Ṣāliḥ's book`);
            });

            it('should handle transliterated words where apostrophe s is part of the word', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ["Ma'as", 'Maas'],
                        target: 'Maʿās',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `He greeted me with Ma'as`)).toEqual(`He greeted me with Maʿās`);
                expect(searchAndReplace(trie, `I learned about Ma'as today`)).toEqual(`I learned about Maʿās today`);
            });

            it('should correctly handle possessive apostrophe after transliterated word', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ['Ibrahim', 'Ebrahim'],
                        target: 'Ibrāhīm',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `Ibrahim's book is new`)).toEqual(`Ibrāhīm's book is new`);
                expect(searchAndReplace(trie, `Ebrahim's car`)).toEqual(`Ibrāhīm's car`);
            });

            it('should handle words ending with apostrophe followed by letters', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ["Sha'ban", 'Shaban'],
                        target: 'Shaʿbān',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `The month of Sha'ban is important`)).toEqual(
                    `The month of Shaʿbān is important`,
                );
                expect(searchAndReplace(trie, `He was born in Shaban`)).toEqual(`He was born in Shaʿbān`);
            });

            it('should handle words with multiple apostrophes', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ["Ka'ba", 'Kaaba'],
                        target: 'Kaʿbah',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `They visited the Ka'ba's site`)).toEqual(
                    `They visited the Kaʿbah's site`,
                );
                expect(searchAndReplace(trie, `The rituals of Kaaba are significant`)).toEqual(
                    `The rituals of Kaʿbah are significant`,
                );
            });

            it('should not replace partial matches within larger words', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ['Ali'],
                        target: 'ʿAlī',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `The coalition was formed`)).toEqual(`The coalition was formed`);
                expect(searchAndReplace(trie, `Alight the torch`)).toEqual(`Alight the torch`);
            });

            it('should handle words where apostrophe s is part of the transliterated word', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ['Nas'],
                        target: 'Nass',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `The term Nas's meaning is clear`)).toEqual(
                    `The term Nass's meaning is clear`,
                );
                expect(searchAndReplace(trie, `Understanding Nas is important`)).toEqual(
                    `Understanding Nass is important`,
                );
                expect(searchAndReplace(trie, `Nas's`)).toEqual(`Nass's`);
                expect(searchAndReplace(trie, `Nas's book`)).toEqual(`Nass's book`);
            });

            it('should correctly handle possessive apostrophe after words ending with s', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ['Moses'],
                        target: 'Mūsá',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `Moses's staff was powerful`)).toEqual(`Mūsá's staff was powerful`);
                expect(searchAndReplace(trie, `The teachings of Moses`)).toEqual(`The teachings of Mūsá`);
            });

            it('should not replace within contractions', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ['Amr'],
                        target: 'ʿAmr',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `I'm ready to go`)).toEqual(`I'm ready to go`);
                expect(searchAndReplace(trie, `Amr's decision`)).toEqual(`ʿAmr's decision`);
            });

            it('should handle words with apostrophes and hyphens', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ["al-Qur'an", 'al-Quran'],
                        target: 'al-Qurʾān',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `The recitation of al-Qur'an is important`)).toEqual(
                    `The recitation of al-Qurʾān is important`,
                );
                expect(searchAndReplace(trie, `Studying al-Quran's verses`)).toEqual(`Studying al-Qurʾān's verses`);
            });

            it('should handle words starting with an apostrophe', () => {
                rules = [
                    {
                        options: { match: MatchType.Whole },
                        sources: ["'Umar", 'Umar'],
                        target: 'ʿUmar',
                    },
                ];

                trie = buildTrie(rules);

                expect(searchAndReplace(trie, `'Umar's wisdom`)).toEqual(`ʿUmar's wisdom`);
                expect(searchAndReplace(trie, `I spoke to Umar`)).toEqual(`I spoke to ʿUmar`);
            });
        });

        describe('confirm', () => {
            beforeEach(() => {
                rules = [
                    {
                        options: { confirm: { anyOf: ['مالك', 'مَالِكٍ', 'مَالِكٌ'] }, match: MatchType.Whole },
                        sources: ['Maalik', 'Malik'],
                        target: 'Mālik',
                    },
                ];
            });

            it('should trigger a confirmation', () => {
                const confirmCallback = vi.fn(() => true);
                trie = buildTrie(rules);

                searchAndReplace(trie, 'Maalik went home.', { confirmCallback });
                expect(confirmCallback).toHaveBeenCalledTimes(1);
                expect(confirmCallback).toHaveBeenCalledWith({ anyOf: ['مالك', 'مَالِكٍ', 'مَالِكٌ'] });
            });

            it('should not trigger a confirmation if the rule does not include it', () => {
                const confirmCallback = vi.fn(() => true);

                rules[0].options = { match: MatchType.Whole };
                trie = buildTrie(rules);

                searchAndReplace(trie, 'Maalik went home.', { confirmCallback });
                expect(confirmCallback).not.toHaveBeenCalled();
            });

            it('should still make the replacement if the callback is not passed in', () => {
                const confirmCallback = vi.fn(() => true);
                trie = buildTrie(rules);

                const actual = searchAndReplace(trie, 'Maalik went home.');
                expect(confirmCallback).not.toHaveBeenCalled();
                expect(actual).toEqual('Mālik went home.');
            });

            it('should replace if the callback resolves to true', () => {
                const text = 'أَخْبَرَنَا مَالِكٌ';
                trie = buildTrie(rules);

                const actual = searchAndReplace(trie, 'Maalik went home.', {
                    confirmCallback: (confirmOptions) => {
                        return confirmOptions.anyOf.some((word) => text.includes(word));
                    },
                });
                expect(actual).toEqual('Mālik went home.');
            });

            it('should not replace if the callback resolves to false', () => {
                const text = 'أَخْبَرَنَا رَجُلٌ';
                trie = buildTrie(rules);

                const actual = searchAndReplace(trie, 'Maalik went home.', {
                    confirmCallback: (confirmOptions) => {
                        return confirmOptions.anyOf.some((word) => text.includes(word));
                    },
                });
                expect(actual).toEqual('Maalik went home.');
            });
        });
    });
});
