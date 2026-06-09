// Servo motor plugin for Lotus IDE.
//
// Ports the KBIDE LotusServo blocks to the new manifest+register API. The
// generator output keeps the original #EXTINC / #VARIABLE / #SETUP markers
// since LotusIDE's javascriptGenerator.finish() already extracts them — that
// gives us platform-conditional includes (Servo.h vs ESP32Servo.h) without
// duplicating the dispatch in JS.

lotus.register({
  toolbox: {
    name: 'Servo',
    color: '#FFB74D',
  },
  blocks: [
    {
      type: 'lotus_servo_setup',
      message0: '%1 Setup Servo pin %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'SRV1' },
        { type: 'field_number', name: 'PIN', value: 9, min: 0, max: 39, precision: 1 },
      ],
      message1: 'min %1 μs  max %2 μs',
      args1: [
        { type: 'field_number', name: 'MIN_US', value: 544, min: 0, max: 2400, precision: 1 },
        { type: 'field_number', name: 'MAX_US', value: 2400, min: 0, max: 2400, precision: 1 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#FFB74D',
      tooltip: 'Set up Servo on the given PWM pin and pulse width range (place in Setup).',
    },
    {
      type: 'lotus_servo_angle',
      message0: '%1 Servo angle %2 °',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'SRV1' },
        { type: 'input_value', name: 'ANGLE', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: '#FFB74D',
      tooltip: 'Rotate Servo to the given angle (0 - 180°)',
    },
    {
      type: 'lotus_servo_microseconds',
      message0: '%1 Servo pulse %2 μs',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'SRV1' },
        { type: 'input_value', name: 'US', check: 'Number' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: '#FFB74D',
      tooltip: 'Send pulse width directly to Servo (microseconds, typically 1000-2000)',
    },
    {
      type: 'lotus_servo_detach',
      message0: '%1 Servo detach',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'SRV1' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: '#FFB74D',
      tooltip: 'Stop sending PWM signal so the Servo can spin freely',
    },
  ],
  generators: {
    lotus_servo_setup: `
      var instance = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var pin    = block.getFieldValue('PIN');
      var minUs  = block.getFieldValue('MIN_US');
      var maxUs  = block.getFieldValue('MAX_US');
      // Conditional include so the same plugin works for AVR and ESP32 boards.
      var code = '';
      code += '#EXTINC\\n';
      code += '#if defined(ARDUINO_ARCH_ESP32) || defined(ESP32)\\n';
      code += '  #include <ESP32Servo.h>\\n';
      code += '#else\\n';
      code += '  #include <Servo.h>\\n';
      code += '#endif\\n';
      code += '#END\\n';
      code += '#VARIABLE\\n';
      code += 'Servo _srv_' + instance + ';\\n';
      code += '#END\\n';
      code += '#SETUP\\n';
      code += '_srv_' + instance + '.attach(' + pin + ', ' + minUs + ', ' + maxUs + ');\\n';
      code += '_srv_' + instance + '.write(0);\\n';
      code += 'delay(20);\\n';
      code += '#END\\n';
      return code;
    `,
    lotus_servo_angle: `
      var instance = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var angle = generator.valueToCode(block, 'ANGLE', 0) || '0';
      return '_srv_' + instance + '.write(constrain(' + angle + ', 0, 180));\\n';
    `,
    lotus_servo_microseconds: `
      var instance = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var us = generator.valueToCode(block, 'US', 0) || '1500';
      return '_srv_' + instance + '.writeMicroseconds(' + us + ');\\n';
    `,
    lotus_servo_detach: `
      var instance = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_srv_' + instance + '.detach();\\n';
    `,
  },
})
