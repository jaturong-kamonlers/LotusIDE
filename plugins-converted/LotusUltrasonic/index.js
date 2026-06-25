lotus.register({
  toolbox: { name: 'Ultrasonic', color: '#00BCD4' },
  blocks: [
    {
      type: 'ultrasonic_setup',
      message0: '%1 Setup Ultrasonic TRIG %2 ECHO %3',
      args0: [
        { type: 'field_variable', name: 'instance', variable: 'US1' },
        { type: 'field_number', name: 'TRIG', value: 9,  min: 0, max: 50, precision: 1 },
        { type: 'field_number', name: 'ECHO', value: 10, min: 0, max: 50, precision: 1 },
      ],
      inputsInline: true,
      previousStatement: null, nextStatement: null,
      colour: '#00BCD4',
      tooltip: 'Wire HC-SR04 TRIG and ECHO pins (place in Setup)',
    },
    { type: 'ultrasonic_read_distance_cm', message0: '%1 Distance (cm)', args0: [{ type: 'field_variable', name: 'instance', variable: 'US1' }], output: 'Number', colour: '#00BCD4', tooltip: 'Distance in centimeters (~max 400cm)' },
    { type: 'ultrasonic_read_distance_mm', message0: '%1 Distance (mm)', args0: [{ type: 'field_variable', name: 'instance', variable: 'US1' }], output: 'Number', colour: '#00BCD4', tooltip: 'Distance in millimeters' },
    {
      type: 'ultrasonic_detected',
      message0: '%1 Detected within %2 cm',
      args0: [
        { type: 'field_variable', name: 'instance', variable: 'US1' },
        {
          type: 'input_value', name: 'DIST', check: 'Number',
          shadow: { type: 'math_number', fields: { NUM: 30 } },
        },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: '#00BCD4',
      tooltip: 'True when an object is within the given range',
    },
  ],
  generators: {
    ultrasonic_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE');
      var trig = block.getFieldValue('TRIG') || 9;
      var echo = block.getFieldValue('ECHO') || 10;
      return (
        '#EXTINC\\n#include "Ultrasonic.h"\\n#END\\n' +
        '#VARIABLE\\nULTRASONIC ' + v + ';\\n#END\\n' +
        '#SETUP\\n' + v + '.begin(' + trig + ', ' + echo + ');\\n#END\\n'
      );
    `,
    ultrasonic_read_distance_cm: "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return [v + '.read_distance_cm()', 0];",
    ultrasonic_read_distance_mm: "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return [v + '.read_distance_mm()', 0];",
    ultrasonic_detected: `
      var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE');
      var d = generator.valueToCode(block, 'DIST', 0) || '30';
      return ['(' + v + '.read_distance_cm() <= ' + d + ' && ' + v + '.read_distance_cm() > 0)', 0];
    `,
  },
})
