import importPlugin from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vitest from 'eslint-plugin-vitest';
import vitestGlobals from 'eslint-plugin-vitest-globals';

export default [
    {
        files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                Atomics: 'readonly',
                SharedArrayBuffer: 'readonly',
                ...vitestGlobals.environments.globals,
            },
        },
        plugins: {
            prettier: eslintPluginPrettier,
            'simple-import-sort': simpleImportSort,
            vitest,
            import: importPlugin,
        },
        rules: {
            'prettier/prettier': ['error'],
            'no-console': 'off',
            'no-plusplus': 'off',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            radix: 'off',
        },
    },
    {
        ignores: ['node_modules/**'],
    },
];
