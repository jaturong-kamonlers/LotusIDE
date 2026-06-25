


module.exports = function(Blockly) {
  'use strict';
var t = Blockly.lotus.t;
  var motor_colour = Blockly.Msg.MUSIC_HUE;


  // Servo: 2 channels only (D5 is used by Motor3 on this board)
  Blockly.Blocks['WIT_servo'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("set servo")
        .appendField(new Blockly.FieldDropdown([
          ["Servo1 (D32)", "1"],
          ["Servo2 (D33)", "2"],
        ]), "ch");
      this.appendValueInput("angle")
        .setCheck("Number")
        .appendField("degree");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("Set servo angle (0-180). SV1=D32, SV2=D33.");
    }
  };

  Blockly.Blocks['WIT_servo_detach'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("servo detach (stop noise)")
        .appendField(new Blockly.FieldDropdown([
          ["Servo1 (D32)", "1"],
          ["Servo2 (D33)", "2"],
        ]), "ch");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("Detach servo PWM signal after reaching position to stop buzzing noise.");
    }
  };

  // 4-wheel drive: left side (M1+M3) and right side (M2+M4)
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
      this.setTooltip("Set left (M1+M3) and right (M2+M4) motor speeds. Range -100 to +100 %.");
    }
  };

  // Individual motor control
  Blockly.Blocks['motor4w_set'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Motor")
        .appendField(new Blockly.FieldDropdown([
          ["M1 Left-Front  (D13)", "1"],
          ["M2 Right-Front (D4)",  "2"],
          ["M3 Left-Rear   (D14)", "3"],
          ["M4 Right-Rear  (D23)", "4"],
        ]), "CH");
      this.appendValueInput("SPEED")
        .setCheck("Number")
        .appendField("speed");
      this.appendDummyInput().appendField("%");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip("Set one motor speed individually. Range -100 to +100 %.");
    }
  };

  // Front pair: M1 (Left-Front) + M2 (Right-Front)
  Blockly.Blocks['motor_front'] = {
    init: function() {
      this.appendDummyInput().appendField('Motor front');
      this.appendValueInput('SPEEDL').setCheck('Number').appendField('left');
      this.appendDummyInput().appendField('%');
      this.appendValueInput('SPEEDR').setCheck('Number').appendField('right');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip(t('motor.move_front.tooltip'));
    }
  };

  // Rear pair: M3 (Left-Rear) + M4 (Right-Rear)
  Blockly.Blocks['motor_rear'] = {
    init: function() {
      this.appendDummyInput().appendField('Motor rear');
      this.appendValueInput('SPEEDL').setCheck('Number').appendField('left');
      this.appendDummyInput().appendField('%');
      this.appendValueInput('SPEEDR').setCheck('Number').appendField('right');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(motor_colour);
      this.setTooltip(t('motor.move_rear.tooltip'));
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
