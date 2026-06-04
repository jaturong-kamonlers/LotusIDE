
//Block from IKB1 - FIXED: Servo noise fix, use ESP32Servo separate LEDC timer

module.exports = function(Blockly) {

Blockly.JavaScript['WIT_servo'] = function(block) {
  var dropdown_ch = block.getFieldValue('ch');
  var value_angle = Blockly.JavaScript.valueToCode(block, 'angle', Blockly.JavaScript.ORDER_ATOMIC) || 0;

  var code = '#EXTINC\n#include <ESP32Servo.h>\n#END\n\n#VARIABLE\nServo _svObj1, _svObj2, _svObj3;\nbool _svInit1=false, _svInit2=false, _svInit3=false;\n\nvoid _servoWrite(int ch, int angle) {\n  if(angle<0) angle=0;\n  if(angle>180) angle=180;\n  if(ch==1){\n    if(!_svInit1){ ESP32PWM::allocateTimer(1); _svObj1.setPeriodHertz(50); _svObj1.attach(32,500,2400); _svInit1=true; }\n    _svObj1.write(angle);\n  } else if(ch==2){\n    if(!_svInit2){ ESP32PWM::allocateTimer(2); _svObj2.setPeriodHertz(50); _svObj2.attach(33,500,2400); _svInit2=true; }\n    _svObj2.write(angle);\n  } else if(ch==3){\n    if(!_svInit3){ ESP32PWM::allocateTimer(3); _svObj3.setPeriodHertz(50); _svObj3.attach(5,500,2400); _svInit3=true; }\n    _svObj3.write(angle);\n  }\n}\nvoid _servoDetach(int ch) {\n  if(ch==1 && _svInit1){ _svObj1.detach(); _svInit1=false; }\n  if(ch==2 && _svInit2){ _svObj2.detach(); _svInit2=false; }\n  if(ch==3 && _svInit3){ _svObj3.detach(); _svInit3=false; }\n}\n#END\n_servoWrite(' + dropdown_ch + ', ' + value_angle + ');\n';
  return code;
};

Blockly.JavaScript['WIT_servo_detach'] = function(block) {
  var dropdown_ch = block.getFieldValue('ch');
  var code = '_servoDetach(' + dropdown_ch + ');\n';
  return code;
};

Blockly.JavaScript['WIT_motor_stop'] = function(block) {
  var code = 'ao();\n';
  return code;
};

Blockly.JavaScript['WIT_motor_forward2'] = function(block) {
  var value_speed1 = Blockly.JavaScript.valueToCode(block, 'speed1', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var value_speed2 = Blockly.JavaScript.valueToCode(block, 'speed2', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var code = '';
  code += 'motor(1,  ' + value_speed1 + ');\t';
  code += 'motor(2,  ' + value_speed2 + ');\n';
  return code;
};

}
