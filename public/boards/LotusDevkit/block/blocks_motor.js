


module.exports = function(Blockly) {
  'use strict';
  var motor_colour = Blockly.Msg.MUSIC_HUE;


  Blockly.Blocks['WIT_servo'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("set servo")
        .appendField(new Blockly.FieldDropdown([
          ["Servo1 (D32)", "1"],
          ["Servo2 (D33)", "2"],
          ["Servo3 (D5)",  "3"]
        ]), "ch");
      this.appendValueInput("angle")
        .setCheck("Number")
        .appendField("degree");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("Set servo angle (0-180). Uses ESP32Servo on separate LEDC timer to prevent Buzzer noise.");
    }
  };


  Blockly.Blocks['WIT_servo_detach'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("servo detach (stop noise)")
        .appendField(new Blockly.FieldDropdown([
          ["Servo1 (D32)", "1"],
          ["Servo2 (D33)", "2"],
          ["Servo3 (D5)",  "3"]
        ]), "ch");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("Detach servo PWM signal after reaching position. This stops buzzing/noise from servo.");
    }
  };

  Blockly.Blocks['WIT_motor_forward2'] = {
    init: function() {
      this.appendValueInput("speed1")
        .setCheck("Number")
        .appendField("Motor left speed");
      this.appendDummyInput()
        .appendField("%");
      this.appendValueInput("speed2")
        .setCheck("Number")
        .appendField("Motor right speed");
      this.appendDummyInput()
        .appendField("%");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("");
    }
  };

  Blockly.Blocks['WIT_motor_stop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Stop Moving");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("");
    }
  };

};
