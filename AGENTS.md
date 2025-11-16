# Agent Guide

Welcome! This repository is a TypeScript library that exposes trie-based search utilities. The project is Bun-native and bundles with [tsdown](https://tsdown.dev), so prefer Bun workflows over Node/NPM.

## Repository layout

| Path | Description |
| --- | --- |
| `src/` | Library source. `src/index.ts` re-exports helpers from `src/trie.ts`, `src/utils.ts`, etc. Keep new modules colocated under `src/`. |
| `testing/` | Sample rule sets and fixtures used by benchmarks/tests. |
| `benchmark/` | ESBench suites for performance verification. |
| `dist/` | Generated artifacts from `bun run build` (never edit manually). |
| `tsdown.config.ts` | Bundler configuration consumed by the upstream tsdown CLI. |
| `biome.json` | Combined lint/format configuration. |

## Coding conventions

- Use TypeScript with explicit return types on exported functions.
- Add JSDoc blocks for every exported function, interface, and enum to keep the public API self-documented.
- Prefer pure functions; shared helpers belong in `src/utils.ts`.
- Keep line width ≤ 100 characters (Biome enforces this) and run Biome formatters before committing.
- Tests live in `src/*.test.ts` alongside the code they verify; add Vitest coverage for new branches.

## Development workflow

1. Install/update dependencies with `bun install` (or `bun update --latest` when bumping versions).
2. Build the library through the official CLI: `bun run build` → `tsdown build` + declaration emit.
3. Run `bun test` for unit tests and `bun run benchmark` for performance baselines when relevant.
4. Lint/format with `bun run lint` / `bun run format` (Biome handles both and uses the schema pinned in `biome.json`).

If registry access errors block dependency installation, document the limitation in your summary and suggest using a reachable registry mirror.
