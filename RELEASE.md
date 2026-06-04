# Release workflow — LotusIDE

LotusIDE uses `electron-updater` against GitHub Releases. Users get an
in-app "Update available" notification within seconds of launching, and a
one-click "Restart and install" button replaces the running binary in place.

## Prerequisites (one-time)

1. **Personal Access Token with `repo` scope** for the `LotusIDE` repository.
   Create at https://github.com/settings/tokens (classic, since electron-builder
   does not yet support fine-grained tokens for uploads).

2. Expose the token to electron-builder as an environment variable. **Never
   commit it.** Use one of:

   ```powershell
   # PowerShell — session only
   $env:GH_TOKEN = "ghp_xxxxxxxxxxxx"

   # …or persist for the current user
   [Environment]::SetEnvironmentVariable("GH_TOKEN", "ghp_xxxxxxxxxxxx", "User")
   ```

3. Make sure `package.json` → `build.publish` points at the right repo:

   ```json
   "publish": {
     "provider": "github",
     "owner": "jaturong-kamonlers",
     "repo": "LotusIDE"
   }
   ```

## Cutting a release

```powershell
# 1. Bump the version (semver). package.json + commit + tag.
npm version patch    # or `minor` / `major`

# 2. Build the installer AND upload it to GitHub Releases.
#    --publish always uploads even on dirty trees; use `onTagOrDraft`
#    in CI when you only want releases from clean tags.
npx electron-builder --publish always

# 3. Push the version commit + tag.
git push --follow-tags
```

What electron-builder uploads (per platform):

- `Lotus IDE Setup <ver>.exe`       — NSIS installer
- `Lotus IDE Setup <ver>.exe.blockmap` — diff metadata for delta updates
- `latest.yml`                      — manifest that `electron-updater` polls

> The release is created as a **draft** by default. Open the GitHub Releases
> page and click **Publish release** to make it visible to users' auto-update
> clients. Until then `electron-updater` will report "up to date" even though
> the assets exist.

## How users see the update

1. App launches → `electron/ipc/updater.js` calls `checkForUpdates()` after a
   3-second delay (only in packaged builds, not dev).
2. If `latest.yml` reports a newer version than the running app, the
   `update-available` event fires → the renderer's `updaterStore.state`
   flips to `available` → `Help → Check for Updates…` shows a
   `Download v…` button.
3. User clicks Download → `download-progress` events stream to the panel
   (progress bar).
4. When complete → `update-downloaded` → `Restart and install` button.
   Clicking it calls `quitAndInstall(false, true)` which exits the app,
   runs the NSIS installer in update mode, then relaunches the new binary.

## Manual testing without publishing

Auto-update only runs when `app.isPackaged === true`. To test locally:

1. `npm run build` → installer lands in `E:/LotusIDE-build/dist-electron/`.
2. Install it (run the `.exe`).
3. Bump `package.json` version, rebuild, upload to GitHub Releases.
4. Launch the installed Lotus IDE — within ~3 seconds the panel should
   show "Update available".

## Rolling back

If a release goes out broken:

1. **Unpublish the GitHub release** (delete or mark as draft) — new launches
   stop seeing it.
2. Existing users who already downloaded the bad update need a *newer*
   release with the fix; you cannot un-update them in place.

So: **always test the installer locally before publishing the GitHub release.**

## CI/CD note (future)

A GitHub Actions workflow at `.github/workflows/release.yml` could:

- Run on push to a `v*` tag
- Build on `windows-latest` (and later `ubuntu-latest`)
- Run `electron-builder --publish always` with `secrets.GH_TOKEN`

This removes the need to set `GH_TOKEN` on your local machine. Not yet
implemented — local manual release is fine while the project is small.
