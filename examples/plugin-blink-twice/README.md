# Blink Twice — Lotus IDE example plugin

A minimal example plugin showing the Lotus IDE plugin API.

## Build the zip

From the project root:

```powershell
# PowerShell
Compress-Archive -Path examples\plugin-blink-twice\* -DestinationPath examples\plugin-blink-twice.zip -Force
```

```bash
# bash
cd examples/plugin-blink-twice && zip -r ../plugin-blink-twice.zip . && cd -
```

## Install

1. Open Lotus IDE
2. **Lotus → Plugins...**
3. Click **Install from .zip**
4. Choose the `.zip` you just built

A new **"Example"** category should appear at the bottom of the Blockly toolbox.

See [`src/plugins/PLUGIN_API.md`](../../src/plugins/PLUGIN_API.md) for the full plugin API.
