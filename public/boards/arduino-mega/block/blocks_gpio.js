module.exports = function(Blockly){
  'use strict';

Blockly.Blocks['io_analog_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("read analog input pin ")
        .appendField(new Blockly.FieldDropdown([
          ["A0","A0"], 
          ["A1","A1"], 
          ["A2","A2"], 
          ["A3","A3"],
          ["A4","A4"],
          ["A5","A5"],
          ["A6","A6"],
          ["A7","A7"],
          ["A8","A8"],
          ["A9","A9"],
          ["A10","A10"],
          ["A11","A11"], 
          ["A12","A12"], 
          ["A13","A13"], 
          ["A14","A14"], 
          ["A15","A15"]]), 
          "pin");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(45);
 this.setTooltip("read analog value from pin");
 this.setHelpUrl("");
  }
};


Blockly.Blocks['io_pwm_write'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("PWM write pin")
        .appendField(new Blockly.FieldDropdown([
          ["2", "2"],
          ["3", "3"],
          ["4", "4"],
          ["5", "5"],
          ["6", "6"],
          ["7", "7"],
          ["8", "8"],
          ["9", "9"],
          ["10", "10"],
          ["11", "11"],
          ["12", "12"],
          ["13", "13"],
          ["44", "44"],
          ["45", "45"],
          ["46", "46"]]), "pin");
    this.appendValueInput("value")
        .setCheck("Number")
        .appendField("value");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);
 this.setTooltip("write PWM to pin (value 0-255) at 5KHz");
 this.setHelpUrl("https://en.wikipedia.org/wiki/Pulse-width_modulation");
  }
};

};