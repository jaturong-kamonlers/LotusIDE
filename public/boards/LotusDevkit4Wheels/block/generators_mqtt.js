module.exports = function(Blockly) {
  "use strict";

  var OA = Blockly.JavaScript.ORDER_ATOMIC;

  // -- MQTT Begin (Setup) --
  Blockly.JavaScript["lt_mqtt_begin"] = function(block) {
    var broker   = block.getFieldValue('BROKER')    || 'rail.kls.ac.th';
    var port     = block.getFieldValue('PORT')      || '1883';
    var clientId = block.getFieldValue('CLIENT_ID') || 'lotus-client';
    var ssid     = block.getFieldValue('SSID')      || 'SSID';
    var pass     = block.getFieldValue('PASS')      || 'PASSWORD';

    var code = '#EXTINC\n' +
      '#include <WiFi.h>\n' +
      '#include <WiFiClient.h>\n' +
      '#include <PubSubClient.h>\n' +
      '#include <map>\n' +
      '#END\n' +
      '#VARIABLE\n' +
      'WiFiClient _mqWifi;\n' +
      'PubSubClient _mqClient(_mqWifi);\n' +
      'String _mqTopicStr = "";\n' +
      'String _mqPayloadStr = "";\n' +
      // Per-topic store. _mqCB writes the latest payload into _mqStore[topic]
      // so multiple subscribed topics can be displayed simultaneously without
      // the single _mqPayloadStr being clobbered. Read it via lt_mqtt_payload_of.
      'std::map<String, String> _mqStore;\n' +
      // Function pointer defaults to null. lt_mqtt_on_message (if used) installs
      // a strong handler at static-init time. Two on-message blocks would
      // collide on _mqtt_on_message_impl, which is fine — the IDE only needs
      // one handler. If no block exists, the pointer stays null and _mqCB just
      // skips the callback.
      'void (*_mqtt_on_message_cb)() = nullptr;\n' +
      '#END\n' +
      '#FUNCTION\n' +
      // Append last 3 bytes of the ESP32 MAC to the user-supplied ID so multiple
      // boards in the same classroom don't keep kicking each other off the
      // broker (brokers disconnect any prior client sharing a client_id).
      'String _mqClientId() {\n' +
      '  static String _id = "";\n' +
      '  if (_id.length() == 0) {\n' +
      '    String _mac = WiFi.macAddress();\n' +
      '    _mac.replace(":", "");\n' +
      '    _id = String("' + clientId + '") + "-" + _mac.substring(6);\n' +
      '  }\n' +
      '  return _id;\n' +
      '}\n' +
      'void _mqCB(char* topic, byte* payload, unsigned int length) {\n' +
      '  _mqTopicStr = String(topic);\n' +
      '  _mqPayloadStr = "";\n' +
      '  for (unsigned int i = 0; i < length; i++) _mqPayloadStr += (char)payload[i];\n' +
      '  _mqStore[_mqTopicStr] = _mqPayloadStr;\n' +
      '  if (_mqtt_on_message_cb) _mqtt_on_message_cb();\n' +
      '}\n' +
      'void _mqReconnect() {\n' +
      '  if (!_mqClient.connected()) {\n' +
      '    Serial.print("MQTT reconnecting as ");\n' +
      '    Serial.println(_mqClientId());\n' +
      '    if (_mqClient.connect(_mqClientId().c_str())) {\n' +
      '      Serial.println("MQTT connected!");\n' +
      '    } else {\n' +
      '      Serial.print("MQTT connect failed, rc=");\n' +
      '      Serial.println(_mqClient.state());\n' +
      '    }\n' +
      '  }\n' +
      '}\n' +
      '#END\n' +
      // Wrap the runtime init (WiFi connect + broker connect) in #SETUP so
      // it lands in setup() regardless of where the user drops the block.
      // Without this, dropping lt_mqtt_begin in loop() would reconnect WiFi
      // every iteration.
      '#SETUP\n' +
      'WiFi.begin("' + ssid + '", "' + pass + '");\n' +
      'Serial.print("Connecting WiFi");\n' +
      'int _wifiTimeout = 0;\n' +
      'while (WiFi.status() != WL_CONNECTED && _wifiTimeout < 30) {\n' +
      '  delay(500);\n' +
      '  Serial.print(".");\n' +
      '  _wifiTimeout++;\n' +
      '}\n' +
      'Serial.println("");\n' +
      'if (WiFi.status() == WL_CONNECTED) {\n' +
      '  Serial.println("WiFi connected!");\n' +
      '  Serial.println(WiFi.localIP());\n' +
      '} else {\n' +
      '  Serial.println("WiFi connect failed!");\n' +
      '}\n' +
      '_mqClient.setServer("' + broker + '", ' + port + ');\n' +
      '_mqClient.setCallback(_mqCB);\n' +
      '_mqReconnect();\n' +
      '#END\n';
    return code;
  };

  // -- MQTT Loop --
  Blockly.JavaScript["lt_mqtt_loop"] = function(block) {
    return 'if (!_mqClient.connected()) { _mqReconnect(); }\n_mqClient.loop();\n';
  };

  // -- MQTT Publish (value inputs: TOPIC + VALUE) --
  Blockly.JavaScript["lt_mqtt_publish"] = function(block) {
    var topic = Blockly.JavaScript.valueToCode(block, 'TOPIC', OA) || '"lotus/sensor"';
    var value = Blockly.JavaScript.valueToCode(block, 'VALUE', OA) || '"hello"';
    return '_mqClient.publish(String(' + topic + ').c_str(), String(' + value + ').c_str());\n';
  };

  // -- MQTT Subscribe (value input: TOPIC) --
  Blockly.JavaScript["lt_mqtt_subscribe"] = function(block) {
    var topic = Blockly.JavaScript.valueToCode(block, 'TOPIC', OA) || '"lotus/cmd"';
    return '_mqClient.subscribe(String(' + topic + ').c_str());\n';
  };

  // -- MQTT When Message Received --
  // The block sits at workspace top level (no previousStatement), so we emit
  // the user code as a free function plus a static struct whose constructor
  // installs it into the _mqtt_on_message_cb pointer at C++ static-init time
  // (which runs before setup()). _mqCB invokes the pointer on every incoming
  // message. When no on_message block exists the pointer stays null and the
  // sketch still links cleanly.
  Blockly.JavaScript["lt_mqtt_on_message"] = function(block) {
    var statements = Blockly.JavaScript.statementToCode(block, 'DO');
    return '#FUNCTION\n' +
      'void _mqtt_on_message_impl() {\n' +
      statements +
      '}\n' +
      'struct _MqttHandlerReg { _MqttHandlerReg() { _mqtt_on_message_cb = _mqtt_on_message_impl; } };\n' +
      'static _MqttHandlerReg _mqttHandlerRegInstance;\n' +
      '#END\n';
  };

  Blockly.JavaScript["lt_mqtt_msg_topic"]   = function(block) { return ['_mqTopicStr',           OA]; };
  Blockly.JavaScript["lt_mqtt_msg_payload"] = function(block) { return ['_mqPayloadStr',         OA]; };
  Blockly.JavaScript["lt_mqtt_connected"]   = function(block) { return ['_mqClient.connected()', OA]; };

  // -- MQTT Payload of Topic (per-topic store lookup) --
  // Returns the latest payload received for the given topic, or "" if no
  // message has ever arrived for it. Use this when you need to display values
  // from several subscribed topics on the same screen.
  Blockly.JavaScript["lt_mqtt_payload_of"] = function(block) {
    var topic = Blockly.JavaScript.valueToCode(block, 'TOPIC', OA) || '""';
    return ['_mqStore[String(' + topic + ')]', OA];
  };
};
