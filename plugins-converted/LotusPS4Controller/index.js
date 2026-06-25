// PS4 Controller plugin for Lotus IDE.
//
// Wraps the vendored PS4-esp32 library shipped under src/PS4Controller.h.
// The arduino.js compile pipeline auto-exposes src/ as an Arduino library
// so #include <PS4Controller.h> resolves at compile time.
//
// Bluetooth Classic only — ESP32-S2/C3 are NOT supported (no BR/EDR).

var PS4_COLOUR = '#0070D1';

lotus.register({
  toolbox: {
    name: 'PS4 Controller',
    color: PS4_COLOUR,
  },
  blocks: [
    {
      type: 'lotus_ps4_begin',
      message0: 'PS4 begin, MAC %1',
      args0: [
        { type: 'field_input', name: 'MAC', text: '01:02:03:04:05:06' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: PS4_COLOUR,
      tooltip: 'Start Bluetooth Classic and set the MAC paired with the PS4 controller.\nUse DS4Windows first to point the controller master at this MAC.',
      helpUrl: 'https://github.com/aed3/PS4-esp32',
    },
    {
      type: 'lotus_ps4_is_connected',
      message0: 'PS4 connected?',
      output: 'Boolean',
      colour: PS4_COLOUR,
      tooltip: 'Returns true once the PS4 controller is connected to the ESP32',
    },
    {
      type: 'lotus_ps4_button',
      message0: 'PS4 button %1 pressed?',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BTN',
          options: [
            ['Cross',    'Cross'],
            ['Circle',   'Circle'],
            ['Square',   'Square'],
            ['Triangle', 'Triangle'],
            ['Up',       'Up'],
            ['Down',     'Down'],
            ['Left',     'Left'],
            ['Right',    'Right'],
            ['L1',       'L1'],
            ['R1',       'R1'],
            ['L2',       'L2'],
            ['R2',       'R2'],
            ['L3',       'L3'],
            ['R3',       'R3'],
            ['Share',    'Share'],
            ['Options',  'Options'],
            ['PS',       'PSButton'],
            ['Touchpad', 'Touchpad'],
          ],
        },
      ],
      output: 'Boolean',
      colour: PS4_COLOUR,
      tooltip: 'Returns true while the selected button is held',
    },
    {
      type: 'lotus_ps4_stick',
      message0: 'PS4 stick %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'AXIS',
          options: [
            ['LX (left X)',  'LStickX'],
            ['LY (left Y)',  'LStickY'],
            ['RX (right X)', 'RStickX'],
            ['RY (right Y)', 'RStickY'],
          ],
        },
      ],
      output: 'Number',
      colour: PS4_COLOUR,
      tooltip: 'Analog stick value, -128 to 127 (0 = centre)',
    },
  ],
  generators: {
    lotus_ps4_begin: `
      var mac = block.getFieldValue('MAC') || '01:02:03:04:05:06';
      var code = '';
      code += '#EXTINC\\n#include <PS4Controller.h>\\n#END\\n';
      code += '#SETUP\\nPS4.begin("' + mac + '");\\n#END\\n';
      return code;
    `,
    lotus_ps4_is_connected: "return ['PS4.isConnected()', 0];",
    lotus_ps4_button: `
      var btn = block.getFieldValue('BTN');
      return ['PS4.' + btn + '()', 0];
    `,
    lotus_ps4_stick: `
      var axis = block.getFieldValue('AXIS');
      return ['PS4.' + axis + '()', 0];
    `,
  },
})
