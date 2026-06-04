# Publishing Lotus IDE Plugins & Boards

This guide is for community authors who want to publish a plugin or board
package that other Lotus IDE users can install with one click.

LotusIDE supports three install paths for both plugins and boards:

| Path | Use case | Audience reach |
|------|----------|----------------|
| **Install from .zip (local file)** | Private / unreleased work | Just you |
| **Install from GitHub repo URL** | Public, no curation needed | Anyone with your URL |
| **Catalog entry** | Listed in the official marketplace | Discoverable by default |

The first two work out of the box — you only need a GitHub repo. The third
requires a pull request to the catalog repo (see "Catalog submission" below).

---

## 1. Plugin packages

### Folder layout (what goes in the .zip)

```
my-plugin.zip
├── lotus-plugin.json    # manifest — required at root
├── index.js             # entry point — required at root
└── icon.png             # optional, 64×64 PNG
```

See `src/plugins/PLUGIN_API.md` in the LotusIDE repo for the full plugin
manifest + API reference.

### Repo structure

```
github.com/<you>/lotus-plugin-<name>
├── lotus-plugin.json
├── index.js
├── icon.png
├── README.md
└── (optional) test files, examples
```

### Cutting a release

```bash
# 1. Bump version in lotus-plugin.json + commit + tag
git commit -m "Release v1.2.0"
git tag v1.2.0
git push --follow-tags

# 2. Build the install zip — content of these files (NOT the folder itself)
zip my-plugin.zip lotus-plugin.json index.js icon.png
# …or PowerShell:
# Compress-Archive -Path lotus-plugin.json, index.js, icon.png -DestinationPath my-plugin.zip -Force

# 3. Create a GitHub release manually:
#    github.com/<you>/lotus-plugin-<name>/releases/new
#    - Tag: v1.2.0
#    - Attach: my-plugin.zip
#    - Publish.
```

### How users install yours

- **From GitHub:** Lotus → Plugins → From GitHub tab → paste
  `github.com/<you>/lotus-plugin-<name>` → Install latest release.
- LotusIDE hits `api.github.com/repos/.../releases/latest`, finds the first
  `.zip` asset, downloads it, unpacks, and installs.

---

## 2. Board packages

### Folder layout

The board layout follows the KBIDE convention used by all bundled boards
under `public/boards/`:

```
my-board.zip
├── config.js                 # board metadata — required at root
├── block/
│   ├── blocks.js             # Blockly block definitions
│   ├── generators.js         # Arduino code generators
│   └── config.js             # block-side category config
├── include/
│   └── MyBoard.h             # board-specific helper header
├── static/
│   └── display.png           # board photo (shown in selector)
└── context.json              # optional: protocol + baudrate overrides
```

Look at any folder under `public/boards/` in the LotusIDE repo for a complete
working example.

### config.js (root)

```js
module.exports = {
  name:        'MyBoard',
  title:       'My Custom Board',
  description: 'ESP32 board with built-in OLED',
  platform:    'arduino-esp32',
  version:     '1.0.0',
}
```

### Cutting a release

Same as plugins:

```powershell
Compress-Archive -Path config.js, block, include, static, context.json `
  -DestinationPath my-board.zip -Force
```

Attach `my-board.zip` to a GitHub release at
`github.com/<you>/lotus-board-<name>/releases/new`.

### How users install yours

- **From GitHub:** Lotus → Manage Boards → From GitHub tab → paste your repo
  spec → Install. The board folder name will match your repo name (so name
  the repo something the install can use, e.g. `LotusMyBoard`).

---

## 3. Catalog submission (official marketplace listing)

Catalogs are plain JSON arrays hosted on GitHub raw URLs. The defaults are:

- **Plugins:** `github.com/lotus-arduibot/lotus-plugins/blob/main/catalog.json`
- **Boards:**  `github.com/lotus-arduibot/lotus-boards/blob/main/catalog.json`

To add your package to the official catalog, open a pull request adding an
entry like:

```jsonc
{
  "kind":        "plugin",                          // or "board"
  "id":         "com.example.servo-extra",          // reverse-DNS for plugins; folder name for boards
  "name":       "Servo Extra",
  "version":    "1.0.0",
  "author":     "Your Name",
  "description": "Adds 270° / continuous-rotation servo blocks",
  "repo":       "https://github.com/you/lotus-servo-extra",
  "downloadUrl": "https://github.com/you/lotus-servo-extra/releases/download/v1.0.0/servo-extra.zip",
  "icon":       "https://raw.githubusercontent.com/you/lotus-servo-extra/main/icon.png",
  "tags":       ["servo", "actuator"]
}
```

The catalog maintainer will review for safety (no malicious code, plugin uses
sandbox API correctly, board package layout is valid) and merge.

### Self-hosting your own catalog

Users can point at **any** HTTPS URL in their catalog settings (Lotus → Plugins
→ Settings or → Manage Boards → Settings). This means schools, vendors, or
teams can ship their own private/curated lists without going through the
official catalog. The schema is the same.

---

## Naming convention (recommended)

| Prefix             | Meaning              | Example                        |
|--------------------|----------------------|--------------------------------|
| `lotus-plugin-…`   | A plugin repo        | `lotus-plugin-servo-extra`     |
| `lotus-board-…`    | A board repo         | `lotus-board-customesp32`      |
| GitHub topic `lotus-ide` | Discoverability | Add this topic to your repo  |

---

## Security expectations

- **Plugin authors:** your code runs inside a sandboxed Web Worker, but
  generator strings run in the renderer's main thread. Don't try to escape;
  the user is trusting you. Don't include obfuscated code.
- **Board authors:** `config.js` and the files in `block/` are evaluated in
  the Electron main process (not sandboxed). Don't write code that touches the
  filesystem, network, or child processes. Stick to Blockly block + generator
  registration.

Anything submitted to the official catalog goes through review for these
expectations. Self-hosted catalogs do not — set user expectations accordingly.
