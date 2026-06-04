# Lotus IDE Plugin API (v1)

Plugins extend Lotus IDE with new Blockly blocks (and the Arduino-code generators for them). They run inside a sandboxed Web Worker — no Node, no DOM, no IPC. Plugins talk to the host only through the `lotus` global injected at worker boot.

## Plugin package layout

A plugin is a single `.zip` containing:

```
my-plugin.zip
├── lotus-plugin.json    # manifest (required)
├── index.js             # entry point — runs in worker (required)
└── icon.png             # 64×64 PNG shown in toolbox row (optional)
```

## `lotus-plugin.json`

```jsonc
{
  "id": "com.example.servo-extra",      // reverse-DNS, unique
  "name": "Servo Extra",                // display name
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Adds 270° / continuous-rotation servo blocks",
  "main": "index.js",
  "icon": "icon.png",
  "minLotusVersion": "1.0.0",
  "platforms": ["arduino-avr", "arduino-esp32"]  // optional whitelist
}
```

## `index.js` (entry point)

Runs once per session, inside a Web Worker. Must call `lotus.register(...)` exactly once with the bundle of blocks/generators/toolbox.

```js
lotus.register({
  toolbox: {
    name: 'Servo Extra',
    color: '#7B1FA2',
    icon: 'icon.png',
  },
  blocks: [
    {
      type: 'servo_270_write',
      message0: 'servo 270° pin %1 angle %2',
      args0: [
        { type: 'input_value', name: 'PIN',   check: 'Number' },
        { type: 'input_value', name: 'ANGLE', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#7B1FA2',
    },
  ],
  generators: {
    servo_270_write: `
      const pin   = generator.valueToCode(block, 'PIN',   0) || '0';
      const angle = generator.valueToCode(block, 'ANGLE', 0) || '0';
      return 'Servo270.write(' + pin + ', ' + angle + ');\\n';
    `,
  },
  includes: ['Servo270.h'],   // optional: #include lines injected at top
})
```

## Security model

- Workers have no `require`, no `import.meta`, no Node modules.
- Generator code strings are evaluated with `new Function('block', 'generator', code)` in the renderer — they run in the main thread but receive *only* the block and generator references.
- File I/O, network, and Electron IPC are all unreachable from plugin code.
- Plugins are user-installed and the user is shown a "trust" prompt at install time.

## What's NOT supported (yet)

- Custom Blockly fields (image, dropdown with images, etc.) — coming in v2
- Plugins that bundle native libraries — use board packages for that
- Listening to workspace change events — coming in v2
