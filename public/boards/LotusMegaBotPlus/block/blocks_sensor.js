module.exports = function(Blockly){
  'use strict';
var sensor_colour= Blockly.Msg.SENSOR_HUE ;

Blockly.Blocks['sw1_press'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Wait for Button Press")
        .appendField(new Blockly.FieldDropdown([
          ["SW1 (D35)", "1"],
          ["SW2 (D37)", "2"]
        ]), "SW");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(sensor_colour);
    this.setTooltip("Wait until the selected start button is pressed and released");
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

Blockly.Blocks['knob_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Knob (A15)");
    this.setOutput(true, "Number");
    this.setColour(290);
    this.setTooltip("Read potentiometer at A15 (0..1023)");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_init'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder init")
        .appendField(new Blockly.FieldDropdown([
          ["Enc1 only (D2,D3)", "1"],
          ["Enc2 only (D18,D19)", "2"],
          ["Both", "3"]
        ]), "MASK");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Attach interrupts and start counting. Enc2 conflicts with Serial1.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder read")
        .appendField(new Blockly.FieldDropdown([
          ["Enc1", "1"], ["Enc2", "2"]
        ]), "WHICH");
    this.setOutput(true, "Number");
    this.setColour(290);
    this.setTooltip("Read current encoder count (signed)");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_reset'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder reset")
        .appendField(new Blockly.FieldDropdown([
          ["Enc1", "1"], ["Enc2", "2"]
        ]), "WHICH");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Reset encoder count to 0");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_drive'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder drive")
        .appendField(new Blockly.FieldDropdown([
          ["Forward",  "1"],
          ["Backward","-1"]
        ]), "DIR");
    this.appendValueInput("TICKS").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("ticks at");
    this.appendValueInput("SPEED").setCheck("Number");
    this.appendDummyInput().appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Drive M1 + M2 the same distance using encoder sync. Each wheel runs until it reaches the tick target (with proportional speed correction so both wheels track together).");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['encoder_spin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Encoder spin")
        .appendField(new Blockly.FieldDropdown([
          ["Right (cw)",  "1"],
          ["Left  (ccw)","-1"]
        ]), "DIR");
    this.appendValueInput("TICKS").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("ticks at");
    this.appendValueInput("SPEED").setCheck("Number");
    this.appendDummyInput().appendField("%");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(290);
    this.setTooltip("Spin in place: one wheel forward, the other backward. Each wheel stops at its own tick target. Use a small speed (30-50 %) for precise turns.");
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
