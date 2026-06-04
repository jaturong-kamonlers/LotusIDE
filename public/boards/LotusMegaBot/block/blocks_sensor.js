module.exports = function(Blockly){
  'use strict';
var sensor_colour= Blockly.Msg.SENSOR_HUE ;

Blockly.Blocks['sw1_press'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Wait for Button Press (D53)");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(sensor_colour);
    this.setTooltip("");
  }
};

Blockly.Blocks['analog_sensor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Analog Read ")
        .appendField(new Blockly.FieldDropdown([
                                            ["(A0)", "A0"],
                                            ["(A1)", "A1"],
                                            ["(A2)", "A2"],
                                            ["(A3)", "A3"],
                                            ["(A4)", "A4"],
                                            ["(A5)", "A5"],
                                            ["(A6)", "A6"],
											["(A7)", "A7"],
                                            ["(A8)", "A8"],
                                            ["(A9)", "A9"],
                                            ["(A10)","A10"],
                                            ["(A11)","A11"],
                                            ["(A12)","A12"],
                                            ["(A13)","A13"],
											["(A14)","A14"],											
                                            ["(A15)Knob", "A15"]]), "pin");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(290);
 this.setTooltip("read analog value from pin");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['nano_beep'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Buzzer beep");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
 this.setTooltip("Buzzer beep");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['nano_beep_custom'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Buzzer frequency")
        .appendField(new Blockly.FieldNumber(1000, 1, 10000), "FREQUENCY")
        .appendField("Hz for")
        .appendField(new Blockly.FieldNumber(1000, 1, 10000), "DURATION")
        .appendField("ms");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
    this.setTooltip("Buzzer beep with custom frequency and duration");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['map_func'] = {
  init: function() {
    this.appendValueInput("V1")
      .setCheck("Number")
      .appendField("Map Lotus");
    this.appendDummyInput()
      .appendField("Min")
      .appendField(new Blockly.FieldNumber(0), "V2");
    this.appendDummyInput()
      .appendField("Max")
      .appendField(new Blockly.FieldNumber(0), "V3");
    this.appendDummyInput()
      .appendField("New_Min")
      .appendField(new Blockly.FieldNumber(0), "V4");
    this.appendDummyInput()
      .appendField("New_Max")
      .appendField(new Blockly.FieldNumber(0), "V5");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(20);
    this.setTooltip("Map a sensor value to a new range");
    this.setHelpUrl("");
  }
};
}
