
//Block from IKB1 - FIXED: Servo noise fix, use ESP32Servo separate LEDC timer

module.exports = function(Blockly) {

Blockly.JavaScript['WIT_servo'] = function(block) {
  var dropdown_ch = block.getFieldValue('ch');
  var value_angle = Blockly.JavaScript.valueToCode(block, 'angle', Blockly.JavaScript.ORDER_ATOMIC) || 0;

  // SV1=D32, SV2=D33 (D5 is used by Motor3 on this board)
  var code = '#EXTINC\n#include <ESP32Servo.h>\n#END\n\n#VARIABLE\nServo _svObj1, _svObj2;\nbool _svInit1=false, _svInit2=false;\n\nvoid _servoWrite(int ch, int angle) {\n  if(angle<0) angle=0;\n  if(angle>180) angle=180;\n  if(ch==1){\n    if(!_svInit1){ ESP32PWM::allocateTimer(1); _svObj1.setPeriodHertz(50); _svObj1.attach(32,500,2400); _svInit1=true; }\n    _svObj1.write(angle);\n  } else if(ch==2){\n    if(!_svInit2){ ESP32PWM::allocateTimer(2); _svObj2.setPeriodHertz(50); _svObj2.attach(33,500,2400); _svInit2=true; }\n    _svObj2.write(angle);\n  }\n}\nvoid _servoDetach(int ch) {\n  if(ch==1 && _svInit1){ _svObj1.detach(); _svInit1=false; }\n  if(ch==2 && _svInit2){ _svObj2.detach(); _svInit2=false; }\n}\n#END\n_servoWrite(' + dropdown_ch + ', ' + value_angle + ');\n';
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
  // Left side: M1 (front) + M3 (rear), Right side: M2 (front) + M4 (rear)
  var code = '';
  code += 'motor(1, ' + value_speed1 + '); motor(3, ' + value_speed1 + ');\t';
  code += 'motor(2, ' + value_speed2 + '); motor(4, ' + value_speed2 + ');\n';
  return code;
};

Blockly.JavaScript['motor4w_set'] = function(block) {
  var ch    = block.getFieldValue('CH');
  var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  return 'motor(' + ch + ', ' + speed + ');\n';
};

Blockly.JavaScript['motor_front'] = function(block) {
  var L = Blockly.JavaScript.valueToCode(block, 'SPEEDL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var R = Blockly.JavaScript.valueToCode(block, 'SPEEDR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  // M1=Left-Front, M2=Right-Front
  return 'motor(1, ' + L + '); motor(2, ' + R + ');\n';
};

Blockly.JavaScript['motor_rear'] = function(block) {
  var L = Blockly.JavaScript.valueToCode(block, 'SPEEDL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  var R = Blockly.JavaScript.valueToCode(block, 'SPEEDR', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  // M3=Left-Rear, M4=Right-Rear
  return 'motor(3, ' + L + '); motor(4, ' + R + ');\n';
};

}
