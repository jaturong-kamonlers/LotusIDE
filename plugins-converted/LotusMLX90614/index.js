lotus.register({
  toolbox: { name: 'MLX90614', color: '#4FC3F7' },
  blocks: [
    { type: 'mlx90614_setup',       message0: '%1 Setup MLX90614',           args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MLX1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7', tooltip: 'Setup MLX90614 IR sensor (Setup block)' },
    { type: 'mlx90614_update',      message0: '%1 Read MLX90614 (once per loop)', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MLX1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7', tooltip: 'Sample once per loop' },
    { type: 'mlx90614_read_object', message0: '%1 Object Temp (°C)',         args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MLX1' }], output: 'Number',  colour: '#4FC3F7', tooltip: 'Read object temperature (-70 to 380 °C)' },
    { type: 'mlx90614_read_ambient',message0: '%1 Ambient Temp (°C)',        args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MLX1' }], output: 'Number',  colour: '#4FC3F7', tooltip: 'Read sensor ambient temperature' },
    { type: 'mlx90614_connected',   message0: '%1 Connected?',               args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MLX1' }], output: 'Boolean', colour: '#4FC3F7' },
  ],
  generators: {
    mlx90614_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var wireBegin = (board.platform === 'arduino-avr')
        ? 'Wire.begin();'
        : 'Wire.begin(' + (board.i2cSda || 21) + ', ' + (board.i2cScl || 22) + ');';
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "MLX90614_Plugin.h"\\n#END\\n' +
        '#VARIABLE\\nMLX90614_Plugin _mlx_' + v + ';\\n' +
        'bool _mlx_' + v + '_ok = false;\\n' +
        'float _mlx_' + v + '_obj = 0;\\nfloat _mlx_' + v + '_amb = 0;\\n#END\\n' +
        '#SETUP\\n' + wireBegin + '\\n_mlx_' + v + '_ok = _mlx_' + v + '.begin();\\ndelay(100);\\n#END\\n'
      );
    `,
    mlx90614_update: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_mlx_' + v + '.update(100);\\nif (_mlx_' + v + '.isUpdated()) {\\n' +
        '  _mlx_' + v + '_obj = _mlx_' + v + '.getObjectTemp();\\n' +
        '  _mlx_' + v + '_amb = _mlx_' + v + '.getAmbientTemp();\\n}\\n';
    `,
    mlx90614_read_object:  "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_mlx_' + v + '_obj', 0];",
    mlx90614_read_ambient: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_mlx_' + v + '_amb', 0];",
    mlx90614_connected:    "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_mlx_' + v + '_ok', 0];",
  },
})
