module.exports = function(Blockly){
  'use strict';

Blockly.JavaScript['sw1_press'] = function(block) {  
  var code = 'wait();\n';
  //var code = '';
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
  var frequency = block.getFieldValue('FREQUENCY');  // รับค่าความถี่
  var duration = block.getFieldValue('DURATION');    // รับค่าระยะเวลา
  var code = `tone(_BZ, ${frequency}, ${duration});\n`;  // ใช้ tone เพื่อให้บัซเซอร์ทำงาน
  return code;
};


  Blockly.JavaScript['map_func'] = function(block) {
    var v1 = Blockly.JavaScript.valueToCode(block, 'V1', Blockly.JavaScript.ORDER_ATOMIC);
    var v2 = block.getFieldValue('V2');
    var v3 = block.getFieldValue('V3');
    var v4 = block.getFieldValue('V4');
    var v5 = block.getFieldValue('V5');
    
    // Generate JavaScript code for map_func function from LotusNanoBot.h
    var code = `map_func(${v1}, ${v2}, ${v3}, ${v4}, ${v5})`;
    
    // Return the generated code with proper order for execution
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };


}