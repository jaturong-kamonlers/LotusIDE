module.exports = function(Blockly) {
  'use strict';
  console.log('[LotusDueBot] blocks_gpio_pin.js LOADING');

  // Generic digital-pin selector for Arduino Due (0..65)
  Blockly.Blocks['gpio_digital'] = {
    init: function() {
      var opts = [];
      for (var i = 0; i <= 53; i++) opts.push([String(i), String(i)]);
      this.appendDummyInput()
          .appendField("digital")
          .appendField(new Blockly.FieldDropdown(opts), "PIN");
      this.setOutput(true, "Number");
      this.setColour(20);
    }
  };

  // Analog: A0..A11 -> D54..D65
  Blockly.Blocks['gpio_analog'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("analog")
          .appendField(new Blockly.FieldDropdown([
            ["A0","54"], ["A1","55"], ["A2","56"], ["A3","57"],
            ["A4","58"], ["A5","59"], ["A6","60"], ["A7","61"],
            ["A8","62"], ["A9","63"], ["A10","64"], ["A11","65"]
          ]), "PIN");
      this.setOutput(true, "Number");
      this.setColour(20);
    }
  };

  Blockly.Blocks['gpio_i2c'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("I2C")
          .appendField(new Blockly.FieldDropdown([
            ["SDA (D20)","20"],
            ["SCL (D21)","21"]
          ]), "PIN");
      this.setOutput(true, "Number");
      this.setColour(20);
    }
  };

  // SPI on the shield is software-bit-banged through D10/D11/D12.
  // Listed here for documentation / external sensors.
  Blockly.Blocks['gpio_spi'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("SPI")
          .appendField(new Blockly.FieldDropdown([
            ["SS (D4)","4"],
            ["MOSI (D10)","10"],
            ["MISO (D11)","11"],
            ["SCK (D12)","12"]
          ]), "PIN");
      this.setOutput(true, "Number");
      this.setColour(20);
    }
  };

  Blockly.Blocks['gpio_analog_pin'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Analog pin ")
          .appendField(new Blockly.FieldDropdown([
            ["A0","54"], ["A1","55"], ["A2","56"], ["A3","57"],
            ["A4","58"], ["A5","59"], ["A6","60"], ["A7","61"],
            ["A8","62"], ["A9","63"], ["A10","64"], ["A11","65"]
          ]), "PIN");
      this.setOutput(true, "AnalogPIN");
      this.setColour(180);
    }
  };

  Blockly.Blocks['gpio_pwm_pin'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("PWM pin ")
          .appendField(new Blockly.FieldDropdown([
            ["D2","2"], ["D3","3"], ["D5","5"], ["D6","6"],
            ["D7","7"], ["D8","8"], ["D9","9"],
            ["D10","10"], ["D11","11"], ["D12","12"], ["D13","13"]
          ]), "pin");
      this.setOutput(true, "PWMPIN");
      this.setColour(180);
    }
  };
};
