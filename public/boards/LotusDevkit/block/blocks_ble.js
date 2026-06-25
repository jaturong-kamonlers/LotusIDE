/**
 * blocks_ble.js
 * LotusDevkit - BLE Blocks
 * icon: /static/icons/SVG/c10.svg (แทน ble.png ที่หาไม่เจอ)
 */

module.exports = function(Blockly) {
  'use strict';
var t = Blockly.lotus.t;

  var ble_colour = '#0082FC';

  Blockly.Blocks['lotus_ble_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE begin name')
        .appendField(new Blockly.FieldTextInput('LotusDevkit'), 'NAME');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_begin.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_advertise_start'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE start advertising');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_advertise_start.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_advertise_stop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE stop advertising');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_advertise_stop.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_send_string'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE send text')
        .appendField(new Blockly.FieldTextInput('Hello'), 'DATA');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_send_string.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_send_number'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE send number');
      this.appendValueInput('DATA').setCheck('Number');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_send_number.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_received_string'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE received text');
      this.setOutput(true, 'String');
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_received_string.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_is_connected'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE connected?');
      this.setOutput(true, 'Boolean');
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_is_connected.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_has_data'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE has new data?');
      this.setOutput(true, 'Boolean');
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_has_data.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_on_received'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE when received data');
      this.appendStatementInput('DO').setCheck(null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_on_received.tooltip"));
    }
  };

  Blockly.Blocks['lotus_ble_clear'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE clear buffer');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip(t("ble.lotus_ble_clear.tooltip"));
    }
  };

};
