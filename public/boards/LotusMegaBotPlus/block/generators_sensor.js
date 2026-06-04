module.exports = function(Blockly){
  'use strict';

Blockly.JavaScript['sw1_press'] = function(block) {
  var sw = block.getFieldValue('SW');
  var code = 'waitButton(' + sw + ');\n';
  return code;
};

Blockly.JavaScript['analog_sensor'] = function(block) {
  var value_pin = block.getFieldValue('pin');
  var code = `analogRead(${value_pin})`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};


Blockly.JavaScript['digital_sensor'] = function(block) {
  var value_pin = block.getFieldValue('pin');
  var code = `(digitalRead(${value_pin})==1)?1:0`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['nano_beep'] = function(block) {
  var code = 'beep();\n';
  return code;
};

Blockly.JavaScript['nano_beep_custom'] = function(block) {
  var frequency = block.getFieldValue('FREQUENCY');
  var duration = block.getFieldValue('DURATION');
  var code = `tone(_BZ, ${frequency}, ${duration});\n`;
  return code;
};

Blockly.JavaScript['knob_read'] = function(block) {
  return ['analogRead(A15)', Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['encoder_init'] = function(block) {
  var mask = block.getFieldValue('MASK');
  return 'encoder_init(' + mask + ');\n';
};

Blockly.JavaScript['encoder_read'] = function(block) {
  var which = block.getFieldValue('WHICH');
  return ['encoder_read(' + which + ')', Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript['encoder_reset'] = function(block) {
  var which = block.getFieldValue('WHICH');
  return 'encoder_reset(' + which + ');\n';
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
  var code = `map_func(${v1}, ${v2}, ${v3}, ${v4}, ${v5})`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

}