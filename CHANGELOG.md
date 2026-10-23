# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Upgrade Astro to 7.4.0, MDX to 8.1.0, KaTeX to 0.19.0, and remaining
  workspace dependencies. Retain TypeScript 6.0.3 for Astro Check.
- Pin Bun 1.4.4, Caddy 2.11.7 Alpine, and Dockerfile frontend 1.28.0.
  Fetch locked dependencies using workspace manifests and install
  offline from a BuildKit cache, keeping source edits out of the install layer.

## [0.2.0] - 2026-07-26

### Changed

- Upgrade `astro` 7.0.3 → 7.1.1 and `@types/node` 26.0.1 → 26.1.1.
- Bump the shared `catalog` entries so every workspace inherits the newer
  versions: `astro` 7.0.2 → 7.1.1, `katex` 0.17.0 → 0.18.0, `pagefind`
  1.3.0 → 1.5.2 and `@types/node` 26.0.1 → 26.1.1. The `katex` and `pagefind`
  ranges had drifted well behind the versions actually being resolved.
- Hold `typescript` at 6.0.3. TypeScript 7.0.2 is available but is deliberately
  deferred to a separate migration.

## [0.1.0]

- Initial release.
