/**
 * blocks_ble.js
 * LotusDevkit - BLE Blocks
 * icon: /static/icons/SVG/c10.svg (แทน ble.png ที่หาไม่เจอ)
 */

module.exports = function(Blockly) {
  'use strict';

  var ble_colour = '#0082FC';

  Blockly.Blocks['lotus_ble_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE begin name')
        .appendField(new Blockly.FieldTextInput('LotusDevkit'), 'NAME');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip('เริ่มต้น BLE Server และตั้งชื่ออุปกรณ์');
    }
  };

  Blockly.Blocks['lotus_ble_advertise_start'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE start advertising');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip('เริ่มประกาศสัญญาณ BLE ให้อุปกรณ์อื่นค้นพบได้');
    }
  };

  Blockly.Blocks['lotus_ble_advertise_stop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE stop advertising');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip('หยุดประกาศสัญญาณ BLE');
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
      this.setTooltip('ส่งข้อความผ่าน BLE Notification');
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
      this.setTooltip('ส่งตัวเลขผ่าน BLE Notification');
    }
  };

  Blockly.Blocks['lotus_ble_received_string'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE received text');
      this.setOutput(true, 'String');
      this.setColour(ble_colour);
      this.setTooltip('อ่านข้อความล่าสุดที่ได้รับจาก BLE client');
    }
  };

  Blockly.Blocks['lotus_ble_is_connected'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE connected?');
      this.setOutput(true, 'Boolean');
      this.setColour(ble_colour);
      this.setTooltip('คืนค่า true ถ้ามี BLE client เชื่อมต่ออยู่');
    }
  };

  Blockly.Blocks['lotus_ble_has_data'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE has new data?');
      this.setOutput(true, 'Boolean');
      this.setColour(ble_colour);
      this.setTooltip('คืนค่า true ถ้ามีข้อมูลใหม่จาก BLE client');
    }
  };

  Blockly.Blocks['lotus_ble_on_received'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE when received data');
      this.appendStatementInput('DO').setCheck(null);
      this.setColour(ble_colour);
      this.setTooltip('ทำงานเมื่อได้รับข้อมูลจาก BLE client');
    }
  };

  Blockly.Blocks['lotus_ble_clear'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BLE clear buffer');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(ble_colour);
      this.setTooltip('ล้างบัฟเฟอร์ข้อมูลที่รับมา');
    }
  };

};
