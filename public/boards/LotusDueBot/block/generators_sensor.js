module.exports = function(Blockly){
  'use strict';

Blockly.JavaScript['sw1_press'] = function(block) {
  return 'waitButton(' + block.getFieldValue('SW') + ');\n';
};

Blockly.JavaScript['analog_sensor'] = function(block) {
  return [`analogRead(${block.getFieldValue('pin')})`, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['digital_sensor'] = function(block) {
  var p = block.getFieldValue('pin');
  return [`(digitalRead(${p})==1)?1:0`, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['nano_beep'] = function(block) {
  return 'beep();\n';
};

Blockly.JavaScript['nano_beep_custom'] = function(block) {
  var f = block.getFieldValue('FREQUENCY');
  var d = block.getFieldValue('DURATION');
  return `tone(_BZ, ${f}, ${d});\n`;
};

Blockly.JavaScript['knob_read'] = function(block) {
  return ['analogRead(A11)', Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['encoder_init'] = function(block) {
  return 'encoder_init(' + block.getFieldValue('MASK') + ');\n';
};

Blockly.JavaScript['encoder_read'] = function(block) {
  return ['encoder_read(' + block.getFieldValue('WHICH') + ')', Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['encoder_reset'] = function(block) {
  return 'encoder_reset(' + block.getFieldValue('WHICH') + ');\n';
};

Blockly.JavaScript['encoder_drive'] = function(block) {
  var dir   = block.getFieldValue('DIR');
  var ticks = Blockly.JavaScript.valueToCode(block, 'TICKS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  return 'encoder_drive(' + dir + ', ' + ticks + ', ' + speed + ');\n';
};

Blockly.JavaScript['encoder_spin'] = function(block) {
  var dir   = block.getFieldValue('DIR');
  var ticks = Blockly.JavaScript.valueToCode(block, 'TICKS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  return 'encoder_spin(' + dir + ', ' + ticks + ', ' + speed + ');\n';
};

Blockly.JavaScript['map_func'] = function(block) {
  var v1 = Blockly.JavaScript.valueToCode(block, 'V1', Blockly.JavaScript.ORDER_ATOMIC);
  var v2 = block.getFieldValue('V2');
  var v3 = block.getFieldValue('V3');
  var v4 = block.getFieldValue('V4');
  var v5 = block.getFieldValue('V5');
  return [`map_func(${v1}, ${v2}, ${v3}, ${v4}, ${v5})`, Blockly.JavaScript.ORDER_ATOMIC];
};

// ----- Serial -----
function _serialName(port) {
  if (port === '0') return 'Serial';
  if (port === '1') return 'Serial1';
  if (port === '2') return 'Serial2';
  return 'Serial';
}

Blockly.JavaScript['serial_begin'] = function(block) {
  var s = _serialName(block.getFieldValue('PORT'));
  var b = block.getFieldValue('BAUD');
  return `${s}.begin(${b});\n`;
};

Blockly.JavaScript['serial_print'] = function(block) {
  var s = _serialName(block.getFieldValue('PORT'));
  var txt = (block.getFieldValue('TXT') || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
  var nl  = block.getFieldValue('NL') === 'TRUE' ? 'ln' : '';
  return `${s}.print${nl}(F("${txt}"));\n`;
};

Blockly.JavaScript['serial_print_number'] = function(block) {
  var s = _serialName(block.getFieldValue('PORT'));
  var n = Blockly.JavaScript.valueToCode(block, 'N', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var nl  = block.getFieldValue('NL') === 'TRUE' ? 'ln' : '';
  return `${s}.print${nl}(${n});\n`;
};

// ----- I2C -----
Blockly.JavaScript['i2c_begin'] = function(block) {
  return 'Wire.begin();\n';
};

Blockly.JavaScript['i2c_write_byte'] = function(block) {
  var a = Blockly.JavaScript.valueToCode(block, 'ADDR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var r = Blockly.JavaScript.valueToCode(block, 'REG',  Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var v = Blockly.JavaScript.valueToCode(block, 'VAL',  Blockly.JavaScript.ORDER_ATOMIC) || '0';
  return `Wire.beginTransmission(${a}); Wire.write(${r}); Wire.write(${v}); Wire.endTransmission();\n`;
};

Blockly.JavaScript['i2c_read_byte'] = function(block) {
  var a = Blockly.JavaScript.valueToCode(block, 'ADDR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var r = Blockly.JavaScript.valueToCode(block, 'REG',  Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var code = `(Wire.beginTransmission(${a}), Wire.write(${r}), Wire.endTransmission(false), Wire.requestFrom((int)${a}, 1), Wire.read())`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

// MPU6050 / HMC5883 generators are NOT defined here -- use KBIDE plugins.

// ----- SD -----
function _ensureSdInclude() {
  return ''
    + '#EXTINC\n'
    + '#include <SD.h>\n'
    + '#END\n';
}

Blockly.JavaScript['sd_begin'] = function(block) {
  // Returns 1 if SD.begin(SD_CS) succeeds.  Use it as the value of an `if`.
  return [_ensureSdInclude() + 'SD.begin(SD_CS)', Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['sd_write_line'] = function(block) {
  var fn   = (block.getFieldValue('FN') || 'log.txt')
                .replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  var line = Blockly.JavaScript.valueToCode(block, 'LINE', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  return _ensureSdInclude()
       + `{ File _f = SD.open("${fn}", FILE_WRITE); if (_f) { _f.println(${line}); _f.close(); } }\n`;
};

};
