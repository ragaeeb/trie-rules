import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vitest from 'eslint-plugin-vitest';
import vitestGlobals from 'eslint-plugin-vitest-globals';
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys';

export default [
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            parser: parser,
            sourceType: 'module',
            globals: {
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly',
                ...vitestGlobals.environments.globals,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: eslintPluginPrettier,
            'simple-import-sort': simpleImportSort,
            vitest,
            import: importPlugin,
            'typescript-sort-keys': typescriptSortKeys,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tseslint.configs.recommended.rules,
            'prettier/prettier': ['error'],
            'no-console': 'off',
            'no-plusplus': 'off',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'import/order': ['error', { 'newlines-between': 'always' }],
            radix: 'off',
            'typescript-sort-keys/interface': 'warn',
            'typescript-sort-keys/string-enum': 'warn',
        },
    },
    {
        ignores: ['node_modules/**'],
    },
];
