var ALGO_OPTS = [
  ['Face Recognition',   'ALGO_FACE_RECOGNITION'],
  ['Object Tracking',    'ALGO_OBJECT_TRACKING'],
  ['Object Recognition', 'ALGO_OBJECT_RECOGNITION'],
  ['Line Tracking',      'ALGO_LINE_TRACKING'],
  ['Color Recognition',  'ALGO_COLOR_RECOGNITION'],
  ['Tag Recognition',    'ALGO_TAG_RECOGNITION'],
];

lotus.register({
  toolbox: { name: 'HuskyLens', color: '#AB47BC' },
  blocks: [
    {
      type: 'huskylens_setup_i2c',
      message0: '%1 Setup HuskyLens I2C Algorithm %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'field_dropdown', name: 'ALGO', options: ALGO_OPTS },
      ],
      previousStatement: null, nextStatement: null, colour: '#AB47BC',
    },
    {
      type: 'huskylens_setup_uart',
      message0: '%1 Setup HuskyLens UART baud %2 Algorithm %3',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'field_dropdown', name: 'BAUD', options: [['9600','9600'],['19200','19200'],['38400','38400'],['57600','57600'],['115200','115200']] },
        { type: 'field_dropdown', name: 'ALGO', options: ALGO_OPTS },
      ],
      previousStatement: null, nextStatement: null, colour: '#AB47BC',
    },
    {
      type: 'huskylens_switch_algo',
      message0: '%1 Switch Algorithm %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'field_dropdown', name: 'ALGO', options: ALGO_OPTS },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#AB47BC',
    },
    {
      type: 'huskylens_request',
      message0: '%1 Request %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'field_dropdown', name: 'REQTYPE', options: [['All','ALL'],['Blocks','BLOCKS'],['Arrows','ARROWS'],['Learned','LEARNED']] },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#AB47BC',
    },
    {
      type: 'huskylens_request_id',
      message0: '%1 Request by ID %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'input_value', name: 'ID', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#AB47BC',
    },
    { type: 'huskylens_block_count', message0: '%1 Block count', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' }], output: 'Number', colour: '#AB47BC' },
    { type: 'huskylens_arrow_count', message0: '%1 Arrow count', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' }], output: 'Number', colour: '#AB47BC' },
    {
      type: 'huskylens_get_block',
      message0: '%1 Block # %2 %3',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'input_value', name: 'IDX', check: 'Number' },
        { type: 'field_dropdown', name: 'PROP', options: [['X','x'],['Y','y'],['W','w'],['H','h'],['ID','id']] },
      ],
      inputsInline: true, output: 'Number', colour: '#AB47BC',
    },
    {
      type: 'huskylens_get_arrow',
      message0: '%1 Arrow # %2 %3',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'input_value', name: 'IDX', check: 'Number' },
        { type: 'field_dropdown', name: 'PROP', options: [['X Tail','xTail'],['Y Tail','yTail'],['X Head','xHead'],['Y Head','yHead'],['ID','id']] },
      ],
      inputsInline: true, output: 'Number', colour: '#AB47BC',
    },
    {
      type: 'huskylens_is_learned',
      message0: '%1 Is Learned? ID %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'CAM1' },
        { type: 'input_value', name: 'ID', check: 'Number' },
      ],
      inputsInline: true, output: 'Boolean', colour: '#AB47BC',
    },
  ],
  generators: {
    huskylens_setup_i2c: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var algo = block.getFieldValue('ALGO');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "LotusHuskyLens.h"\\n#END\\n' +
        '#VARIABLE\\nLotusHuskyLens _hl_' + v + ';\\nbool _hl_' + v + '_ok = false;\\n#END\\n' +
        '#SETUP\\n_hl_' + v + '_ok = _hl_' + v + '.begin(Wire);\\n' +
        'if (_hl_' + v + '_ok) _hl_' + v + '.switchAlgorithm(' + algo + ');\\ndelay(200);\\n#END\\n'
      );
    `,
    huskylens_setup_uart: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var baud = block.getFieldValue('BAUD') || '9600';
      var algo = block.getFieldValue('ALGO');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "LotusHuskyLens.h"\\n#END\\n' +
        '#VARIABLE\\nLotusHuskyLens _hl_' + v + ';\\nbool _hl_' + v + '_ok = false;\\n#END\\n' +
        '#SETUP\\nSerial.begin(' + baud + ');\\n_hl_' + v + '_ok = _hl_' + v + '.begin(Serial);\\n' +
        'if (_hl_' + v + '_ok) _hl_' + v + '.switchAlgorithm(' + algo + ');\\ndelay(200);\\n#END\\n'
      );
    `,
    huskylens_switch_algo: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_hl_' + v + '.switchAlgorithm(' + block.getFieldValue('ALGO') + ');\\ndelay(200);\\n';",
    huskylens_request: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var map = { ALL: '.request()', BLOCKS: '.requestBlocks()', ARROWS: '.requestArrows()', LEARNED: '.requestLearned()' };
      return '_hl_' + v + (map[block.getFieldValue('REQTYPE')] || '.request()') + ';\\n';
    `,
    huskylens_request_id: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var id = generator.valueToCode(block, 'ID', 0) || '1';
      return '_hl_' + v + '.requestByID(' + id + ');\\n';
    `,
    huskylens_block_count: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_hl_' + v + '.blockCount()', 0];",
    huskylens_arrow_count: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_hl_' + v + '.arrowCount()', 0];",
    huskylens_get_block: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var idx = generator.valueToCode(block, 'IDX', 0) || '0';
      return ['_hl_' + v + '.getBlock(' + idx + ').' + block.getFieldValue('PROP'), 0];
    `,
    huskylens_get_arrow: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var idx = generator.valueToCode(block, 'IDX', 0) || '0';
      return ['_hl_' + v + '.getArrow(' + idx + ').' + block.getFieldValue('PROP'), 0];
    `,
    huskylens_is_learned: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var id = generator.valueToCode(block, 'ID', 0) || '1';
      return ['_hl_' + v + '.isLearned(' + id + ')', 0];
    `,
  },
})
