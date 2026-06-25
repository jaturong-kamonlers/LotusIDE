/**
 * blocks_lt_more.js - LotusDevkit LT More Blocks
 * สีแต่ละกลุ่ม:
 *   Blynk 1.0  : #1565C0  น้ำเงินเข้ม
 *   Blynk 2.0  : #00ACC1  ฟ้าเทอร์ควอยซ์
 *   NETPIE2020 : #2E7D32  เขียวเข้ม
 *   MQTT       : #E65100  ส้มเข้ม
 *   UDP        : '#6A1B9A ม่วงเข้ม
 */

module.exports = function(Blockly) {
  'use strict';
var t = Blockly.lotus.t;

  var C_BLYNK1  = '#1565C0';
  var C_BLYNK2  = '#00ACC1';
  var C_NETPIE  = '#2E7D32';
  var C_MQTT    = '#E65100';
  var C_UDP     = '#6A1B9A';

  var I_B1  = '/static/icons/SVG/c10.svg';
  var I_B2  = '/static/icons/SVG/c10.svg';
  var I_NP  = '/static/icons/SVG/c11.svg';
  var I_MQ  = '/static/icons/SVG/c10.svg';
  var I_UDP = '/static/icons/SVG/c10.svg';
  var SZ = 22;

  // ================================================================
  // BLYNK 1.0 - สี น้ำเงินเข้ม (blocks เดิมใน blocks_iot.js มีอยู่แล้ว)
  // เพิ่ม setColour ที่ถูกต้องให้ blynk_iot blocks (override color only)
  // ================================================================
// ── Blynk 1.0 เพิ่มเติม ─────────────────────────────────────────────────────
// ── Blynk 1.0 เพิ่มเติม ─────────────────────────────────────────────────────
// ── Blynk 1.0 blocks ────────────────────────────────────────────────────
Blockly.Blocks["blynk_iot_virtual_write"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk write V")
      .appendField(new Blockly.FieldNumber(0, 0, 255), "PIN")
      .appendField("=");
    this.appendValueInput("VALUE")
      .setCheck(["Number", "String"]);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_virtual_write.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_virtual_read"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk read V")
      .appendField(new Blockly.FieldNumber(0, 0, 255), "PIN");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_virtual_read.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_on_virtual_write"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("when Blynk V")
      .appendField(new Blockly.FieldNumber(0, 0, 255), "PIN")
      .appendField("received");
    this.appendStatementInput("DO")
      .setCheck(null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_on_virtual_write.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_sync_all"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk sync all");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_sync_all.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_sync_virtual"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk sync V")
      .appendField(new Blockly.FieldNumber(0, 0, 255), "PIN");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_sync_virtual.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_push"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk push");
    this.appendValueInput("MESSAGE")
      .setCheck("String")
      .appendField("message");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_push.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_notify"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk notify");
    this.appendValueInput("MESSAGE")
      .setCheck("String")
      .appendField("message");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_notify.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_tweet"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk tweet");
    this.appendValueInput("MESSAGE")
      .setCheck("String")
      .appendField("message");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_tweet.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_run"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk run");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_run.tooltip"));
    this.setHelpUrl("");
  }
};

Blockly.Blocks["blynk_iot_connected"] = {
  init: function() {
    this.appendDummyInput()
      .appendField("Blynk connected?");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setColour(315);
    this.setTooltip(t("iotmore.blynk_iot_connected.tooltip"));
    this.setHelpUrl("");
  }
};
  // ================================================================
  // BLYNK 2.0 - สี ฟ้า #00ACC1
  // ================================================================
  Blockly.Blocks['lt_blynk2_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_B2, SZ, SZ, '*'))
        .appendField('Blynk2 begin  Auth')
        .appendField(new Blockly.FieldTextInput('your-token-here'), 'TOKEN')
        .appendField('Server blynk.cloud:80');
      this.appendDummyInput()
        .appendField('WiFi SSID')
        .appendField(new Blockly.FieldTextInput('SSID'), 'SSID')
        .appendField('Pass')
        .appendField(new Blockly.FieldTextInput('PASSWORD'), 'PASS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_BLYNK2);
      this.setTooltip(t("iotmore.lt_blynk2_begin.tooltip"));
    }
  };

  Blockly.Blocks['lt_blynk2_run'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_B2, SZ, SZ, '*'))
        .appendField('Blynk2 run');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_BLYNK2);
      this.setTooltip(t("iotmore.in_loop"));
    }
  };

  Blockly.Blocks['lt_blynk2_set_virtual'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_B2, SZ, SZ, '*'))
        .appendField('Blynk2 set V');
      this.appendValueInput('PIN').setCheck('Number');
      this.appendValueInput('VALUE').setCheck(null).appendField('=');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_BLYNK2);
      this.setTooltip(t("iotmore.lt_blynk2_set_virtual.tooltip"));
    }
  };

  Blockly.Blocks['lt_blynk2_get_virtual'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_B2, SZ, SZ, '*'))
        .appendField('Blynk2 get V')
        .appendField(new Blockly.FieldNumber(0, 0, 255), 'PIN');
      this.setOutput(true, null);
      this.setColour(C_BLYNK2);
      this.setTooltip(t("iotmore.lt_blynk2_get_virtual.tooltip"));
    }
  };

  Blockly.Blocks['lt_blynk2_on_write'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_B2, SZ, SZ, '*'))
        .appendField('Blynk2 when V')
        .appendField(new Blockly.FieldNumber(0, 0, 255), 'PIN')
        .appendField('received');
      this.appendStatementInput('DO').setCheck(null);
      this.setColour(C_BLYNK2);
      this.setTooltip(t("iotmore.lt_blynk2_on_write.tooltip"));
    }
  };

  Blockly.Blocks['lt_blynk2_connected'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_B2, SZ, SZ, '*'))
        .appendField('Blynk2 connected?');
      this.setOutput(true, 'Boolean');
      this.setColour(C_BLYNK2);
      this.setTooltip(t("iotmore.lt_blynk2_connected.tooltip"));
    }
  };

  // ================================================================
  // NETPIE 2020 - สี เขียวเข้ม #2E7D32
  // ================================================================
  Blockly.Blocks['lt_netpie_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 begin');
      this.appendDummyInput()
        .appendField('Client ID')
        .appendField(new Blockly.FieldTextInput('client-id'), 'CLIENT_ID');
      this.appendDummyInput()
        .appendField('Token')
        .appendField(new Blockly.FieldTextInput('token'), 'TOKEN')
        .appendField('Secret')
        .appendField(new Blockly.FieldTextInput('secret'), 'SECRET');
      this.appendDummyInput()
        .appendField('WiFi SSID')
        .appendField(new Blockly.FieldTextInput('SSID'), 'SSID')
        .appendField('Pass')
        .appendField(new Blockly.FieldTextInput('PASSWORD'), 'PASS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.lt_netpie_begin.tooltip"));
    }
  };

  Blockly.Blocks['lt_netpie_loop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 loop');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.in_loop"));
    }
  };

  Blockly.Blocks['lt_netpie_publish'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 publish topic')
        .appendField(new Blockly.FieldTextInput('@shadow/data/update'), 'TOPIC');
      this.appendDummyInput()
        .appendField('payload')
        .appendField(new Blockly.FieldTextInput('{"temp":25}'), 'PAYLOAD');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.lt_netpie_publish.tooltip"));
    }
  };

  Blockly.Blocks['lt_netpie_on_message'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 when message received');
      this.appendStatementInput('DO').setCheck(null);
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.lt_netpie_on_message.tooltip"));
    }
  };

  Blockly.Blocks['lt_netpie_msg_topic'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 topic');
      this.setOutput(true, 'String');
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.lt_netpie_msg_topic.tooltip"));
    }
  };

  Blockly.Blocks['lt_netpie_msg_payload'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 payload');
      this.setOutput(true, 'String');
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.lt_netpie_msg_payload.tooltip"));
    }
  };

  Blockly.Blocks['lt_netpie_connected'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_NP, SZ, SZ, '*'))
        .appendField('NETPIE2020 connected?');
      this.setOutput(true, 'Boolean');
      this.setColour(C_NETPIE);
      this.setTooltip(t("iotmore.lt_netpie_connected.tooltip"));
    }
  };

  // ================================================================
  // MQTT - สี ส้มเข้ม #E65100
  // ================================================================
  Blockly.Blocks['lt_mqtt_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT begin broker')
        .appendField(new Blockly.FieldTextInput('rail.kls.ac.th'), 'BROKER')
        .appendField('port')
        .appendField(new Blockly.FieldNumber(1883, 1, 65535), 'PORT');
      this.appendDummyInput()
        .appendField('Client ID')
        .appendField(new Blockly.FieldTextInput('lotus-client'), 'CLIENT_ID');
      this.appendDummyInput()
        .appendField('WiFi SSID')
        .appendField(new Blockly.FieldTextInput('SSID'), 'SSID')
        .appendField('Pass')
        .appendField(new Blockly.FieldTextInput('PASSWORD'), 'PASS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_begin.tooltip"));
    }
  };

  Blockly.Blocks['lt_mqtt_loop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT loop');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.in_loop"));
    }
  };

  Blockly.Blocks['lt_mqtt_publish'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT publish topic')
        .appendField(new Blockly.FieldTextInput('lotus/sensor'), 'TOPIC');
      this.appendDummyInput()
        .appendField('payload')
        .appendField(new Blockly.FieldTextInput('hello'), 'PAYLOAD');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_publish.tooltip"));
    }
  };

  Blockly.Blocks['lt_mqtt_subscribe'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT subscribe topic')
        .appendField(new Blockly.FieldTextInput('lotus/cmd'), 'TOPIC');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_subscribe.tooltip"));
    }
  };

  Blockly.Blocks['lt_mqtt_on_message'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT when message received');
      this.appendStatementInput('DO').setCheck(null);
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_on_message.tooltip"));
    }
  };

  Blockly.Blocks['lt_mqtt_msg_topic'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT topic');
      this.setOutput(true, 'String');
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_msg_topic.tooltip"));
    }
  };

  Blockly.Blocks['lt_mqtt_msg_payload'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT payload');
      this.setOutput(true, 'String');
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_msg_payload.tooltip"));
    }
  };

  Blockly.Blocks['lt_mqtt_connected'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_MQ, SZ, SZ, '*'))
        .appendField('MQTT connected?');
      this.setOutput(true, 'Boolean');
      this.setColour(C_MQTT);
      this.setTooltip(t("iotmore.lt_mqtt_connected.tooltip"));
    }
  };

  // ================================================================
  // UDP - สี ม่วงเข้ม #6A1B9A
  // ================================================================
  Blockly.Blocks['lt_udp_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_UDP, SZ, SZ, '*'))
        .appendField('UDP begin port')
        .appendField(new Blockly.FieldNumber(4210, 1, 65535), 'PORT');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_UDP);
      this.setTooltip(t("iotmore.lt_udp_begin.tooltip"));
    }
  };

  Blockly.Blocks['lt_udp_send'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_UDP, SZ, SZ, '*'))
        .appendField('UDP send to IP')
        .appendField(new Blockly.FieldTextInput('192.168.1.255'), 'IP')
        .appendField('port')
        .appendField(new Blockly.FieldNumber(4210, 1, 65535), 'PORT')
        .appendField('data')
        .appendField(new Blockly.FieldTextInput('hello'), 'DATA');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_UDP);
      this.setTooltip(t("iotmore.lt_udp_send.tooltip"));
    }
  };

  Blockly.Blocks['lt_udp_receive'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_UDP, SZ, SZ, '*'))
        .appendField('UDP received data');
      this.setOutput(true, 'String');
      this.setColour(C_UDP);
      this.setTooltip(t("iotmore.lt_udp_receive.tooltip"));
    }
  };

  Blockly.Blocks['lt_udp_remote_ip'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_UDP, SZ, SZ, '*'))
        .appendField('UDP remote IP');
      this.setOutput(true, 'String');
      this.setColour(C_UDP);
      this.setTooltip(t("iotmore.lt_udp_remote_ip.tooltip"));
    }
  };

  Blockly.Blocks['lt_udp_packet_size'] = {
    init: function() {
      this.appendDummyInput()
        .appendField(new Blockly.FieldImage(I_UDP, SZ, SZ, '*'))
        .appendField('UDP packet size');
      this.setOutput(true, 'Number');
      this.setColour(C_UDP);
      this.setTooltip(t("iotmore.lt_udp_packet_size.tooltip"));
    }
  };

};
