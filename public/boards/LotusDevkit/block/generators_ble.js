/**
 * generators_ble.js — BLE code generator for LotusDevkit
 * Uses BLE_Plugin.h API (ESP-IDF Bluedroid, no NimBLE required)
 *
 * BLE_Plugin API:
 *   BLE_Plugin ble;
 *   ble.begin("name")         → begin BLE server
 *   ble.send(String)          → send text to phone
 *   ble.sendInt(int)          → send number to phone
 *   ble.available()           → bool: has new data?
 *   ble.isConnected()         → bool: phone connected?
 *   ble.readString()          → String: read received text
 *   ble.readFloat()           → float: read received number
 */
module.exports = function(Blockly) {
  'use strict';

  const OA = Blockly.JavaScript.ORDER_ATOMIC;

  // shared include + global object (inject once)
  const BLE_INC = '#EXTINC\n#include "BLE_Plugin.h"\n#END\n\n';
  const BLE_VAR = '#VARIABLE\nBLE_Plugin _ble;\nbool _bleHasData = false;\n#END\n\n';

  // ── lt_ble_begin ─────────────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_begin'] = function(block) {
    const name = block.getFieldValue('NAME') || 'LotusDevkit';
    let code = BLE_INC + BLE_VAR;
    code += '_ble.begin("' + name + '");\n';
    return code;
  };

  // ── lt_ble_start_advertising ─────────────────────────────────────────────
  // BLE_Plugin auto-starts advertising after begin(); re-advertise on disconnect
  Blockly.JavaScript['lotus_ble_advertise_start'] = function(block) {
    return '// BLE advertising auto-managed by BLE_Plugin\n';
  };

  // ── lt_ble_stop_advertising ──────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_advertise_stop'] = function(block) {
    return '// BLE stop advertising (not supported in BLE_Plugin)\n';
  };

  // ── lt_ble_send_string ───────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_send_string'] = function(block) {
    const val = Blockly.JavaScript.valueToCode(block, 'DATA', OA) || '""';
    return '_ble.send(String(' + val + '));\n';
  };

  // ── lt_ble_send_number ───────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_send_number'] = function(block) {
    const val = Blockly.JavaScript.valueToCode(block, 'NUM', OA) || '0';
    return '_ble.sendInt(' + val + ');\n';
  };

  // ── lt_ble_received_text ─────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_received_string'] = function(block) {
    return ['_bleCmdBuf', OA];
  };

  // ── lt_ble_connected ─────────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_is_connected'] = function(block) {
    return ['_ble.isConnected()', OA];
  };

  // ── lt_ble_has_data ──────────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_has_data'] = function(block) {
    return ['_ble.available()', OA];
  };

  // ── lt_ble_on_received ───────────────────────────────────────────────────
  // Event block: วนเช็คใน loop และเรียก handler เมื่อมีข้อมูล
  Blockly.JavaScript['lotus_ble_on_received'] = function(block) {
    const stmts = Blockly.JavaScript.statementToCode(block, 'DO') || '';
    return '#VARIABLE\nString _bleCmdBuf = "";\n#END\n'
         + '#FUNCTION\nvoid _ble_on_received_handler(){\n'
         + '  _bleCmdBuf = _ble.readString();\n'
         + stmts
         + '}\n#END\n'
         + 'if(_ble.available()){_ble_on_received_handler();}\n';
  };

  // ── lt_ble_clear_buffer ──────────────────────────────────────────────────
  Blockly.JavaScript['lotus_ble_clear'] = function(block) {
    return '// BLE buffer auto-cleared after readString()\n';
  };

  console.log('✅ BLE generators loaded!');
  console.log('Registered:', [
    'lotus_ble_begin','lotus_ble_advertise_start','lotus_ble_advertise_stop','lotus_ble_send_string','lotus_ble_send_number','lotus_ble_received_string','lotus_ble_is_connected','lotus_ble_has_data','lotus_ble_on_received','lotus_ble_clear'
  ]);
};
