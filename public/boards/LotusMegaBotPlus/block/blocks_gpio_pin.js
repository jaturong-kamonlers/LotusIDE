module.exports = function(Blockly) {
  'use strict';

  Blockly.Blocks['gpio_digital'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("digital")
          .appendField(new Blockly.FieldDropdown([
            ["2","2"], 
            ["3","3"], 
            ["4","4"], 
            ["5","5"],
            ["6","6"], 
            ["7","7"],
            ["8","8"], 
            ["9","9"],
            ["10","10"],
            ["11","11"],
            ["12","12"],
            ["13","13"], 
            ["14","14"], 
            ["15","15"], 
            ["16","16"],
            ["17","17"], 
            ["18","18"],
            ["19","19"], 
            ["20","20"],
            ["21","21"],
            ["22","22"],
            ["23","23"],
            ["24","24"], 
            ["25","25"], 
            ["26","26"], 
            ["27","27"],
            ["28","28"], 
            ["29","29"],
            ["30","30"], 
            ["31","31"],
            ["32","32"],
            ["33","33"],
            ["34","34"],
            ["35","35"], 
            ["36","36"], 
            ["37","37"], 
            ["38","38"],
            ["39","39"], 
            ["40","40"],
            ["41","41"], 
            ["42","42"],
            ["43","43"],
            ["44","44"],
            ["45","45"],
            ["46","46"],
            ["47","47"],
            ["48","48"],
            ["49","49"],
            ["50","50"],
            ["51","51"],
            ["52","52"],
            ["53","53"]]), 
            "PIN");
      this.setOutput(true, "Number");
      this.setColour(20);
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['gpio_analog'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("analog")
          .appendField(new Blockly.FieldDropdown([
            ["A0","54"], 
            ["A1","55"], 
            ["A2","56"], 
            ["A3","57"],
            ["A4","58"],
            ["A5","59"],
            ["A6","60"],
            ["A7","61"],
            ["A8","62"],
            ["A9","63"],
            ["A10","64"],
            ["A11","65"], 
            ["A12","66"], 
            ["A13","67"], 
            ["A14","68"], 
            ["A15","69"]]), 
            "PIN");
       this.setOutput(true, "Number");
      this.setColour(20);
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['gpio_i2c'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("I2C")
          .appendField(new Blockly.FieldDropdown([
            ["SDA","20"],  
            ["SCL","21"]]), 
            "PIN");
       this.setOutput(true, "Number");
      this.setColour(20);
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['gpio_spi'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("SPI")
          .appendField(new Blockly.FieldDropdown([
            ["CS","53"],  
            ["MOSI","51"],  
            ["MISO","50"],  
            ["SCK","52"]]), 
            "PIN");
       this.setOutput(true, "Number");
      this.setColour(20);
      this.setTooltip("");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['gpio_analog_pin'] = {
    init: function() {
      this.appendDummyInput().
      appendField("Analog pin ").
      appendField(new Blockly.FieldDropdown([
        ["A0","54"], 
        ["A1","55"], 
        ["A2","56"], 
        ["A3","57"],
        ["A4","58"],
        ["A5","59"],
        ["A6","60"],
        ["A7","61"],
        ["A8","62"],
        ["A9","63"],
        ["A10","64"],
        ["A11","65"], 
        ["A12","66"], 
        ["A13","67"], 
        ["A14","68"], 
        ["A15","69"]]), 
        "PIN");
      this.setOutput(true, "AnalogPIN");
      this.setColour(180);
      this.setTooltip("Analog pin");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['gpio_pwm_pin'] = {
    init: function() {
      this.appendDummyInput().
      appendField("PWM pin ").
      appendField(new Blockly.FieldDropdown([
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
      this.setOutput(true, "PWMPIN");
      this.setColour(180);
      this.setTooltip("PWM pin");
      this.setHelpUrl("");
    }
  };
};