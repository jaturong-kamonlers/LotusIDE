
//Block from IKB1 & NanoBot

module.exports = function(Blockly){
  'use strict';
var motor_colour=Blockly.Msg.MUSIC_HUE ;

Blockly.Blocks['Lotus_servo'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Servo")
      .appendField(new Blockly.FieldDropdown([["Servo1","1"], ["Servo2","2"], ["Servo3","3"],  ["Servo4","4"],  ["Servo5","5"],  ["Servo6","6"],  ["Servo7","7"],   ["Servo8","8"]]), "ch")
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

Blockly.Blocks['Lotus_motor_4ch'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("4Ch  ML")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speedL")
      .appendField("%  MR")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speedR")
      .appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(motor_colour);
    this.setTooltip("Drive 4 motors (TB6612 #1 + #2)");
  }
};

Blockly.Blocks['Lotus_motor_2ch'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("2Ch  ML")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speedL")
      .appendField("%  MR")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speedR")
      .appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(motor_colour);
    this.setTooltip("Drive 2 motors (TB6612 #1)");
  }
};

Blockly.Blocks['Lotus_motor_single'] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Motor")
      .appendField(new Blockly.FieldDropdown([
        ["1","1"], ["2","2"], ["3","3"], ["4","4"], ["5","5"], ["6","6"]
      ]), "MIDX")
      .appendField("speed")
      .appendField(new Blockly.FieldNumber(50, -100, 100), "speed")
      .appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(motor_colour);
    this.setTooltip("Drive a single motor by index 1..6  (1=TB1-A, 2=TB1-B, 3=TB2-A, 4=TB2-B, 5=TB3-A, 6=TB3-B)");
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
