# TRAKKNAME Mobile

The definitive mobile rewrite of TRAKKNAME: a 100% offline beat-title generator (genre → weighted artists → GENERATE → copy → repeat). No cloud, no accounts. i18n EN/ES throughout.

Desktop PySide6 (`trakkname-desktop`) remains the curation tool; the Flet prototype is archived. This app ports its engine to TypeScript with behavioral parity (same weights 70/20/10, same duplicate normalization, same ES agreement, same pool/mood logic).

## Stack
- Ionic React 9 + React 19 + TypeScript + Vite
- Capacitor 8 (`com.trakkname.trakkname`) — `@capacitor-community/sqlite` integrated natively (persistent adapter pending; the app currently runs on the bundled in-memory seed)
- `vitest` for unit tests, Cypress scaffold for e2e

## Features
- **Generator**: language segment (pool follows language, overridable), genre, artist pool, artists 1–5, style list, 1-WORD toggle (the *only* single-word path — lone-NOUN patterns are excluded from styles), word-type checkboxes, artist influence slider, mood picker (max 2 FIFO, searchable), artist preview chips (tap to copy), title in UPPERCASE with desktop-format meta, Copy, artist Re-roll
- **History**: search, tap-to-copy, per-row delete, clear-all, pool column; refreshes on every view
- **Database**: genres / words / artists / patterns / moods with enable toggles, per-row delete, word filters (language + type + text), genre-link display, quick word add, JSON export / merge-import / seed reset
- **Settings**: mixture weights, artist/mood influence, duplicate-avoidance window, word types (shared live with the Generator)
- TRAKKOUT dark theme, zero emoji, launcher icon + splash generated from the desktop artwork

## Project structure
```
seed-json/            bundled seed exported from the desktop DB (source of truth there)
src/
  lib/engine/         weighted_random (+SeededRng), text, grammar, templates,
                      types (DbPort + PoolEntry + labels), engine (DB-agnostic)
  lib/db/             memory (MemoryDb implements DbPort), seed (loadSeedDb),
                      store (getDb/resetDb/useDb shared instance)
  lib/services/       generation (facade), settings (localStorage),
                      library (symmetric export/import, desktop-backup compatible)
  components/generator/ OptionsPanel, ArtistsPanel, MoodsPanel, ResultCard
  pages/              Generator, History, Database, Settings
  tests/              weighted, grammar, generator, library (27 tests)
assets/               icon.png + splash.png sources + make_assets.py generator
android/              Capacitor native project (see setup below)
```

Rules: the engine only talks to `DbPort`, never to storage directly · tabs consume `useDb()`, never snapshots · web `dist/` is what gets packaged.

## Prerequisites (Windows)
- Node: `C:\nodejs` (`npm.cmd` / `npx` from there; prepend it to `PATH` in each terminal)
- JDK 21 (Temurin) + `JAVA_HOME` set at user level; SDK path pinned in `android/local.properties`; Gradle JVM pinned via `org.gradle.java.home` in `android/gradle.properties`
- Android SDK with platforms 34–36 + build-tools (emulator `Pixel_10_Pro` optional)

## Commands
```powershell
$env:PATH = "C:\nodejs;" + $env:PATH

npm install
npm run dev              # web dev server
npm run test.unit -- --run
npm run lint
npm run build            # web dist/ (always before sync)
npx cap sync android     # MUST run from the project root, never from android/
```

APK (from `android/`, invoked as `.\gradlew.bat`):
```powershell
cd android
.\gradlew.bat assembleDebug        # testing (13 MB, debug-signed)
.\gradlew.bat clean assembleRelease  # distributable (signed, use clean after asset changes)
```
Output: `android/app/build/outputs/apk/<debug|release>/app-*.apk`. For Play Store use `bundleRelease` (`.aab`) instead and bump `versionCode` in `android/app/build.gradle` on every release.

## Release signing
`android/app/build.gradle` signs `release` automatically when `android/keystore.properties` exists:
```
storeFile=../trakkname-release.key.jks
storePassword=<secret>
keyAlias=trakkname
keyPassword=<secret>
```
**Never commit** `*.jks`, `keystore.properties` or `local.properties` (all git-ignored). Back up the `.jks` + password elsewhere — losing them bricks future updates under the same identity. To recreate: `keytool -genkeypair -keystore android/trakkname-release.key.jks -alias trakkname -keyalg RSA -keysize 2048 -validity 10000`.

## Icons & splash
`python assets/make_assets.py` (requires Pillow) rebuilds `icon.png`/`splash.png` from the desktop artwork and writes the adaptive foregrounds directly into `android/.../res`. Order matters: run `npx capacitor-assets generate --android` **first** (legacy icons + splash), the script **second** (it overwrites the tool's inset foregrounds with full-bleed ones). Then `sync` + `clean assembleRelease`.

## Seed data
`seed-json/` mirrors the desktop DB. Curate on desktop, re-export with the desktop exporter, then rebuild. Note: single-word patterns (`Single Noun`/`Una Palabra`) were removed from the seed on purpose in both projects — the 1-WORD toggle uses the engine's lone-NOUN fallback.

## License
MIT (add LICENSE file as needed).
