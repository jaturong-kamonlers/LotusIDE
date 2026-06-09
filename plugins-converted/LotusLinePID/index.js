// LinePID v2 — supports four sensor topologies (Digital, Analog, QTR-8A/RC,
// CD74HC4067 mux). The JSON block defs here drop the original toolbox's
// dynamic show/hide of pin rows (Lotus' JSON schema is static); users see
// 16 pin fields and just edit the ones they need, matching how other plugins
// in this set work.

function countOpts(min, max) {
  var o = [];
  for (var i = min; i <= max; i++) o.push([i + '', i + '']);
  return o;
}

function pinFields(prefix, n, startValue) {
  var fields = [];
  for (var i = 0; i < n; i++) {
    fields.push({ type: 'field_number', name: 'P' + i, value: startValue + i, min: 0, max: 50, precision: 1 });
  }
  return fields;
}

function pinMessage(prefix, n, perRow) {
  var msg = '';
  var idx = 1;
  for (var i = 0; i < n; i++) {
    msg += prefix + idx + ': %' + (i + 1) + ' ';
    if ((i + 1) % perRow === 0) msg += '\\n';
    idx++;
  }
  return msg;
}

lotus.register({
  toolbox: { name: 'LinePID', color: '#81C784' },
  blocks: [
    {
      type: 'linepid_setup_digital',
      message0: '%1 Setup LinePID Digital sensors %2 D1:%3 D2:%4 D3:%5 D4:%6 D5:%7 D6:%8 D7:%9 D8:%10 D9:%11 D10:%12 D11:%13 D12:%14 D13:%15 D14:%16 D15:%17 D16:%18',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'field_dropdown', name: 'COUNT', options: countOpts(1, 16) },
      ].concat(pinFields('D', 16, 2)),
      previousStatement: null, nextStatement: null, colour: '#81C784',
      tooltip: 'Setup Digital sensors (0/1). Only the first N pins (N=COUNT) are wired.',
    },
    {
      type: 'linepid_setup_analog',
      message0: '%1 Setup LinePID Analog sensors %2 A1:%3 A2:%4 A3:%5 A4:%6 A5:%7 A6:%8 A7:%9 A8:%10',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'field_dropdown', name: 'COUNT', options: countOpts(1, 8) },
      ].concat(pinFields('A', 8, 14)),
      previousStatement: null, nextStatement: null, colour: '#81C784',
      tooltip: 'Setup Analog sensors (0-1023). Edit only the first N pins.',
    },
    {
      type: 'linepid_setup_qtr',
      message0: '%1 Setup LinePID QTR %2 boards %3 RC timeout %4 μs S1:%5 S2:%6 S3:%7 S4:%8 S5:%9 S6:%10 S7:%11 S8:%12 S9:%13 S10:%14 S11:%15 S12:%16 S13:%17 S14:%18 S15:%19 S16:%20',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'field_dropdown', name: 'QTRTYPE', options: [['QTR-8A (Analog)','QTR_A'],['QTR-8RC (Digital)','QTR_RC']] },
        { type: 'field_dropdown', name: 'BOARDS',  options: [['1 board (8 sensors)','8'],['2 boards (16 sensors)','16']] },
        { type: 'field_number',   name: 'RC_TIMEOUT', value: 2500, min: 500, max: 10000 },
      ].concat(pinFields('S', 16, 2)),
      previousStatement: null, nextStatement: null, colour: '#81C784',
      tooltip: 'QTR-8A (Analog) or QTR-8RC (RC Timing). Fill the first BOARDS×8 pins.',
    },
    {
      type: 'linepid_setup_mux',
      message0: '%1 Setup LinePID CD74HC4067 S0 %2 S1 %3 S2 %4 S3 %5 SIG (Analog) %6 EN %7',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'field_number', name: 'S0',  value: 2,  min: 0, max: 50 },
        { type: 'field_number', name: 'S1',  value: 3,  min: 0, max: 50 },
        { type: 'field_number', name: 'S2',  value: 4,  min: 0, max: 50 },
        { type: 'field_number', name: 'S3',  value: 5,  min: 0, max: 50 },
        { type: 'field_number', name: 'SIG', value: 14, min: 0, max: 50 },
        { type: 'field_number', name: 'EN',  value: 255, min: 0, max: 255, precision: 1 },
      ],
      previousStatement: null, nextStatement: null, colour: '#81C784',
      tooltip: 'CD74HC4067 16-ch analog mux. EN=255 means unused.',
    },
    { type: 'linepid_read',       message0: '%1 Read Sensors',     args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784' },
    { type: 'linepid_cal_start',  message0: '%1 Calibrate Start',  args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784' },
    { type: 'linepid_cal_sample', message0: '%1 Calibrate Sample', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784' },
    { type: 'linepid_cal_end',    message0: '%1 Calibrate End',    args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784' },
    { type: 'linepid_position',   message0: '%1 Position (0.0-1.0)', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], output: 'Number',  colour: '#81C784' },
    { type: 'linepid_online',     message0: '%1 On Line?',         args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], output: 'Boolean', colour: '#81C784' },
    {
      type: 'linepid_set_gains',
      message0: '%1 Set PID Kp %2 Ki %3 Kd %4',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'input_value', name: 'KP', check: 'Number' },
        { type: 'input_value', name: 'KI', check: 'Number' },
        { type: 'input_value', name: 'KD', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784',
    },
    {
      type: 'linepid_set_setpoint',
      message0: '%1 Set Setpoint %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'input_value', name: 'SP', check: 'Number' },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784',
    },
    { type: 'linepid_compute', message0: '%1 Compute PID', args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784' },
    { type: 'linepid_output',  message0: '%1 PID Output',  args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], output: 'Number', colour: '#81C784' },
    { type: 'linepid_reset',   message0: '%1 Reset PID',   args0: [{ type: 'field_variable', name: 'INSTANCE', variable: 'PID1' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#81C784' },
    {
      type: 'linepid_raw',
      message0: '%1 Raw Sensor %2',
      args0: [
        { type: 'field_variable', name: 'INSTANCE', variable: 'PID1' },
        { type: 'field_number', name: 'IDX', value: 1, min: 1, max: 16, precision: 1 },
      ],
      inputsInline: true, output: 'Number', colour: '#81C784',
    },
  ],
  generators: {
    linepid_setup_digital: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var n = parseInt(block.getFieldValue('COUNT')) || 4;
      var pins = [];
      for (var i = 0; i < n; i++) pins.push(block.getFieldValue('P' + i) || String(i + 2));
      return (
        '#EXTINC\\n#include "LotusLinePID.h"\\n#END\\n' +
        '#VARIABLE\\nLotusLinePID _pid_' + v + ';\\n' +
        'float _pid_' + v + '_pos = 0.5;\\nfloat _pid_' + v + '_output = 0.0;\\n' +
        'bool _pid_' + v + '_online = false;\\n' +
        'uint8_t _pid_' + v + '_pins[' + n + '] = {' + pins.join(', ') + '};\\n#END\\n' +
        '#SETUP\\n_pid_' + v + '.beginDigital(_pid_' + v + '_pins, ' + n + ');\\n' +
        '_pid_' + v + '.setSetpoint(0.5);\\n#END\\n'
      );
    `,
    linepid_setup_analog: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var n = parseInt(block.getFieldValue('COUNT')) || 4;
      var pins = [];
      for (var i = 0; i < n; i++) pins.push(block.getFieldValue('P' + i) || String(14 + i));
      return (
        '#EXTINC\\n#include "LotusLinePID.h"\\n#END\\n' +
        '#VARIABLE\\nLotusLinePID _pid_' + v + ';\\n' +
        'float _pid_' + v + '_pos = 0.5;\\nfloat _pid_' + v + '_output = 0.0;\\n' +
        'bool _pid_' + v + '_online = false;\\n' +
        'uint8_t _pid_' + v + '_pins[' + n + '] = {' + pins.join(', ') + '};\\n#END\\n' +
        '#SETUP\\n_pid_' + v + '.beginAnalog(_pid_' + v + '_pins, ' + n + ');\\n' +
        '_pid_' + v + '.setSetpoint(0.5);\\n#END\\n'
      );
    `,
    linepid_setup_qtr: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var qtype = block.getFieldValue('QTRTYPE');
      var n = parseInt(block.getFieldValue('BOARDS')) || 8;
      var timeout = block.getFieldValue('RC_TIMEOUT') || '2500';
      var pins = [];
      for (var i = 0; i < n; i++) pins.push(block.getFieldValue('P' + i) || String(i + 2));
      var begin = (qtype === 'QTR_RC')
        ? '_pid_' + v + '.beginQTR_RC(_pid_' + v + '_pins, ' + n + ', ' + timeout + ');'
        : '_pid_' + v + '.beginQTR_A(_pid_' + v + '_pins, ' + n + ');';
      return (
        '#EXTINC\\n#include "LotusLinePID.h"\\n#END\\n' +
        '#VARIABLE\\nLotusLinePID _pid_' + v + ';\\n' +
        'float _pid_' + v + '_pos = 0.5;\\nfloat _pid_' + v + '_output = 0.0;\\n' +
        'bool _pid_' + v + '_online = false;\\n' +
        'uint8_t _pid_' + v + '_pins[' + n + '] = {' + pins.join(', ') + '};\\n#END\\n' +
        '#SETUP\\n' + begin + '\\n_pid_' + v + '.setSetpoint(0.5);\\n#END\\n'
      );
    `,
    linepid_setup_mux: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var s = ['S0','S1','S2','S3','SIG','EN'].map(function(k){ return block.getFieldValue(k); });
      return (
        '#EXTINC\\n#include "LotusLinePID.h"\\n#END\\n' +
        '#VARIABLE\\nLotusLinePID _pid_' + v + ';\\n' +
        'float _pid_' + v + '_pos = 0.5;\\nfloat _pid_' + v + '_output = 0.0;\\n' +
        'bool _pid_' + v + '_online = false;\\n#END\\n' +
        '#SETUP\\n_pid_' + v + '.beginMux4067(' + s.join(', ') + ');\\n' +
        '_pid_' + v + '.setSetpoint(0.5);\\n#END\\n'
      );
    `,
    linepid_read: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      return '_pid_' + v + '.readSensors();\\n_pid_' + v + '_pos = _pid_' + v + '.getPosition();\\n_pid_' + v + '_online = _pid_' + v + '.onLine();\\n';
    `,
    linepid_cal_start:  "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pid_' + v + '.calibrateStart();\\n';",
    linepid_cal_sample: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pid_' + v + '.calibrateSample();\\n';",
    linepid_cal_end:    "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pid_' + v + '.calibrateEnd();\\n';",
    linepid_position:   "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_pid_' + v + '_pos', 0];",
    linepid_online:     "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_pid_' + v + '_online', 0];",
    linepid_output:     "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return ['_pid_' + v + '_output', 0];",
    linepid_set_gains: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var kp = generator.valueToCode(block, 'KP', 0) || '1.0';
      var ki = generator.valueToCode(block, 'KI', 0) || '0.0';
      var kd = generator.valueToCode(block, 'KD', 0) || '0.0';
      return '_pid_' + v + '.setGains(' + kp + ', ' + ki + ', ' + kd + ');\\n';
    `,
    linepid_set_setpoint: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var sp = generator.valueToCode(block, 'SP', 0) || '0.5';
      return '_pid_' + v + '.setSetpoint(' + sp + ');\\n';
    `,
    linepid_compute: "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pid_' + v + '_output = _pid_' + v + '.compute();\\n';",
    linepid_reset:   "var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE'); return '_pid_' + v + '.resetPID();\\n';",
    linepid_raw: `
      var v = generator.nameDB_.getName(block.getFieldValue('INSTANCE'), 'VARIABLE');
      var idx = parseInt(block.getFieldValue('IDX')) - 1;
      return ['_pid_' + v + '.getRaw(' + idx + ')', 0];
    `,
  },
})
