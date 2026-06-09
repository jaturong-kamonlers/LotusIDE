lotus.register({
  toolbox: { name: 'Compass', color: '#4FC3F7' },
  blocks: [
    { type: 'hmc5883_setup',  message0: '%1 Setup HMC5883L', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7' },
    { type: 'hmc5883_update', message0: '%1 Read HMC5883L (once per loop)', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7' },
    { type: 'hmc5883_read_heading', message0: '%1 Heading °', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' }], output: 'Number', colour: '#4FC3F7' },
    {
      type: 'hmc5883_read_raw',
      message0: '%1 Raw %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' },
        { type: 'field_dropdown', name: 'AXIS', options: [['X','X'],['Y','Y'],['Z','Z']] },
      ],
      inputsInline: true, output: 'Number', colour: '#4FC3F7',
    },
    {
      type: 'hmc5883_calibrate',
      message0: '%1 Calibrate samples %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' },
        { type: 'input_value', name: 'SAMPLES', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    {
      type: 'hmc5883_set_offset',
      message0: '%1 Set Offset X %2 Y %3 Z %4',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' },
        { type: 'input_value', name: 'X_OFFSET', check: 'Number' },
        { type: 'input_value', name: 'Y_OFFSET', check: 'Number' },
        { type: 'input_value', name: 'Z_OFFSET', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    {
      type: 'hmc5883_declination',
      message0: '%1 Declination %2 °',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' },
        { type: 'field_number', name: 'DECLINATION', value: 0, min: -180, max: 180 },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    { type: 'hmc5883_available', message0: '%1 Connected?', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'HMC1' }], output: 'Boolean', colour: '#4FC3F7' },
  ],
  generators: {
    hmc5883_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "HMC5883L_Plugin.h"\\n#END\\n' +
        '#VARIABLE\\nHMC5883L_Plugin _hmc_' + v + ';\\n' +
        'bool _hmc_' + v + '_ok = false;\\nfloat _hmc_' + v + '_heading = 0;\\n' +
        'int16_t _hmc_' + v + '_x = 0;\\nint16_t _hmc_' + v + '_y = 0;\\nint16_t _hmc_' + v + '_z = 0;\\n#END\\n' +
        '#SETUP\\n_hmc_' + v + '_ok = _hmc_' + v + '.begin();\\ndelay(100);\\n' +
        '_hmc_' + v + '_heading = _hmc_' + v + '.getHeading();\\n' +
        '_hmc_' + v + '_x = _hmc_' + v + '.getX();\\n' +
        '_hmc_' + v + '_y = _hmc_' + v + '.getY();\\n' +
        '_hmc_' + v + '_z = _hmc_' + v + '.getZ();\\n#END\\n'
      );
    `,
    hmc5883_update: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_hmc_' + v + '.update(500);\\nif (_hmc_' + v + '.isUpdated()) {\\n' +
        '  _hmc_' + v + '_heading = _hmc_' + v + '.getCachedHeading();\\n' +
        '  _hmc_' + v + '_x = _hmc_' + v + '.getX();\\n' +
        '  _hmc_' + v + '_y = _hmc_' + v + '.getY();\\n' +
        '  _hmc_' + v + '_z = _hmc_' + v + '.getZ();\\n}\\n';
    `,
    hmc5883_read_heading: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_hmc_' + v + '_heading', 0];",
    hmc5883_read_raw: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var axis = block.getFieldValue('AXIS').toLowerCase();
      return ['_hmc_' + v + '_' + axis, 0];
    `,
    hmc5883_calibrate: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var s = generator.valueToCode(block, 'SAMPLES', 0) || '500';
      return '_hmc_' + v + '.calibrate(' + s + ');\\n';
    `,
    hmc5883_set_offset: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var x = generator.valueToCode(block, 'X_OFFSET', 0) || '0';
      var y = generator.valueToCode(block, 'Y_OFFSET', 0) || '0';
      var z = generator.valueToCode(block, 'Z_OFFSET', 0) || '0';
      return '_hmc_' + v + '.setCalibrationOffsets(' + x + ', ' + y + ', ' + z + ');\\n';
    `,
    hmc5883_declination: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var d = block.getFieldValue('DECLINATION');
      return '_hmc_' + v + '.setDeclination(' + d + ');\\n';
    `,
    hmc5883_available: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_hmc_' + v + '_ok', 0];",
  },
})
