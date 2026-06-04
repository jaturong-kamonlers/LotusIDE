module.exports = function(Blockly) {
  "use strict";

  var mqttColor = 20;

  // -- MQTT Begin --
  Blockly.Blocks["lt_mqtt_begin"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("MQTT begin broker")
        .appendField(new Blockly.FieldTextInput("rail.kls.ac.th"), "BROKER")
        .appendField("port")
        .appendField(new Blockly.FieldNumber(1883, 1, 65535), "PORT");
      this.appendDummyInput()
        .appendField("Client ID")
        .appendField(new Blockly.FieldTextInput("lotus-client"), "CLIENT_ID");
      this.appendDummyInput()
        .appendField("WiFi SSID")
        .appendField(new Blockly.FieldTextInput("SSID"), "SSID")
        .appendField("Pass")
        .appendField(new Blockly.FieldTextInput("PASSWORD"), "PASS");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(mqttColor);
      this.setTooltip("Connect to MQTT broker");
    }
  };

  // -- MQTT Loop --
  Blockly.Blocks["lt_mqtt_loop"] = {
    init: function() {
      this.appendDummyInput().appendField("MQTT loop");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(mqttColor);
      this.setTooltip("Call in loop()");
    }
  };

  // -- MQTT Publish (value input - supports sensor blocks) --
  Blockly.Blocks["lt_mqtt_publish"] = {
    init: function() {
      this.appendValueInput("TOPIC")
        .setCheck(null)
        .appendField("MQTT publish topic");
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("payload");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(mqttColor);
      this.setTooltip("Publish to MQTT topic (supports sensor values)");
    }
  };

  // -- MQTT Subscribe (value input) --
  Blockly.Blocks["lt_mqtt_subscribe"] = {
    init: function() {
      this.appendValueInput("TOPIC")
        .setCheck(null)
        .appendField("MQTT subscribe topic");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(mqttColor);
      this.setTooltip("Subscribe to MQTT topic");
    }
  };

  // -- MQTT When Message Received --
  Blockly.Blocks["lt_mqtt_on_message"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("MQTT when message received");
      this.appendStatementInput("DO");
      this.setColour(mqttColor);
      this.setTooltip("Code to run when MQTT message received");
    }
  };

  // -- MQTT Topic (return value) --
  Blockly.Blocks["lt_mqtt_msg_topic"] = {
    init: function() {
      this.appendDummyInput().appendField("MQTT topic");
      this.setOutput(true, "String");
      this.setColour(mqttColor);
      this.setTooltip("Get received MQTT topic");
    }
  };

  // -- MQTT Payload (return value) --
  Blockly.Blocks["lt_mqtt_msg_payload"] = {
    init: function() {
      this.appendDummyInput().appendField("MQTT payload");
      this.setOutput(true, "String");
      this.setColour(mqttColor);
      this.setTooltip("Get received MQTT payload");
    }
  };

  // -- MQTT Connected? --
  Blockly.Blocks["lt_mqtt_connected"] = {
    init: function() {
      this.appendDummyInput().appendField("MQTT connected?");
      this.setOutput(true, "Boolean");
      this.setColour(mqttColor);
      this.setTooltip("Check MQTT connection");
    }
  };

  // -- MQTT Payload of Topic — per-topic store lookup --
  Blockly.Blocks["lt_mqtt_payload_of"] = {
    init: function() {
      this.appendValueInput("TOPIC")
        .setCheck(null)
        .appendField("MQTT payload of topic");
      this.setOutput(true, "String");
      this.setColour(mqttColor);
      this.setTooltip("Get the latest payload received for the given topic — works for multiple subscribed topics at once");
    }
  };

};
