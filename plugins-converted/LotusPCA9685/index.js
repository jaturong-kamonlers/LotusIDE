lotus.register({
  toolbox: { name: 'PCA9685', color: '#FFA726' },
  blocks: [
    {
      type: 'pca9685_setup',
      message0: '%1 Setup PCA9685 addr 0x%2 freq %3 Hz',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' },
        { type: 'field_dropdown', name: 'ADDR', options: [['40','40'],['41','41'],['42','42'],['43','43'],['44','44'],['45','45'],['46','46'],['47','47']] },
        { type: 'field_number',   name: 'FREQ', value: 50, min: 24, max: 1526, precision: 1 },
      ],
      previousStatement: null, nextStatement: null, colour: '#FFA726',
    },
    {
      type: 'pca9685_set_angle',
      message0: '%1 Set Angle ch %2 angle %3 Â°',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' },
        { type: 'field_number', name: 'CH', value: 0, min: 0, max: 15, precision: 1 },
        { type: 'input_value', name: 'ANGLE', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#FFA726',
    },
    {
      type: 'pca9685_set_us',
      message0: '%1 Set Pulse ch %2 pulse %3 Î¼s',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' },
        { type: 'field_number', name: 'CH', value: 0, min: 0, max: 15, precision: 1 },
        { type: 'input_value', name: 'US', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#FFA726',
    },
    {
      type: 'pca9685_set_pwm',
      message0: '%1 Set PWM Raw ch %2 on %3 off %4',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' },
        { type: 'field_number', name: 'CH', value: 0, min: 0, max: 15, precision: 1 },
        { type: 'input_value', name: 'ON',  check: 'Number' },
        { type: 'input_value', name: 'OFF', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#FFA726',
    },
    {
      type: 'pca9685_set_off',
      message0: '%1 Set Off ch %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' },
        { type: 'field_number', name: 'CH', value: 0, min: 0, max: 15, precision: 1 },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#FFA726',
    },
    { type: 'pca9685_all_off', message0: '%1 All Channels Off', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#FFA726' },
    {
      type: 'pca9685_calibrate',
      message0: '%1 Calibrate ch %2 min %3 max %4 Î¼s',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PCA1' },
        { type: 'field_number', name: 'CH', value: 0, min: 0, max: 15, precision: 1 },
        { type: 'field_number', name: 'MIN_US', value: 544,  min: 100, max: 2500, precision: 1 },
        { type: 'field_number', name: 'MAX_US', value: 2400, min: 100, max: 2500, precision: 1 },
      ],
      previousStatement: null, nextStatement: null, colour: '#FFA726',
    },
  ],
  generators: {
    pca9685_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var addr = '0x' + block.getFieldValue('ADDR');
      var freq = block.getFieldValue('FREQ') || '50';
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "LotusPCA9685.h"\\n#END\\n' +
        '#VARIABLE\\nLotusPCA9685 _pca_' + v + ';\\n#END\\n' +
        '#SETUP\\n_pca_' + v + '.begin(' + addr + ', ' + freq + '.0f);\\ndelay(10);\\n#END\\n'
      );
    `,
    pca9685_set_angle: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var ch = block.getFieldValue('CH');
      var a = generator.valueToCode(block, 'ANGLE', 0) || '90';
      return '_pca_' + v + '.setAngle(' + ch + ', ' + a + ');\\n';
    `,
    pca9685_set_us: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var ch = block.getFieldValue('CH');
      var us = generator.valueToCode(block, 'US', 0) || '1500';
      return '_pca_' + v + '.setMicroseconds(' + ch + ', ' + us + ');\\n';
    `,
    pca9685_set_pwm: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var ch = block.getFieldValue('CH');
      var on  = generator.valueToCode(block, 'ON', 0)  || '0';
      var off = generator.valueToCode(block, 'OFF', 0) || '2048';
      return '_pca_' + v + '.setPWM(' + ch + ', ' + on + ', ' + off + ');\\n';
    `,
    pca9685_set_off: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pca_' + v + '.setOff(' + block.getFieldValue('CH') + ');\\n';",
    pca9685_all_off: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pca_' + v + '.setAllOff();\\n';",
    pca9685_calibrate: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_pca_' + v + '.calibrate(' + block.getFieldValue('CH') + ', ' + block.getFieldValue('MIN_US') + ', ' + block.getFieldValue('MAX_US') + ');\\n';
    `,
  },
})
