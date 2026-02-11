# Agent Guide

Welcome! This repository is a TypeScript library that exposes trie-based search utilities. The project is Bun-native and bundles with [tsdown](https://tsdown.dev), so prefer Bun workflows over Node/NPM.

## Repository layout

| Path | Description |
| --- | --- |
| `src/` | Library source. `src/index.ts` re-exports helpers from `src/trie.ts`, `src/utils.ts`, `src/optimize.ts`, etc. Keep new modules colocated under `src/`. |
| `src/optimize.ts` | Rule optimizer that consolidates case variants, apostrophe normalization, prefix dedup, subset elimination, and conflict detection. |
| `testing/` | Sample rule sets, fixtures, and the exports validation test (`exports.test.ts`) used by benchmarks/tests. |
| `testing/exports.test.ts` | Post-build export regression test. Validates that all public API members and types are correctly exported from the built `dist/` bundle. Run via `bun run test:exports`. |
| `benchmark/` | ESBench suites for performance verification. |
| `demo/` | Vite + Preact interactive demo app. Deployed to [trie-rules.surge.sh](https://trie-rules.surge.sh) via Surge. |
| `dist/` | Generated artifacts from `bun run build` (never edit manually). |
| `tsdown.config.ts` | Bundler configuration consumed by the upstream tsdown CLI. |
| `biome.json` | Combined lint/format configuration. |

## Coding conventions

- Use TypeScript with explicit return types on exported functions.
- Add JSDoc blocks for every exported function, interface, and enum to keep the public API self-documented.
- Prefer pure functions; shared helpers belong in `src/utils.ts`.
- Keep line width ≤ 100 characters (Biome enforces this) and run Biome formatters before committing.
- Tests live in `src/*.test.ts` alongside the code they verify; add coverage for new branches.
- When adding new public exports, also add them to `testing/exports.test.ts` to prevent future regressions.

## Development workflow

1. Install/update dependencies with `bun install` (or `bun update --latest` when bumping versions).
2. Build the library through the official CLI: `bun run build` → `tsdown build` + declaration emit. A `postbuild` hook automatically runs `test:exports`.
3. Run `bun test` for unit tests and `bun run benchmark` for performance baselines when relevant.
4. Lint/format with `bun run lint` / `bun run format` (Biome handles both and uses the schema pinned in `biome.json`).

## Demo app

The `demo/` directory contains a Vite + Preact app that demonstrates `buildTrie` + `searchAndReplace` with a live transliteration rule set.

| Command | Description |
| --- | --- |
| `cd demo && bun run dev` | Start the dev server at `http://localhost:5173`. |
| `cd demo && bun run build` | Production build into `demo/dist/`. |
| `cd demo && bun run deploy` | Build and deploy to [trie-rules.surge.sh](https://trie-rules.surge.sh). |

The demo reads the `trie-rules` version from its own `package.json` dependencies to display in the header badge.

If registry access errors block dependency installation, document the limitation in your summary and suggest using a reachable registry mirror.
