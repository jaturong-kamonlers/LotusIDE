# Lotus IDE — Converted Plugins (Phase 2 PoC)

Two plugins ported from the legacy KBIDE format under `C:\LotusIDE\plugins\`
to the new LotusIDE plugin format introduced in v1.5.0.

- **LotusBH1750** — I2C light sensor (Sensors category), works on ESP32 + AVR.
- **LotusServo** — standard hobby servo (Actuators category), works on ESP32 + AVR.

## How to test locally

The compiled installer ships with no plugins. To try these before publishing:

1. Install LotusIDE v1.5.0 or later (the loader has the new schema + board
   context + plugin library injection landed).
2. Close LotusIDE.
3. Copy each folder into your user-data plugin dir:

   ```
   Windows: %APPDATA%\lotus-ide\plugins\
   macOS:   ~/Library/Application Support/lotus-ide/plugins/
   Linux:   ~/.config/lotus-ide/plugins/
   ```

   So you end up with e.g. `%APPDATA%\lotus-ide\plugins\LotusBH1750\index.js`
   and `%APPDATA%\lotus-ide\plugins\LotusServo\index.js`.
4. Reopen LotusIDE → **Lotus → Plugins → Installed tab** should list both
   with status `loaded`.
5. Open the Blockly toolbox — there should be two new categories near the
   bottom: **Sensors** (containing BH1750 blocks) and **Actuators**
   (containing Servo blocks).
6. Pick a board (e.g. LotusDevkit), drop a `BH1750 begin` block in setup,
   `BH1750 read light level` in loop, and compile. The compile pipeline
   will copy `LotusBH1750/src/BH1750.{h,cpp}` into the build's libraries
   tree automatically, so the sketch compiles without further setup.

## Packaging for the public catalog

Once a plugin is verified locally, zip the folder contents (not the folder
itself) into `<id>-<version>.zip`, upload to
`github.com/jaturong-kamonlers/lotus-plugins/releases`, and add an entry to
that repo's `catalog.json`:

```json
[
  {
    "id": "com.lotus.sensor.bh1750",
    "name": "BH1750 Light Sensor",
    "version": "1.0.0",
    "description": "Read ambient light level (lx) from BH1750 over I2C",
    "category": "Sensors",
    "platforms": ["arduino-esp32", "arduino-avr"],
    "url": "https://github.com/jaturong-kamonlers/lotus-plugins/releases/download/v1.0.0/com.lotus.sensor.bh1750-1.0.0.zip",
    "icon": "https://raw.githubusercontent.com/jaturong-kamonlers/lotus-plugins/main/icons/bh1750.jpg"
  }
]
```

## Notes for the remaining 13 KBIDE plugins

Both converted plugins follow the same recipe:

1. **Manifest** (`library.json` → `lotus-plugin.json`): copy id/name/version,
   add a `category` from the v1.5.0 enum (`Sensors`/`Actuators`/`Vision`/
   `Motion`/`Other`), copy `platform[]` → `platforms[]`.
2. **Blocks**: rewrite the imperative `Blockly.Blocks['x'] = { init() { ... } }`
   shape as JSON definitions in the `blocks` array. Fields map 1:1:
   `appendField(new Blockly.FieldDropdown(...))` → `{ type: 'field_dropdown' }`,
   `Blockly.FieldVariable` → `{ type: 'field_variable' }`,
   `Blockly.FieldNumber` → `{ type: 'field_number' }`.
3. **Generators**: drop them in as strings under `generators`. The 3rd arg
   `board` replaces `Vue.prototype.$global.board.board_info.name`. The
   `#EXTINC`/`#VARIABLE`/`#SETUP`/`#FUNCTION` markers already work in
   LotusIDE — keep them.
4. **C++ sources**: copy `src/*.{h,cpp,c}` over unchanged. The compile
   pipeline (v1.5.0+) copies them into the build's libraries tree, so
   nothing else has to know about them.
