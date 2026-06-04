
//Block from IKB1  & NanoBot


module.exports = function(Blockly) {

Blockly.JavaScript['Lotus_servo'] = function(block) {
  var dropdown_ch = block.getFieldValue('ch');
  var value_angle = block.getFieldValue('angle') || 45;
  var code = 'servo(' + dropdown_ch + ', ' + value_angle + ');\n';
  return code;
};

Blockly.JavaScript['Lotus_motor_stop'] = function(block) {
  var code = 'ao();\n';
  return code;
};

Blockly.JavaScript['Lotus_motor'] = function(block) {
  var value_speed1 = block.getFieldValue('speed1') || '0';
  var value_speed2 = block.getFieldValue('speed2') || '0';
  var code = '';
  code += 'motor(1,  ' + value_speed1 + ');\t';
  code += 'motor(2,  ' + value_speed2 + ');\n';
  return code;
};

//////////////////////////////////
Blockly.JavaScript['Lotus_all_motor'] = function(block) {
  var dropdown_dir = block.getFieldValue('dir');
  var value_speed = block.getFieldValue('speed') || '0';

  if(dropdown_dir == '1'){
    var code = 'fd( ' + value_speed + ');\n';
  }else if(dropdown_dir == '2'){
    var code = 'bk( ' + value_speed + ');\n';
  }else if(dropdown_dir == '3'){
    var code = 'sl( ' + value_speed + ');\n';
  }else if(dropdown_dir == '4'){
    var code = 'sr(' + value_speed + ');\n';
  }else if(dropdown_dir == '5'){
    var code = 'tl( ' + value_speed + ');\n';
  }else if(dropdown_dir == '6'){
    var code = 'tr(' + value_speed + ');\n';
  }
  return code;
};
}
