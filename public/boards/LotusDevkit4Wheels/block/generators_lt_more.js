/**
 * generators_lt_more.js - LotusDevkit IoT Generators
 * Fix:
 *   - Blynk server → rail.kls.ac.th port 8080
 *   - MQTT broker  → rail.kls.ac.th port 1883
 *   - UDP send: ใช้ getFieldValue แทน valueToCode สำหรับ IP (String)
 *               ป้องกัน TypeError: Cannot read property 'replace' of null
 */
module.exports = function(Blockly) {
  'use strict';

  var OA = Blockly.JavaScript.ORDER_ATOMIC;

  // helper: ป้องกัน null จาก valueToCode สำหรับ Number
  function safeNum(v, d) { return (v && v !== 'null' && v !== '') ? v : (d || '0'); }
  // helper สำหรับ String ที่ใช้ valueToCode (ไม่ใช้กับ text block โดยตรง)
  function safeCode(v, d) { return (v && v !== 'null' && v !== '') ? v : (d || '""'); }
///////////////////////////////////////////////////////////////////
// ── Blynk 1.0 Generators เพิ่มเติม ─────────────────────────────────────────
Blockly.JavaScript["blynk_iot_virtual_write"] = function(block) {
  var pin = block.getFieldValue('PIN');
  var value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  
  var code = `Blynk.virtualWrite(V${pin}, ${value});\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_virtual_read"] = function(block) {
  var pin = block.getFieldValue('PIN');
  
  var code = `param[0].asFloat()`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript["blynk_iot_on_virtual_write"] = function(block) {
  var pin = block.getFieldValue('PIN');
  var statements = Blockly.JavaScript.statementToCode(block, 'DO');
  
  var code = `#FUNCTION
BLYNK_WRITE(V${pin}) {
  ${statements}
}
#END
`;
  return code;
};

Blockly.JavaScript["blynk_iot_sync_all"] = function(block) {
  var code = `Blynk.syncAll();\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_sync_virtual"] = function(block) {
  var pin = block.getFieldValue('PIN');
  
  var code = `Blynk.syncVirtual(V${pin});\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_email"] = function(block) {
  var email = Blockly.JavaScript.valueToCode(block, 'EMAIL', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  var subject = Blockly.JavaScript.valueToCode(block, 'SUBJECT', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  var body = Blockly.JavaScript.valueToCode(block, 'BODY', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  
  var code = `Blynk.email(${email}, ${subject}, ${body});\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_push"] = function(block) {
  var message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  
  var code = `Blynk.push(${message});\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_notify"] = function(block) {
  var message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  
  var code = `Blynk.notify(${message});\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_tweet"] = function(block) {
  var message = Blockly.JavaScript.valueToCode(block, 'MESSAGE', Blockly.JavaScript.ORDER_ATOMIC) || '""';
  
  var code = `Blynk.tweet(${message});\n`;
  return code;
};

Blockly.JavaScript["blynk_iot_connected"] = function(block) {
  var code = `Blynk.connected()`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

///////////////////////////////////////////////////////////
  // ================================================================
  // BLYNK 2.0 — server: blynk.cloud (Blynk official), port: 80
  // ================================================================
  Blockly.JavaScript['lt_blynk2_begin'] = function(block) {
    var token = block.getFieldValue('TOKEN');
    var ssid  = block.getFieldValue('SSID');
    var pass  = block.getFieldValue('PASS');
    var code  = '#EXTINC\n#include <BlynkSimpleEsp32.h>\n#END\n';
    code += '#VARIABLE\nchar _blynk2_auth[] = "' + token + '";\n#END\n';
    // #SETUP wrap — WiFi.begin + Blynk.begin must run once at startup.
    code += '#SETUP\n';
    code += 'WiFi.begin("' + ssid + '", "' + pass + '");\n';
    code += 'while(WiFi.status()!=WL_CONNECTED){ delay(500); }\n';
    code += 'Blynk.begin(_blynk2_auth, "' + ssid + '", "' + pass
          + '", "blynk.cloud", 80);\n';
    code += '#END\n';
    return code;
  };

  Blockly.JavaScript['lt_blynk2_run'] = function(block) {
    return 'Blynk.run();\n';
  };

  Blockly.JavaScript['lt_blynk2_set_virtual'] = function(block) {
    var pin   = safeNum(Blockly.JavaScript.valueToCode(block, 'PIN',   OA), '0');
    var value = safeCode(Blockly.JavaScript.valueToCode(block, 'VALUE', OA), '0');
    return 'Blynk.virtualWrite(V' + pin + ', ' + value + ');\n';
  };

  Blockly.JavaScript['lt_blynk2_get_virtual'] = function(block) {
    return ['param[0].asFloat()', OA];
  };

  Blockly.JavaScript['lt_blynk2_on_write'] = function(block) {
    var pin   = block.getFieldValue('PIN');
    var stmts = Blockly.JavaScript.statementToCode(block, 'DO');
    return '#FUNCTION\nBLYNK_WRITE(V' + pin + '){\n' + stmts + '}\n#END\n';
  };

  Blockly.JavaScript['lt_blynk2_connected'] = function(block) {
    return ['Blynk.connected()', OA];
  };

  // ================================================================
  // NETPIE 2020
  // ================================================================
  Blockly.JavaScript['lt_netpie_begin'] = function(block) {
    var cid    = block.getFieldValue('CLIENT_ID');
    var token  = block.getFieldValue('TOKEN');
    var secret = block.getFieldValue('SECRET');
    var ssid   = block.getFieldValue('SSID');
    var pass   = block.getFieldValue('PASS');
    var code = '#EXTINC\n#include <WiFiClient.h>\n#include <PubSubClient.h>\n#END\n';
    code += '#VARIABLE\n';
    code += 'WiFiClient _npWifi;\nPubSubClient _npClient(_npWifi);\n';
    code += 'String _npTopic="";\nString _npPayload="";\n';
    code += 'void _netpie_on_message_handler();\n';
    code += 'void _npCB(char* t,byte* p,unsigned int l){\n';
    code += '  _npTopic=String(t);\n  _npPayload="";\n';
    code += '  for(unsigned int i=0;i<l;i++) _npPayload+=(char)p[i];\n';
    code += '  _netpie_on_message_handler();\n}\n';
    code += 'void _npReconnect(){\n';
    code += '  while(!_npClient.connected()){\n';
    code += '    _npClient.connect("' + cid + '","' + token + '","' + secret + '");\n';
    code += '    if(!_npClient.connected()) delay(5000);\n  }\n}\n';
    code += '#END\n';
    // #SETUP wrap — keep WiFi + broker handshake in setup().
    code += '#SETUP\n';
    code += 'WiFi.begin("' + ssid + '","' + pass + '");\n';
    code += 'while(WiFi.status()!=WL_CONNECTED){ delay(500); }\n';
    code += '_npClient.setServer("broker.netpie.io",1883);\n';
    code += '_npClient.setCallback(_npCB);\n_npReconnect();\n';
    code += '#END\n';
    return code;
  };

  Blockly.JavaScript['lt_netpie_loop'] = function(block) {
    return 'if(!_npClient.connected()){ _npReconnect(); } _npClient.loop();\n';
  };

  Blockly.JavaScript['lt_netpie_publish'] = function(block) {
    var topic   = block.getFieldValue('TOPIC')   || '@shadow/data/update';
    var payload = block.getFieldValue('PAYLOAD') || '';
    return '_npClient.publish("' + topic + '","' + payload + '");\n';
  };

  Blockly.JavaScript['lt_netpie_on_message'] = function(block) {
    var stmts = Blockly.JavaScript.statementToCode(block, 'DO');
    return '#FUNCTION\nvoid _netpie_on_message_handler(){\n' + stmts + '}\n#END\n';
  };

  Blockly.JavaScript['lt_netpie_msg_topic']   = function(block) { return ['_npTopic',   OA]; };
  Blockly.JavaScript['lt_netpie_msg_payload'] = function(block) { return ['_npPayload', OA]; };
  Blockly.JavaScript['lt_netpie_connected']   = function(block) { return ['_npClient.connected()', OA]; };

  // ================================================================
  // MQTT — broker: rail.kls.ac.th, port: 1883
  // ================================================================
  Blockly.JavaScript['lt_mqtt_begin'] = function(block) {
    var cid    = block.getFieldValue('CLIENT_ID');
    var ssid   = block.getFieldValue('SSID');
    var pass   = block.getFieldValue('PASS');
    var broker = block.getFieldValue('BROKER') || 'rail.kls.ac.th';
    var port   = block.getFieldValue('PORT')   || '1883';
    var code = '#EXTINC\n#include <WiFiClient.h>\n#include <PubSubClient.h>\n#END\n';
    code += '#VARIABLE\n';
    code += 'WiFiClient _mqWifi;\nPubSubClient _mqClient(_mqWifi);\n';
    code += 'String _mqTopic="";\nString _mqPayload="";\n';
    code += 'void _mqtt_on_message_handler();\n';
    code += 'void _mqCB(char* t,byte* p,unsigned int l){\n';
    code += '  _mqTopic=String(t);\n  _mqPayload="";\n';
    code += '  for(unsigned int i=0;i<l;i++) _mqPayload+=(char)p[i];\n';
    code += '  _mqtt_on_message_handler();\n}\n';
    code += 'void _mqReconnect(){\n';
    code += '  while(!_mqClient.connected()){\n';
    code += '    _mqClient.connect("' + cid + '");\n';
    code += '    if(!_mqClient.connected()) delay(5000);\n  }\n}\n';
    code += '#END\n';
    // Dead code — generators_mqtt.js's lt_mqtt_begin wins (loads later). Kept
    // in #SETUP wrap anyway so it stays correct if load order ever flips.
    code += '#SETUP\n';
    code += 'WiFi.begin("' + ssid + '","' + pass + '");\n';
    code += 'while(WiFi.status()!=WL_CONNECTED){ delay(500); }\n';
    code += '_mqClient.setServer("' + broker + '",' + port + ');\n';
    code += '_mqClient.setCallback(_mqCB);\n_mqReconnect();\n';
    code += '#END\n';
    return code;
  };

  Blockly.JavaScript['lt_mqtt_loop'] = function(block) {
    return 'if(!_mqClient.connected()){ _mqReconnect(); } _mqClient.loop();\n';
  };

  Blockly.JavaScript['lt_mqtt_publish'] = function(block) {
    var topic   = block.getFieldValue('TOPIC')   || 'lotus/sensor';
    var payload = block.getFieldValue('PAYLOAD') || '';
    return '_mqClient.publish("' + topic + '","' + payload + '");\n';
  };

  Blockly.JavaScript['lt_mqtt_subscribe'] = function(block) {
    var topic = block.getFieldValue('TOPIC') || 'lotus/cmd';
    return '_mqClient.subscribe("' + topic + '");\n';
  };

  Blockly.JavaScript['lt_mqtt_on_message'] = function(block) {
    var stmts = Blockly.JavaScript.statementToCode(block, 'DO');
    return '#FUNCTION\nvoid _mqtt_on_message_handler(){\n' + stmts + '}\n#END\n';
  };

  Blockly.JavaScript['lt_mqtt_msg_topic']   = function(block) { return ['_mqTopic',   OA]; };
  Blockly.JavaScript['lt_mqtt_msg_payload'] = function(block) { return ['_mqPayload', OA]; };
  Blockly.JavaScript['lt_mqtt_connected']   = function(block) { return ['_mqClient.connected()', OA]; };

  // ================================================================
  // UDP — FIX: IP ใช้ getFieldValue ป้องกัน null → quote_ crash
  // ================================================================
  Blockly.JavaScript['lt_udp_begin'] = function(block) {
    var port = block.getFieldValue('PORT');
    var code = '#EXTINC\n#include <WiFiUdp.h>\n#END\n';
    code += '#VARIABLE\n';
    code += 'WiFiUDP _udp;\nchar _udpBuf[512];\n';
    code += 'String _udpData="";\nString _udpRemoteIP="";\n';
    code += 'void _udpPoll(){\n';
    code += '  int sz=_udp.parsePacket();\n';
    code += '  if(sz>0){\n';
    code += '    _udpRemoteIP=_udp.remoteIP().toString();\n';
    code += '    int len=_udp.read(_udpBuf,sizeof(_udpBuf)-1);\n';
    code += '    if(len>0){ _udpBuf[len]=0; _udpData=String(_udpBuf); }\n';
    code += '  }\n}\n';
    code += '#END\n';
    // #SETUP wrap — _udp.begin() opens the UDP socket once.
    code += '#SETUP\n_udp.begin(' + port + ');\n#END\n';
    return code;
  };

  // FIX: ใช้ getFieldValue สำหรับ IP ซึ่ง block_lt_more ใช้ FieldTextInput
  //      ป้องกัน valueToCode คืน null แล้ว quote_() crash
  Blockly.JavaScript['lt_udp_send'] = function(block) {
    var ip   = block.getFieldValue('IP')   || '192.168.1.255';
    var port = block.getFieldValue('PORT') || '4210';
    var data = block.getFieldValue('DATA') || '';
    var code = '_udp.beginPacket("' + ip + '",' + port + ');\n';
    code += '_udp.print(String("' + data + '"));\n';
    code += '_udp.endPacket();\n';
    return code;
  };

  Blockly.JavaScript['lt_udp_receive'] = function(block) {
    return ['(_udpPoll(),_udpData)', OA];
  };

  Blockly.JavaScript['lt_udp_remote_ip']   = function(block) { return ['_udpRemoteIP',    OA]; };
  Blockly.JavaScript['lt_udp_packet_size'] = function(block) { return ['_udp.parsePacket()', OA]; };
};
