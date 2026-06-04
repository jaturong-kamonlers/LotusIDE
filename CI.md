# CI/CD — automated releases via GitHub Actions

LotusIDE ships releases through `.github/workflows/release.yml`. The
workflow runs on a Windows GitHub-hosted runner, reconstitutes the
`resources/` tree from upstream sources, then builds + uploads the
installer as a draft GitHub Release.

Once you've cut a tag, you don't need to be at a Windows machine to ship.
You can do everything from a browser — bump version, push tag, watch CI,
hit Publish.

## What triggers a build

| Trigger | When |
|---------|------|
| Push a tag matching `v*` | Cutting a real release. `git push --follow-tags` after `npm version` does this. |
| Manual dispatch | Actions tab → "Build + publish release" → Run workflow. Useful for ad-hoc test builds. |

## End-to-end: cutting v1.2.0 from a browser

1. **Edit `package.json` on github.com**
   - Navigate to `package.json` → pencil icon
   - Change `"version": "1.1.0"` → `"version": "1.2.0"`
   - Commit directly to `main` (or via PR)

2. **Tag the commit**
   - Navigate to `Releases` → `Draft a new release` → `Choose a tag`
   - Type `v1.2.0` → "Create new tag: v1.2.0 on publish"
   - **Don't** click Publish yet — we want CI to populate this release

   *(Alternative: create the tag directly via `Tags` → `Create tag`, then
   the workflow runs.)*

3. **Watch CI**
   - Go to the Actions tab
   - You'll see a run named "Build + publish release" with status `In progress`
   - First-time builds take 40–55 minutes (ESP32 core download dominates)
   - Subsequent builds are similar (no caching layer yet)

4. **Publish the draft**
   - When CI is done, Releases will have the v1.2.0 draft populated with:
     - `Lotus IDE Setup 1.2.0.exe` (~780 MB)
     - `Lotus IDE Setup 1.2.0.exe.blockmap`
     - `latest.yml`
   - Click into the draft → add release notes → **Publish release**
   - Users on v1.1.0+ get an "Update available" notification on next launch

## What the workflow actually does

```
checkout
  ↓
setup-node@v4 (Node 20)
  ↓
npm ci                                    (~2 min — uses package-lock.json)
  ↓
scripts/setup-resources.ps1               (~20 min — downloads cores + AVR)
  ├── arduino-cli                         (50 MB)
  ├── arduino:avr + arduino:sam cores     (500 MB)
  ├── esp32:esp32 core                    (5+ GB)
  └── avr-toolchain.zip from tools-v1     (52 MB)
  ↓
npm run build -- --publish always         (~15 min)
  ├── vite build                          (~10 s)
  ├── packaging                           (~3 min)
  ├── NSIS installer                      (~5 min)
  └── upload .exe + latest.yml            (~5 min)
```

Total: 35–55 minutes per build.

## Permissions / secrets

- `secrets.GITHUB_TOKEN` is auto-provided by GitHub Actions on every run.
  The workflow's `permissions: contents: write` grants it the scope needed
  to create draft releases + upload assets.
- **You do NOT need to add `GH_TOKEN` as a repository secret.** The
  workflow maps `GITHUB_TOKEN` → `GH_TOKEN` env var so electron-builder
  picks it up.
- If you ever rotate the avr-toolchain (new vendor build, version bump),
  upload it to a new release tag (e.g. `tools-v2`) and update
  `LOTUS_AVR_TOOLCHAIN_URL` in `release.yml` to point at it.

## CI minutes budget

Private repos: 2000 free Windows minutes/month. At ~45 min per release that
is ~44 releases/month. Public repos: unlimited.

If you start hitting the cap:

- Cache `resources/arduino-cli/data/packages/` between runs with
  `actions/cache@v4` (saves the ~5 GB ESP32 download → builds drop to
  ~20 min)
- Pin core versions so the cache key is stable
- Skip `arduino:sam` when no SAM-board changes are queued

These are not implemented yet — add them once they're needed.

## Local builds still work

CI does not replace `npm run build` on your machine. Use whichever fits
the moment:

- Local build → faster (no network round-trip for cores), but ties you to
  a Windows machine
- CI build → slower, but runs from a browser / phone

Both produce the same NSIS installer with the same SHA-512. The two are
interchangeable for auto-update purposes.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `avr-gcc.exe missing after setup` | `tools-v1` release was deleted or `LOTUS_AVR_TOOLCHAIN_URL` is wrong |
| `404 GET /releases` during publish | `permissions: contents: write` missing or repo is in an org with stricter Actions permissions |
| `arduino-cli core install` times out | GitHub-hosted runner couldn't reach `downloads.arduino.cc` — retry the workflow |
| NSIS step hangs >20 min | Runner is unhealthy — cancel + rerun |
| Build succeeds but no release appears | Look for "publish" lines in the build log — most likely upload failed silently due to a token scope problem |

## Linux build (not yet wired)

The workflow currently builds Windows only. To add Linux:

1. Add a parallel `build-linux` job using `ubuntu-latest`
2. Replace `setup-resources.ps1` with `scripts/setup-resources.sh`
3. electron-builder produces `.AppImage` and `.deb` from the same
   `package.json` config (already there as `linux.target`)

Hold off until you actually have Linux users — Ubuntu support is currently
unstested.
