module.exports = function(Blockly) {
  'use strict';

  Blockly.JavaScript['gpio_digital'] = function(block) {
    return `${block.getFieldValue('PIN')}`;
  };

  Blockly.JavaScript['gpio_analog'] = function(block) {
    return `${block.getFieldValue('PIN')}`;
  };

  Blockly.JavaScript['gpio_i2c'] = function(block) {
    return `${block.getFieldValue('PIN')}`;
  };

  Blockly.JavaScript['gpio_spi'] = function(block) {
    return `${block.getFieldValue('PIN')}`;
  };

  Blockly.JavaScript['gpio_analog_pin'] = function(block) {
    var value_pin = Blockly.JavaScript.valueToCode(block, 'pin', Blockly.JavaScript.ORDER_NONE);
    return [`${value_pin}`, Blockly.JavaScript.ORDER_NONE];
  };

  Blockly.JavaScript['gpio_pwm_pin'] = function(block) {
    var value_pin = Blockly.JavaScript.valueToCode(block, 'pin', Blockly.JavaScript.ORDER_NONE);
    return [`${value_pin}`, Blockly.JavaScript.ORDER_NONE];
  };
};
