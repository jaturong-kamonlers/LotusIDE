/**
 * generators_wifi.js — Standalone WiFi code generators for LotusDevkit
 *
 * Emitted code uses arduino-esp32 core libraries (WiFi.h, HTTPClient.h)
 * which are pre-bundled with the ESP32 platform — no extra library install.
 *
 * Markers (#EXTINC, #SETUP, #FUNCTION) are hoisted by the sketch builder
 * (electron/ipc/arduino.js) so the user can drop these blocks anywhere
 * in the workspace and the include/setup/function definitions still land
 * in the right scope.
 */

module.exports = function(Blockly) {
  "use strict";

  var OA = Blockly.JavaScript.ORDER_ATOMIC;

  // ── Tier 1: WiFi Station ───────────────────────────────────────────────────

  Blockly.JavaScript["lt_wifi_begin"] = function(block) {
    var ssid = block.getFieldValue('SSID') || 'SSID';
    var pass = block.getFieldValue('PASS') || '';
    // Blocking connect with 15s timeout — students expect WiFi to be ready
    // after this block runs. Anonymous block scope keeps the local timer
    // variable from polluting setup().
    return '#EXTINC\n#include <WiFi.h>\n#END\n' +
           '#SETUP\n' +
           'WiFi.mode(WIFI_STA);\n' +
           'WiFi.begin("' + ssid + '", "' + pass + '");\n' +
           '{\n' +
           '  uint32_t _wifi_t0 = millis();\n' +
           '  while (WiFi.status() != WL_CONNECTED && millis() - _wifi_t0 < 15000) delay(100);\n' +
           '}\n' +
           '#END\n';
  };

  Blockly.JavaScript["lt_wifi_is_connected"] = function(block) {
    return ['(WiFi.status() == WL_CONNECTED)', OA];
  };

  Blockly.JavaScript["lt_wifi_local_ip"] = function(block) {
    return ['WiFi.localIP().toString()', OA];
  };

  Blockly.JavaScript["lt_wifi_rssi"] = function(block) {
    return ['WiFi.RSSI()', OA];
  };

  // ── Tier 2: HTTP Client ────────────────────────────────────────────────────
  // Helper functions are emitted once as #FUNCTION blocks so calling the
  // block N times produces only one helper definition.

  Blockly.JavaScript["lt_http_get"] = function(block) {
    Blockly.JavaScript.definitions_['__lotus_http_get__'] =
      '#EXTINC\n#include <HTTPClient.h>\n#END\n' +
      '#FUNCTION\n' +
      'String _http_get(const String& url) {\n' +
      '  HTTPClient _hc;\n' +
      '  _hc.begin(url);\n' +
      '  int _code = _hc.GET();\n' +
      '  String _s = (_code > 0) ? _hc.getString() : String("");\n' +
      '  _hc.end();\n' +
      '  return _s;\n' +
      '}\n' +
      '#END\n';
    var url = Blockly.JavaScript.valueToCode(block, 'URL', OA) || '""';
    return ['_http_get(' + url + ')', OA];
  };

  Blockly.JavaScript["lt_http_post"] = function(block) {
    Blockly.JavaScript.definitions_['__lotus_http_post__'] =
      '#EXTINC\n#include <HTTPClient.h>\n#END\n' +
      '#FUNCTION\n' +
      'String _http_post(const String& url, const String& body) {\n' +
      '  HTTPClient _hc;\n' +
      '  _hc.begin(url);\n' +
      '  _hc.addHeader("Content-Type", "application/x-www-form-urlencoded");\n' +
      '  int _code = _hc.POST(body);\n' +
      '  String _s = (_code > 0) ? _hc.getString() : String("");\n' +
      '  _hc.end();\n' +
      '  return _s;\n' +
      '}\n' +
      '#END\n';
    var url  = Blockly.JavaScript.valueToCode(block, 'URL',  OA) || '""';
    var body = Blockly.JavaScript.valueToCode(block, 'BODY', OA) || '""';
    return ['_http_post(' + url + ', ' + body + ')', OA];
  };

  // ── Tier 3: WiFi Access Point ──────────────────────────────────────────────

  Blockly.JavaScript["lt_wifi_ap_begin"] = function(block) {
    var ssid = block.getFieldValue('SSID') || 'LotusAP';
    var pass = block.getFieldValue('PASS') || '12345678';
    return '#EXTINC\n#include <WiFi.h>\n#include <WiFiAP.h>\n#END\n' +
           '#SETUP\n' +
           'WiFi.mode(WIFI_AP);\n' +
           'WiFi.softAP("' + ssid + '", "' + pass + '");\n' +
           '#END\n';
  };

  Blockly.JavaScript["lt_wifi_ap_ip"] = function(block) {
    return ['WiFi.softAPIP().toString()', OA];
  };

  Blockly.JavaScript["lt_wifi_ap_clients"] = function(block) {
    return ['((int)WiFi.softAPgetStationNum())', OA];
  };
};
