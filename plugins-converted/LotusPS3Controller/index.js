// PS3 Controller plugin for Lotus IDE.
//
// Wraps the vendored esp32-ps3 library shipped under src/Ps3Controller.h.
// The arduino.js compile pipeline auto-exposes src/ as an Arduino library
// so #include <Ps3Controller.h> resolves at compile time.
//
// Bluetooth Classic only — ESP32-S2/C3 are NOT supported (no BR/EDR).

var PS3_COLOUR = '#003791';

lotus.register({
  toolbox: {
    name: 'PS3 Controller',
    color: PS3_COLOUR,
  },
  blocks: [
    {
      type: 'lotus_ps3_begin',
      message0: 'PS3 begin, ESP32 BT MAC %1',
      args0: [
        { type: 'field_input', name: 'MAC', text: '01:02:03:04:05:06' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: PS3_COLOUR,
      tooltip: 'Start Bluetooth Classic and set the ESP32 BT MAC.\nUse sixaxispairtool first to write this MAC into the PS3 controller.',
      helpUrl: 'https://github.com/jvpernis/esp32-ps3',
    },
    {
      type: 'lotus_ps3_is_connected',
      message0: 'PS3 connected?',
      output: 'Boolean',
      colour: PS3_COLOUR,
      tooltip: 'Returns true once the PS3 controller is connected to the ESP32',
    },
    {
      type: 'lotus_ps3_button',
      message0: 'PS3 button %1 pressed?',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BTN',
          options: [
            ['Cross',    'cross'],
            ['Circle',   'circle'],
            ['Square',   'square'],
            ['Triangle', 'triangle'],
            ['Up',       'up'],
            ['Down',     'down'],
            ['Left',     'left'],
            ['Right',    'right'],
            ['L1',       'l1'],
            ['R1',       'r1'],
            ['L2',       'l2'],
            ['R2',       'r2'],
            ['L3',       'l3'],
            ['R3',       'r3'],
            ['Start',    'start'],
            ['Select',   'select'],
            ['PS',       'ps'],
          ],
        },
      ],
      output: 'Boolean',
      colour: PS3_COLOUR,
      tooltip: 'Returns true while the selected button is held',
    },
    {
      type: 'lotus_ps3_stick',
      message0: 'PS3 stick %1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'AXIS',
          options: [
            ['LX (left X)',  'lx'],
            ['LY (left Y)',  'ly'],
            ['RX (right X)', 'rx'],
            ['RY (right Y)', 'ry'],
          ],
        },
      ],
      output: 'Number',
      colour: PS3_COLOUR,
      tooltip: 'Analog stick value, -127 to 127 (0 = centre)',
    },
  ],
  generators: {
    lotus_ps3_begin: `
      var mac = block.getFieldValue('MAC') || '01:02:03:04:05:06';
      var code = '';
      code += '#EXTINC\\n#include <Ps3Controller.h>\\n#END\\n';
      code += '#SETUP\\nPs3.begin("' + mac + '");\\n#END\\n';
      return code;
    `,
    lotus_ps3_is_connected: "return ['Ps3.isConnected()', 0];",
    lotus_ps3_button: `
      var btn = block.getFieldValue('BTN');
      return ['Ps3.data.button.' + btn, 0];
    `,
    lotus_ps3_stick: `
      var axis = block.getFieldValue('AXIS');
      return ['Ps3.data.analog.stick.' + axis, 0];
    `,
  },
})
