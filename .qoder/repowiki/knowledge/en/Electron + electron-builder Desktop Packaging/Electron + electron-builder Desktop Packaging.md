---
kind: build_system
name: Electron + electron-builder Desktop Packaging
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - .gitignore
---

This project uses a minimal, npm-centric build system built on Electron and electron-builder for packaging the desktop application. There are no Makefiles, shell scripts, Dockerfiles, or CI pipelines — all build logic lives in `package.json`.

**Build toolchain**
- Runtime: Electron ^43.0.0 (declared as devDependency)
- Packager: electron-builder ^26.15.3 (devDependency)
- Node engine requirement: >=18 (enforced via `engines` field)

**NPM scripts**
- `npm start` / `npm run dev` — launches the app in development mode via `electron .`
- `npm run build` / `npm run dist` — invokes `electron-builder` to produce distributables

**Packaging configuration (`build` section of package.json)**
- App identity: `com.messenger.selfchat`, display name `Messenger Self-Chat`
- Bundled files: `main.js`, `preload.js`, `index.html`, `app.js`, `styles.css`, plus everything under `node_modules/**/*`
- Build resources directory: `assets/` (referenced but not present in the repo root)
- Windows targets: NSIS installer (interactive install with custom shortcuts) and Portable edition
- NSIS options: non-one-click install, user-selectable install path, desktop and Start Menu shortcuts named "Messenger Self-Chat"

**Artifacts and versioning**
- Output goes to `dist/`, which is gitignored so built artifacts are never committed
- Version is managed solely by the `version` field in `package.json` (currently `1.0.0`); no automated bumping script exists
- No cross-platform build targets beyond Windows are configured (no `linux` or `mac` blocks), so builds are Windows-only

**Conventions for developers**
- Add new source files to both the Electron entry points and the `files` array in the `build` config so they get bundled into the installer
- Keep the app self-contained: all dependencies must be listed in `package.json` since `node_modules/**/*` is included in the bundle
- Do not commit anything under `dist/`; rebuild locally before distributing