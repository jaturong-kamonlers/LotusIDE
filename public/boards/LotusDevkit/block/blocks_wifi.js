/**
 * blocks_wifi.js — Standalone WiFi blocks for LotusDevkit (ESP32)
 *
 * Three tiers exposed in the IoT toolbox:
 *   - Tier 1: WiFi STA connect + status (connected?, IP, RSSI)
 *   - Tier 2: HTTP GET / POST (returns response body as String)
 *   - Tier 3: WiFi AP mode (start AP, AP IP, connected client count)
 *
 * WiFi.h, WiFiAP.h, HTTPClient are part of arduino-esp32 core — no
 * external library dependency.
 *
 * Tooltips + the prose-y "password" label go through Blockly.lotus.t()
 * so they switch between English / Thai with the TitleBar language toggle.
 * Technical labels (HTTP GET, SSID, dBm, AP, IP) stay English in both.
 */

module.exports = function(Blockly) {
  "use strict";

  var WIFI_COLOR = 195;   // cyan — distinct from MQTT (20) / BLE (#0082FC)
  var t = Blockly.lotus.t;

  // ── Tier 1: WiFi Station ───────────────────────────────────────────────────

  Blockly.Blocks["lt_wifi_begin"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("WiFi connect, SSID")
        .appendField(new Blockly.FieldTextInput("SSID"), "SSID")
        .appendField(t("wifi.label.password"))
        .appendField(new Blockly.FieldTextInput("PASSWORD"), "PASS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_begin.tooltip"));
    }
  };

  Blockly.Blocks["lt_wifi_is_connected"] = {
    init: function() {
      this.appendDummyInput().appendField("WiFi connected?");
      this.setOutput(true, "Boolean");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_is_connected.tooltip"));
    }
  };

  Blockly.Blocks["lt_wifi_local_ip"] = {
    init: function() {
      this.appendDummyInput().appendField("WiFi local IP");
      this.setOutput(true, "String");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_local_ip.tooltip"));
    }
  };

  Blockly.Blocks["lt_wifi_rssi"] = {
    init: function() {
      this.appendDummyInput().appendField("WiFi signal strength (dBm)");
      this.setOutput(true, "Number");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_rssi.tooltip"));
    }
  };

  // ── Tier 2: HTTP Client ────────────────────────────────────────────────────

  Blockly.Blocks["lt_http_get"] = {
    init: function() {
      this.appendValueInput("URL").setCheck("String").appendField("HTTP GET");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_http_get.tooltip"));
    }
  };

  Blockly.Blocks["lt_http_post"] = {
    init: function() {
      this.appendValueInput("URL").setCheck("String").appendField("HTTP POST");
      this.appendValueInput("BODY").setCheck("String").appendField("body");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_http_post.tooltip"));
    }
  };

  // ── Tier 3: WiFi Access Point ──────────────────────────────────────────────

  Blockly.Blocks["lt_wifi_ap_begin"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("WiFi AP start, SSID")
        .appendField(new Blockly.FieldTextInput("LotusAP"), "SSID")
        .appendField(t("wifi.label.password"))
        .appendField(new Blockly.FieldTextInput("12345678"), "PASS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_ap_begin.tooltip"));
    }
  };

  Blockly.Blocks["lt_wifi_ap_ip"] = {
    init: function() {
      this.appendDummyInput().appendField("WiFi AP IP");
      this.setOutput(true, "String");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_ap_ip.tooltip"));
    }
  };

  Blockly.Blocks["lt_wifi_ap_clients"] = {
    init: function() {
      this.appendDummyInput().appendField("WiFi AP clients connected");
      this.setOutput(true, "Number");
      this.setColour(WIFI_COLOR);
      this.setTooltip(t("wifi.lt_wifi_ap_clients.tooltip"));
    }
  };
};
