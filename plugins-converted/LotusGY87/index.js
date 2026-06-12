lotus.register({
  toolbox: { name: 'GY-87', color: '#5C6BC0' },
  blocks: [
    {
      type: 'gy87_setup',
      message0: '%1 Setup GY-87 Accel %2 Gyro %3 Beta %4 SeaLevel %5 hPa',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' },
        { type: 'field_dropdown', name: 'ACCEL_RANGE', options: [['Â±2g','ACCEL_2G'],['Â±4g','ACCEL_4G'],['Â±8g','ACCEL_8G'],['Â±16g','ACCEL_16G']] },
        { type: 'field_dropdown', name: 'GYRO_RANGE',  options: [['Â±250Â°/s','GYRO_250'],['Â±500Â°/s','GYRO_500'],['Â±1000Â°/s','GYRO_1000'],['Â±2000Â°/s','GYRO_2000']] },
        { type: 'field_number',   name: 'BETA', value: 0.1, min: 0.01, max: 1.0, precision: 0.01 },
        { type: 'field_number',   name: 'SEA_LEVEL', value: 1013.25, min: 900, max: 1100, precision: 0.01 },
      ],
      previousStatement: null, nextStatement: null, colour: '#5C6BC0',
    },
    { type: 'gy87_update', message0: '%1 Update GY-87', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#5C6BC0' },
    {
      type: 'gy87_calibrate',
      message0: '%1 Calibrate %2 samples',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' },
        { type: 'field_number',   name: 'SAMPLES', value: 500, min: 100, max: 2000, precision: 50 },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#5C6BC0',
    },
    { type: 'gy87_accel',    message0: '%1 Accel %2',                args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }, { type: 'field_dropdown', name: 'AXIS', options: [['X','X'],['Y','Y'],['Z','Z']] }], inputsInline: true, output: 'Number', colour: '#5C6BC0' },
    { type: 'gy87_gyro',     message0: '%1 Gyro %2',                 args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }, { type: 'field_dropdown', name: 'AXIS', options: [['X','X'],['Y','Y'],['Z','Z']] }], inputsInline: true, output: 'Number', colour: '#5C6BC0' },
    { type: 'gy87_attitude', message0: '%1 %2 (Â°)',                  args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }, { type: 'field_dropdown', name: 'AXIS', options: [['Pitch','PITCH'],['Roll','ROLL'],['Yaw','YAW']] }], inputsInline: true, output: 'Number', colour: '#5C6BC0' },
    { type: 'gy87_heading',  message0: '%1 Heading (Â°)',             args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }], output: 'Number', colour: '#5C6BC0' },
    { type: 'gy87_mpu_temp', message0: '%1 MPU Temp (Â°C)',           args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }], output: 'Number', colour: '#5C6BC0' },
    { type: 'gy87_bmp',      message0: '%1 BMP180 %2',               args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' }, { type: 'field_dropdown', name: 'MEAS', options: [['Temperature (Â°C)','TEMP'],['Pressure (Pa)','PRES'],['Altitude (m)','ALT']] }], inputsInline: true, output: 'Number', colour: '#5C6BC0' },
    {
      type: 'gy87_set_range',
      message0: '%1 Set %2 Range %3',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'IMU1' },
        { type: 'field_dropdown', name: 'SENSOR', options: [['Accel','ACCEL'],['Gyro','GYRO']] },
        { type: 'field_dropdown', name: 'RANGE',  options: [['Â±2g / Â±250Â°/s','0'],['Â±4g / Â±500Â°/s','1'],['Â±8g / Â±1000Â°/s','2'],['Â±16g / Â±2000Â°/s','3']] },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#5C6BC0',
    },
  ],
  generators: {
    gy87_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include <math.h>\\n#include "LotusGY87.h"\\n#END\\n' +
        '#VARIABLE\\nLotusGY87 _gy87_' + v + ';\\n#END\\n' +
        '#SETUP\\n_gy87_' + v + '.begin();\\n' +
        '_gy87_' + v + '.setAccelRange(' + block.getFieldValue('ACCEL_RANGE') + ');\\n' +
        '_gy87_' + v + '.setGyroRange(' + block.getFieldValue('GYRO_RANGE') + ');\\n' +
        '_gy87_' + v + '.setMadgwickBeta(' + block.getFieldValue('BETA') + 'f);\\n' +
        '_gy87_' + v + '.setSeaLevel(' + block.getFieldValue('SEA_LEVEL') + 'f);\\ndelay(100);\\n#END\\n'
      );
    `,
    gy87_update:    "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_gy87_' + v + '.update();\\n';",
    gy87_calibrate: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_gy87_' + v + '.calibrate(' + (block.getFieldValue('SAMPLES') || '500') + ');\\n';",
    gy87_accel:    "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); var map = { X:'accelX', Y:'accelY', Z:'accelZ' }; return ['_gy87_' + v + '.' + map[block.getFieldValue('AXIS')] + '()', 0];",
    gy87_gyro:     "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); var map = { X:'gyroX', Y:'gyroY', Z:'gyroZ' }; return ['_gy87_' + v + '.' + map[block.getFieldValue('AXIS')] + '()', 0];",
    gy87_attitude: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); var map = { PITCH:'pitch', ROLL:'roll', YAW:'yaw' }; return ['_gy87_' + v + '.' + map[block.getFieldValue('AXIS')] + '()', 0];",
    gy87_heading:  "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_gy87_' + v + '.heading()', 0];",
    gy87_mpu_temp: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_gy87_' + v + '.mpuTemp()', 0];",
    gy87_bmp:      "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); var map = { TEMP:'bmpTemperature', PRES:'bmpPressure', ALT:'bmpAltitude' }; return ['_gy87_' + v + '.' + map[block.getFieldValue('MEAS')] + '()', 0];",
    gy87_set_range: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var sensor = block.getFieldValue('SENSOR');
      var range = block.getFieldValue('RANGE');
      var fn = sensor === 'ACCEL' ? 'setAccelRange((AccelRange)' : 'setGyroRange((GyroRange)';
      return '_gy87_' + v + '.' + fn + range + ');\\n';
    `,
  },
})
