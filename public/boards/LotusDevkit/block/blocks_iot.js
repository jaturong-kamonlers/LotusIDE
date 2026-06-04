module.exports = function(Blockly) {
  "use strict";

  // ── Blynk 1.0 begin ─────────────────────────────────────────────────────
  // Server: rail.kls.ac.th Port: 8080 (เปลี่ยนได้)
  Blockly.Blocks["blynk_iot_setup_code"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Blynk 1.0 Setup")
        .appendField("Server")
        .appendField(new Blockly.FieldTextInput("rail.kls.ac.th"), "server")
        .appendField("Port")
        .appendField(new Blockly.FieldNumber(8080, 1, 65535), "port")
        .appendField("Auth Token")
        .appendField(new Blockly.FieldTextInput("your-auth-token"), "token")
        .appendField("SSID")
        .appendField(new Blockly.FieldTextInput("MyWiFi"), "ssid")
        .appendField("Pass")
        .appendField(new Blockly.FieldTextInput("password"), "pass");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip("เชื่อมต่อ Blynk 1.0 — Server: rail.kls.ac.th Port: 8080");
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks["blynk_iot_run"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Blynk 1.0 run");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip("เรียกใน loop() เพื่อให้ Blynk ทำงาน");
      this.setHelpUrl("");
    }
  };

  // ── USB Out ──────────────────────────────────────────────────────────────
  Blockly.Blocks["usb_out_on"] = {
    init: function() {
      this.appendDummyInput().appendField("USB Out status : ON");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["usb_out_off"] = {
    init: function() {
      this.appendDummyInput().appendField("USB Out status : OFF");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip(""); this.setHelpUrl("");
    }
  };

  // ── HTTP ─────────────────────────────────────────────────────────────────
  Blockly.Blocks["http_post_data"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("HTTP POST URL")
        .appendField(new Blockly.FieldTextInput("http://www.domain.com/api.php"), "http_url")
        .appendField("with data")
        .appendField(new Blockly.FieldTextInput("param1=data1&param2=data2"), "data");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip("Post data to Web"); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["http_get_data"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("HTTP GET URL")
        .appendField(new Blockly.FieldTextInput("http://www.domain.com/api.php?param=data"), "http_url");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip("Get data"); this.setHelpUrl("");
    }
  };

  // ── PMS Dust ─────────────────────────────────────────────────────────────
  Blockly.Blocks["pms_dust_setup"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("PMS Setup Tx PIN")
        .appendField(new Blockly.FieldTextInput("17"), "tx")
        .appendField("Rx PIN")
        .appendField(new Blockly.FieldTextInput("16"), "rx");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip("PMS Data PIN Tx Rx"); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["pms_dust_read"] = {
    init: function() {
      this.appendDummyInput().appendField("PMS Read data");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip("PMS Read data"); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["pms_dust_read_pm10"] = {
    init: function() {
      this.appendDummyInput().appendField("PMS PM 1.0");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["pms_dust_read_pm25"] = {
    init: function() {
      this.appendDummyInput().appendField("PMS PM 2.5");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["pms_dust_read_pm100"] = {
    init: function() {
      this.appendDummyInput().appendField("PMS PM 10.0");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230);
      this.setTooltip(""); this.setHelpUrl("");
    }
  };

  // ── Arduino custom ───────────────────────────────────────────────────────
  Blockly.Blocks["arduino_include_file"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Include file \"")
        .appendField(new Blockly.FieldTextInput("math.h"), "INC")
        .appendField("\"");
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["arduino_default_include_file"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Include file <")
        .appendField(new Blockly.FieldTextInput("math.h"), "DINC")
        .appendField(">");
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["arduino_global_var"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Global variable")
        .appendField(new Blockly.FieldTextInput("int myVar;"), "VAR");
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["arduino_custom_code"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Custom code")
        .appendField(new Blockly.FieldTextInput("int myVar = 10;"), "CUSTOM_CODE");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["arduino_custom_return_float"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Custom code return float")
        .appendField(new Blockly.FieldTextInput("sqrt(2)"), "CUSTOM_CODE_VALUE");
      this.setInputsInline(true);
      this.setOutput(true, "float");
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["arduino_custom_return_int"] = {
    init: function() {
      this.appendDummyInput()
        .appendField("Custom code return integer")
        .appendField(new Blockly.FieldTextInput("round(1234.56)"), "CUSTOM_CODE_VALUE");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };

  Blockly.Blocks["io_map_value"] = {
    init: function() {
      this.appendValueInput("number").setCheck("Number").appendField("map(value :");
      this.appendValueInput("x1").setCheck("Number").appendField(", x1 :");
      this.appendValueInput("y1").setCheck("Number").appendField(", y1 :");
      this.appendValueInput("x2").setCheck("Number").appendField(", x2 :");
      this.appendValueInput("y2").setCheck("Number").appendField(", y2 :");
      this.setInputsInline(true);
      this.setOutput(true, null);
      this.setColour(230); this.setTooltip(""); this.setHelpUrl("");
    }
  };
};
