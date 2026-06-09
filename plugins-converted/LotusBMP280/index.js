// BMP280 barometric pressure plugin for Lotus IDE.
// Ported from KBIDE LotusBMP280; uses #EXTINC/#VARIABLE/#SETUP markers so the
// sensor instance lives at global scope across setup() and loop().

lotus.register({
  toolbox: { name: 'BMP280', color: '#4FC3F7' },
  blocks: [
    {
      type: 'bmp280_setup',
      message0: '%1 Setup BMP280 address %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'BMP1' },
        { type: 'field_dropdown', name: 'ADDRESS', options: [['0x76 (default)', '0x76'], ['0x77 (SDO=HIGH)', '0x77']] },
      ],
      inputsInline: true,
      previousStatement: null, nextStatement: null,
      colour: '#4FC3F7',
      tooltip: 'Configure BMP280 sensor (place in Setup)',
    },
    {
      type: 'bmp280_update',
      message0: '%1 Read BMP280 (once per loop)',
      args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'BMP1' }],
      inputsInline: true,
      previousStatement: null, nextStatement: null,
      colour: '#4FC3F7',
      tooltip: 'Sample sensor once per loop iteration — call at top of loop()',
    },
    { type: 'bmp280_read_temp',     message0: '%1 Temperature (°C)', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'BMP1' }], output: 'Number', colour: '#4FC3F7', tooltip: 'Read temperature in °C' },
    { type: 'bmp280_read_pressure', message0: '%1 Pressure (hPa)',   args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'BMP1' }], output: 'Number', colour: '#4FC3F7', tooltip: 'Read barometric pressure in hPa' },
    { type: 'bmp280_read_altitude', message0: '%1 Altitude (m)',     args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'BMP1' }], output: 'Number', colour: '#4FC3F7', tooltip: 'Calculated altitude in meters' },
    { type: 'bmp280_connected',     message0: '%1 Connected?',       args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'BMP1' }], output: 'Boolean', colour: '#4FC3F7', tooltip: 'True if BMP280 responded on the bus' },
  ],
  generators: {
    bmp280_setup: `
      var inst = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var addr = block.getFieldValue('ADDRESS');
      var wireBegin = (board.platform === 'arduino-avr')
        ? 'Wire.begin();'
        : 'Wire.begin(' + (board.i2cSda || 21) + ', ' + (board.i2cScl || 22) + ');';
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "BMP280_Plugin.h"\\n#END\\n' +
        '#VARIABLE\\nBMP280_Plugin _bmp_' + inst + '(' + addr + ');\\n' +
        'bool _bmp_' + inst + '_ok = false;\\n' +
        'float _bmp_' + inst + '_temp = 0;\\n' +
        'float _bmp_' + inst + '_press = 0;\\n' +
        'float _bmp_' + inst + '_alt = 0;\\n#END\\n' +
        '#SETUP\\n' + wireBegin + '\\n_bmp_' + inst + '_ok = _bmp_' + inst + '.begin();\\ndelay(100);\\n#END\\n'
      );
    `,
    bmp280_update: `
      var inst = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_bmp_' + inst + '.update(100);\\nif (_bmp_' + inst + '.isUpdated()) {\\n' +
        '  _bmp_' + inst + '_temp = _bmp_' + inst + '.getTemperature();\\n' +
        '  _bmp_' + inst + '_press = _bmp_' + inst + '.getPressure();\\n' +
        '  _bmp_' + inst + '_alt = _bmp_' + inst + '.getAltitude();\\n}\\n';
    `,
    bmp280_read_temp:     "var i = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_bmp_' + i + '_temp', 0];",
    bmp280_read_pressure: "var i = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_bmp_' + i + '_press', 0];",
    bmp280_read_altitude: "var i = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_bmp_' + i + '_alt', 0];",
    bmp280_connected:     "var i = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_bmp_' + i + '_ok', 0];",
  },
})
