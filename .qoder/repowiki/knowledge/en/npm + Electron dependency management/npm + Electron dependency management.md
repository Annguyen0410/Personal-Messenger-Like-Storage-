---
kind: dependency_management
name: npm + Electron dependency management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
---

This project uses the standard npm ecosystem for dependency management in an Electron desktop application.

**Package manager and manifest**
- `package.json` declares two devDependencies: `electron` (^43.0.0) and `electron-builder` (^26.15.3). There are no runtime dependencies — all functionality is implemented inline in `main.js`, `preload.js`, `app.js`, and `renderer.js`.
- The `engines` field pins Node.js to `>=18`.
- Scripts expose `start`/`dev` (run via `electron .`) and `build`/`dist` (via `electron-builder`).

**Lockfile and determinism**
- `package-lock.json` (lockfileVersion 3) is committed, pinning every transitive dependency to exact versions with integrity hashes resolved from `https://registry.npmjs.org`. This ensures reproducible installs across machines.
- No `.npmrc` file exists, so the default public npm registry is used; there is no private registry or vendoring strategy.

**Build-time bundling**
- `electron-builder` configuration in `package.json.build.files` explicitly includes `node_modules/**/*`, meaning the entire dependency tree is bundled into the distributable NSIS/portable installers for Windows. Dependencies are not expected to be installed on the target machine.

**Conventions observed**
- All third-party code is a devDependency only — the app itself has zero runtime npm packages, keeping the production bundle minimal.
- Version ranges use caret (`^`) semantics, allowing minor/patch updates within the major version while still being pinned by the lockfile.
- README documents `npm install` / `npm start` as the canonical workflow.