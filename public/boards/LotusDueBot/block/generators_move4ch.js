module.exports = function(Blockly) {
  'use strict';

  Blockly.JavaScript['move4ch_init'] = function(block) {
    return 'move4ch_init(' + block.getFieldValue('MODE') + ');\n';
  };

  Blockly.JavaScript['move4ch_calibrate_imu'] = function(block) {
    return 'move4ch_calibrate_imu();\n';
  };

  Blockly.JavaScript['move4ch_set_kp'] = function(block) {
    var kp = Blockly.JavaScript.valueToCode(block, 'KP', Blockly.JavaScript.ORDER_ATOMIC) || '1.0';
    return 'move4ch_set_kp(' + kp + ');\n';
  };

  Blockly.JavaScript['move4ch_set_tpd'] = function(block) {
    var tpd = Blockly.JavaScript.valueToCode(block, 'TPD', Blockly.JavaScript.ORDER_ATOMIC) || '5.0';
    return 'move4ch_set_tpd(' + tpd + ');\n';
  };

  Blockly.JavaScript['move4ch_forward'] = function(block) {
    var t = Blockly.JavaScript.valueToCode(block, 'TICKS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_forward(' + t + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_backward'] = function(block) {
    var t = Blockly.JavaScript.valueToCode(block, 'TICKS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_backward(' + t + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_stop'] = function(block) {
    return 'move4ch_stop();\n';
  };

  Blockly.JavaScript['move4ch_spin_left'] = function(block) {
    var d = Blockly.JavaScript.valueToCode(block, 'DEG',   Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_spin_left(' + d + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_spin_right'] = function(block) {
    var d = Blockly.JavaScript.valueToCode(block, 'DEG',   Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_spin_right(' + d + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_set_heading'] = function(block) {
    var h = Blockly.JavaScript.valueToCode(block, 'HDG',   Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_set_heading(' + h + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_strafe_left'] = function(block) {
    var t = Blockly.JavaScript.valueToCode(block, 'TICKS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_strafe_left(' + t + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_strafe_right'] = function(block) {
    var t = Blockly.JavaScript.valueToCode(block, 'TICKS', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var s = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_strafe_right(' + t + ', ' + s + ');\n';
  };

  Blockly.JavaScript['move4ch_heading'] = function(block) {
    return ['move4ch_heading()', Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['move4ch_enc_read'] = function(block) {
    return ['move4ch_enc_read(' + block.getFieldValue('WHEEL') + ')', Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['move4ch_enc_reset'] = function(block) {
    return 'move4ch_enc_reset();\n';
  };

  Blockly.JavaScript['move4ch_reset_heading'] = function(block) {
    return 'move4ch_reset_heading();\n';
  };

  Blockly.JavaScript['move4ch_set_wheels'] = function(block) {
    var fl = Blockly.JavaScript.valueToCode(block, 'FL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var fr = Blockly.JavaScript.valueToCode(block, 'FR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var rl = Blockly.JavaScript.valueToCode(block, 'RL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var rr = Blockly.JavaScript.valueToCode(block, 'RR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    return 'move4ch_set_wheels(' + fl + ', ' + fr + ', ' + rl + ', ' + rr + ');\n';
  };
};
