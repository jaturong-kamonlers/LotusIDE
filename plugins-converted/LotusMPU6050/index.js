lotus.register({
  toolbox: { name: 'MPU6050', color: '#4FC3F7' },
  blocks: [
    {
      type: 'mpu6050_setup',
      message0: '%1 Setup MPU6050 address %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' },
        { type: 'field_dropdown', name: 'ADDRESS', options: [['0x68 (default)', '0x68'], ['0x69 (AD0=HIGH)', '0x69']] },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    { type: 'mpu6050_update', message0: '%1 Read MPU6050 (once per loop)', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7' },
    {
      type: 'mpu6050_read_accel',
      message0: '%1 Accel %2 (g)',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' },
        { type: 'field_dropdown', name: 'AXIS', options: [['X','X'],['Y','Y'],['Z','Z']] },
      ],
      inputsInline: true, output: 'Number', colour: '#4FC3F7',
    },
    {
      type: 'mpu6050_read_gyro',
      message0: '%1 Gyro %2 (deg/s)',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' },
        { type: 'field_dropdown', name: 'AXIS', options: [['X','X'],['Y','Y'],['Z','Z']] },
      ],
      inputsInline: true, output: 'Number', colour: '#4FC3F7',
    },
    { type: 'mpu6050_read_temp', message0: '%1 Temperature (°C)', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' }], output: 'Number', colour: '#4FC3F7' },
    {
      type: 'mpu6050_read_angle',
      message0: '%1 %2 °',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' },
        { type: 'field_dropdown', name: 'ANGLE', options: [['Pitch','PITCH'],['Roll','ROLL']] },
      ],
      inputsInline: true, output: 'Number', colour: '#4FC3F7',
    },
    {
      type: 'mpu6050_set_accel_range',
      message0: '%1 Set Accel Range %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' },
        { type: 'field_dropdown', name: 'RANGE', options: [['±2g','ACCEL_2G'],['±4g','ACCEL_4G'],['±8g','ACCEL_8G'],['±16g','ACCEL_16G']] },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    {
      type: 'mpu6050_set_gyro_range',
      message0: '%1 Set Gyro Range %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' },
        { type: 'field_dropdown', name: 'RANGE', options: [['±250 dps','GYRO_250DPS'],['±500 dps','GYRO_500DPS'],['±1000 dps','GYRO_1000DPS'],['±2000 dps','GYRO_2000DPS']] },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    { type: 'mpu6050_connected', message0: '%1 Connected?', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'MPU1' }], output: 'Boolean', colour: '#4FC3F7' },
  ],
  generators: {
    mpu6050_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var addr = block.getFieldValue('ADDRESS');
      var wireBegin = (board.platform === 'arduino-avr')
        ? 'Wire.begin();'
        : 'Wire.begin(' + (board.i2cSda || 21) + ', ' + (board.i2cScl || 22) + ');';
      var vars = ['ok=false','ax=0','ay=0','az=0','gx=0','gy=0','gz=0','temp=0','pitch=0','roll=0']
        .map(function(p){ var k = p.split('=')[0]; var d = p.split('=')[1]; return (k==='ok'?'bool ':'float ') + '_mpu_' + v + '_' + k + ' = ' + d + ';'; })
        .join('\\n');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "MPU6050_Plugin.h"\\n#END\\n' +
        '#VARIABLE\\nMPU6050_Plugin _mpu_' + v + '(' + addr + ');\\n' + vars + '\\n#END\\n' +
        '#SETUP\\n' + wireBegin + '\\n_mpu_' + v + '_ok = _mpu_' + v + '.begin();\\ndelay(100);\\n#END\\n'
      );
    `,
    mpu6050_update: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_mpu_' + v + '.update(50);\\nif (_mpu_' + v + '.isUpdated()) {\\n' +
        ['ax=getAccelX()','ay=getAccelY()','az=getAccelZ()','gx=getGyroX()','gy=getGyroY()','gz=getGyroZ()','temp=getTemperature()','pitch=getPitch()','roll=getRoll()']
          .map(function(p){ var k = p.split('=')[0]; var fn = p.split('=')[1]; return '  _mpu_' + v + '_' + k + ' = _mpu_' + v + '.' + fn + ';'; })
          .join('\\n') +
        '\\n}\\n';
    `,
    mpu6050_read_accel: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var map = { X: 'ax', Y: 'ay', Z: 'az' };
      return ['_mpu_' + v + '_' + map[block.getFieldValue('AXIS')], 0];
    `,
    mpu6050_read_gyro: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var map = { X: 'gx', Y: 'gy', Z: 'gz' };
      return ['_mpu_' + v + '_' + map[block.getFieldValue('AXIS')], 0];
    `,
    mpu6050_read_temp: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_mpu_' + v + '_temp', 0];",
    mpu6050_read_angle: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var map = { PITCH: 'pitch', ROLL: 'roll' };
      return ['_mpu_' + v + '_' + map[block.getFieldValue('ANGLE')], 0];
    `,
    mpu6050_set_accel_range: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_mpu_' + v + '.setAccelRange(' + block.getFieldValue('RANGE') + ');\\n';",
    mpu6050_set_gyro_range:  "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_mpu_' + v + '.setGyroRange(' + block.getFieldValue('RANGE') + ');\\n';",
    mpu6050_connected: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_mpu_' + v + '_ok', 0];",
  },
})
