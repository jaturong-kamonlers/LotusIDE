
//Block from IKB1 & NanoBot

module.exports = function(Blockly){
  'use strict';
var motor_colour=Blockly.Msg.MUSIC_HUE ;

Blockly.Blocks['Lotus_servo'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Servo")
      .appendField(new Blockly.FieldDropdown([["Servo1(D10)","1"], ["Servo2 (D11)","2"],  ["Servo3 (D12)","3"]]), "ch")
      .appendField("degree")
      .appendField(new Blockly.FieldNumber(45, 0, 180), "angle")
      .appendField("°");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(105);
    this.setTooltip("");
  }
};

Blockly.Blocks['Lotus_motor_stop'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Stop Motor");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(motor_colour);
    this.setTooltip("");
  }
};

Blockly.Blocks['Lotus_motor'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Left Motor Speed")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speed1")
      .appendField("% Right Motor Speed")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speed2")
      .appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(motor_colour);
    this.setTooltip("");
  }
};

Blockly.Blocks['Lotus_all_motor'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("direction")
      .appendField(new Blockly.FieldDropdown([["Forward","1"], ["Backward", "2"], ["SpinLeft", "3"], ["SpinRight", "4"], ["TrunLeft", "5"], ["TrunRight", "6"]]), "dir")
      .appendField("speed")
      .appendField(new Blockly.FieldNumber(50, 0, 100), "speed")
      .appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(motor_colour);
    this.setTooltip("");
  }
};
}
