var JOINT_OPTS = [['Joint 0 (Base/Shoulder)','0'],['Joint 1 (Shoulder/Elbow)','1'],['Joint 2 (Elbow/Wrist)','2'],['Joint 3 (Wrist)','3']];

lotus.register({
  toolbox: { name: 'Arm IK', color: '#43A047' },
  blocks: [
    {
      type: 'armik_setup',
      message0: '%1 Setup Arm IK %2  L1 %3 L2 %4 L3 %5 L4 %6 mm',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'field_dropdown', name: 'DOF', options: [['2DOF','2'],['3DOF','3'],['4DOF','4']] },
        { type: 'field_number', name: 'L1', value: 100, min: 1, max: 2000 },
        { type: 'field_number', name: 'L2', value: 100, min: 1, max: 2000 },
        { type: 'field_number', name: 'L3', value: 80,  min: 0, max: 2000 },
        { type: 'field_number', name: 'L4', value: 60,  min: 0, max: 2000 },
      ],
      previousStatement: null, nextStatement: null, colour: '#43A047',
    },
    {
      type: 'armik_attach_pca',
      message0: '%1 Attach %2  PCA %3 ch %4  min %5 max %6 home %7 offset %8 reverse %9',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'field_dropdown', name: 'JOINT',   options: JOINT_OPTS },
        { type: 'field_variable', name: 'PCA',     variable: 'PCA1' },
        { type: 'field_number',   name: 'CH',      value: 0, min: 0, max: 15 },
        { type: 'field_number',   name: 'MIN',    value: 0,   min: 0, max: 180 },
        { type: 'field_number',   name: 'MAX',    value: 180, min: 0, max: 180 },
        { type: 'field_number',   name: 'HOME',   value: 90,  min: 0, max: 180 },
        { type: 'field_number',   name: 'OFFSET', value: 0, min: -90, max: 90 },
        { type: 'field_dropdown', name: 'REV',    options: [['No','0'],['Yes','1']] },
      ],
      previousStatement: null, nextStatement: null, colour: '#43A047',
    },
    {
      type: 'armik_attach_servo',
      message0: '%1 Attach %2  Servo pin %3  min %4 max %5 home %6 offset %7 reverse %8',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'field_dropdown', name: 'JOINT',   options: JOINT_OPTS },
        { type: 'field_number',   name: 'PIN',    value: 9, min: 0, max: 50 },
        { type: 'field_number',   name: 'MIN',    value: 0,   min: 0, max: 180 },
        { type: 'field_number',   name: 'MAX',    value: 180, min: 0, max: 180 },
        { type: 'field_number',   name: 'HOME',   value: 90,  min: 0, max: 180 },
        { type: 'field_number',   name: 'OFFSET', value: 0, min: -90, max: 90 },
        { type: 'field_dropdown', name: 'REV',    options: [['No','0'],['Yes','1']] },
      ],
      previousStatement: null, nextStatement: null, colour: '#43A047',
    },
    {
      type: 'armik_move_xy',
      message0: '%1 Move To X %2 Y %3 Wrist Ï† %4 mm / Â°',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'input_value', name: 'X',   check: 'Number' },
        { type: 'input_value', name: 'Y',   check: 'Number' },
        { type: 'input_value', name: 'PHI', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#43A047',
    },
    {
      type: 'armik_move_xyz',
      message0: '%1 Move To 3D X %2 Y %3 Z %4 Wrist Ï† %5 mm / Â°',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'input_value', name: 'X',   check: 'Number' },
        { type: 'input_value', name: 'Y',   check: 'Number' },
        { type: 'input_value', name: 'Z',   check: 'Number' },
        { type: 'input_value', name: 'PHI', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#43A047',
    },
    {
      type: 'armik_set_joint',
      message0: '%1 Set Joint %2 angle %3 Â°',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'field_dropdown', name: 'JOINT', options: JOINT_OPTS },
        { type: 'input_value', name: 'ANGLE', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#43A047',
    },
    {
      type: 'armik_get_joint',
      message0: '%1 Get Joint %2 angle Â°',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'field_dropdown', name: 'JOINT', options: JOINT_OPTS },
      ],
      inputsInline: true, output: 'Number', colour: '#43A047',
    },
    {
      type: 'armik_reachable',
      message0: '%1 Is Reachable? X %2 Y %3 mm',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' },
        { type: 'input_value', name: 'X', check: 'Number' },
        { type: 'input_value', name: 'Y', check: 'Number' },
      ],
      inputsInline: true, output: 'Boolean', colour: '#43A047',
    },
    { type: 'armik_home', message0: '%1 Move Home', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'ARM1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#43A047' },
  ],
  generators: {
    armik_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var dof = block.getFieldValue('DOF') || '3';
      var lens = ['L1','L2','L3','L4'].map(function(k){ return block.getFieldValue(k); });
      return (
        '#EXTINC\\n#include <math.h>\\n#END\\n' +
        '#EXTINC\\n#if defined(ARDUINO_ARCH_ESP32) || defined(ESP32)\\n  #include <ESP32Servo.h>\\n#else\\n  #include <Servo.h>\\n#endif\\n#END\\n' +
        '#EXTINC\\n#include "LotusArmIK.h"\\n#END\\n' +
        '#VARIABLE\\nLotusArmIK _arm_' + v + ';\\nbool _arm_' + v + '_ok = false;\\n#END\\n' +
        '#SETUP\\n_arm_' + v + '.begin((ArmDOF)' + dof + ', ' + lens[0] + '.0f, ' + lens[1] + '.0f, ' + lens[2] + '.0f, ' + lens[3] + '.0f);\\n#END\\n'
      );
    `,
    armik_attach_pca: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var pca = generator.nameDB_.getName(block.getFieldValue('PCA'), 'VARIABLE');
      var joint = block.getFieldValue('JOINT'), ch = block.getFieldValue('CH');
      var mn = block.getFieldValue('MIN'), mx = block.getFieldValue('MAX');
      var home = block.getFieldValue('HOME'), off = block.getFieldValue('OFFSET');
      var rev = block.getFieldValue('REV');
      return (
        '#EXTINC\\n#include "LotusPCA9685.h"\\n#END\\n' +
        '#SETUP\\n_arm_' + v + '.attachPCA9685(&_pca_' + pca + ');\\n' +
        '_arm_' + v + '.attachJointPCA(' + joint + ', ' + ch + ', ' + mn + '.0f, ' + mx + '.0f, ' + home + '.0f, ' + off + '.0f, ' + rev + ' == 1);\\n#END\\n'
      );
    `,
    armik_attach_servo: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var joint = block.getFieldValue('JOINT'), pin = block.getFieldValue('PIN');
      var mn = block.getFieldValue('MIN'), mx = block.getFieldValue('MAX');
      var home = block.getFieldValue('HOME'), off = block.getFieldValue('OFFSET');
      var rev = block.getFieldValue('REV');
      return (
        '#SETUP\\n_arm_' + v + '.attachJointServo(' + joint + ', ' + pin + ', ' + mn + '.0f, ' + mx + '.0f, ' + home + '.0f, ' + off + '.0f, ' + rev + ' == 1);\\n#END\\n'
      );
    `,
    armik_move_xy: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var x = generator.valueToCode(block, 'X', 0) || '100';
      var y = generator.valueToCode(block, 'Y', 0) || '0';
      var p = generator.valueToCode(block, 'PHI', 0) || '0';
      return '_arm_' + v + '_ok = _arm_' + v + '.moveTo((float)(' + x + '), (float)(' + y + '), (float)(' + p + '));\\n';
    `,
    armik_move_xyz: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var x = generator.valueToCode(block, 'X', 0) || '100';
      var y = generator.valueToCode(block, 'Y', 0) || '0';
      var z = generator.valueToCode(block, 'Z', 0) || '100';
      var p = generator.valueToCode(block, 'PHI', 0) || '0';
      return '_arm_' + v + '_ok = _arm_' + v + '.moveTo((float)(' + x + '), (float)(' + y + '), (float)(' + z + '), (float)(' + p + '));\\n';
    `,
    armik_set_joint: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var j = block.getFieldValue('JOINT');
      var a = generator.valueToCode(block, 'ANGLE', 0) || '90';
      return '_arm_' + v + '.setJointAngle(' + j + ', (float)(' + a + '));\\n';
    `,
    armik_get_joint: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_arm_' + v + '.getJointAngle(' + block.getFieldValue('JOINT') + ')', 0];",
    armik_reachable: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var x = generator.valueToCode(block, 'X', 0) || '100';
      var y = generator.valueToCode(block, 'Y', 0) || '0';
      return ['_arm_' + v + '.isReachable((float)(' + x + '), (float)(' + y + '))', 0];
    `,
    armik_home: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_arm_' + v + '.moveHome();\\n';",
  },
})
