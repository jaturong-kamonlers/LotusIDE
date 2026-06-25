module.exports = function(Blockly) {
  'use strict';
var t = Blockly.lotus.t;
  
  var sensor_colour = Blockly.Msg.SENSOR_HUE || 230;  // สีฟ้าสำหรับเซนเซอร์

  // ===== ปุ่มกด (Buttons) =====
  Blockly.Blocks['button_1_status'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Switch 1 is pressed (Green)");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.button_1_status.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['button_2_status'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Switch 2 is pressed (Red)");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.button_2_status.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== เซนเซอร์อนาล็อก =====
  Blockly.Blocks['analog_sensor'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Analog sensor")
          .appendField(new Blockly.FieldDropdown([
            ["1 (GPIO35 - Knob)", "35"],
            ["2 (GPIO34)", "34"],
            ["3 (GPIO39)", "39"],
            ["4 (GPIO36)", "36"],
            ["5 (GPIO12)", "12"],
            ["6 (GPIO13)", "13"]
          ]), "pin");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.analog_sensor.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== เซนเซอร์ดิจิตอล =====
  Blockly.Blocks['digital_sensor'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Digital sensor")
          .appendField(new Blockly.FieldDropdown([
            ["1 (GPIO35)", "35"],
            ["2 (GPIO34)", "34"],
            ["3 (GPIO39)", "39"],
            ["4 (GPIO36)", "36"],
            ["5 (GPIO12)", "12"],
            ["6 (GPIO13)", "13"]
          ]), "pin");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.digital_sensor.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== TCS Color Sensor =====
  Blockly.Blocks['TCS_read_rgb'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("TCS34725 read")
          .appendField(new Blockly.FieldDropdown([
            ["Red", "1"],
            ["Green", "2"],
            ["Blue", "3"]
          ]), "color");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.TCS_read_rgb.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== Knob (ตัวต้านทานปรับค่าได้) =====
  Blockly.Blocks['Knob_status'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Read Knob (GPIO35)");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.Knob_status.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== ปุ่มเริ่มต้น (Start Button) =====
  Blockly.Blocks['sw1_press'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Wait for Start Button (GPIO27)");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.sw1_press.tooltip"));
    }
  };

  // ===== Buzzer =====
  Blockly.Blocks['WIT_beep'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Buzzer beep (200ms)");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);  // สีม่วงสำหรับ output
      this.setTooltip(t("legacy.WIT_beep.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['WIT_beep_delay'] = {
    init: function() {
      this.appendValueInput("_delay")
          .setCheck("Number")
          .appendField("Buzzer beep for");
      this.appendDummyInput()
          .appendField("ms");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip(t("legacy.WIT_beep_delay.tooltip"));
    }
  };

  Blockly.Blocks['WIT_beep_on'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Buzzer ON");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip(t("legacy.WIT_beep_on.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['WIT_beep_off'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Buzzer OFF");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(315);
      this.setTooltip(t("legacy.WIT_beep_off.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== BMP280 =====
  Blockly.Blocks['bmp280_begin'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Initialize BMP280 sensor");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.bmp280_begin.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['bmp280_read_temperature'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("BMP280 temperature (°C)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.bmp280_read_temperature.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['bmp280_read_pressure'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("BMP280 pressure (hPa)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.bmp280_read_pressure.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['bmp280_read_altitude'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("BMP280 altitude (m)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.bmp280_read_altitude.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['bmp280_read_all'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("BMP280 read all");
      this.appendDummyInput()
          .appendField("temperature →")
          .appendField(new Blockly.FieldVariable("temp"), "temp_var");
      this.appendDummyInput()
          .appendField("pressure →")
          .appendField(new Blockly.FieldVariable("pressure"), "pressure_var");
      this.appendDummyInput()
          .appendField("altitude →")
          .appendField(new Blockly.FieldVariable("altitude"), "altitude_var");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.bmp280_read_all.tooltip"));
      this.setHelpUrl("");
    }
  };

  // ===== MLX90614 Infrared Temperature Sensor =====
  Blockly.Blocks['mlx90614_begin'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("Initialize MLX90614 sensor");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.mlx90614_begin.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['mlx90614_read_object'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("MLX90614 object temp (°C)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.mlx90614_read_object.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['mlx90614_read_ambient'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("MLX90614 ambient temp (°C)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.mlx90614_read_ambient.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['mlx90614_read_both'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("MLX90614 read both");
      this.appendDummyInput()
          .appendField("object temp →")
          .appendField(new Blockly.FieldVariable("obj_temp"), "obj_var");
      this.appendDummyInput()
          .appendField("ambient temp →")
          .appendField(new Blockly.FieldVariable("amb_temp"), "amb_var");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.mlx90614_read_both.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['mlx90614_read_object_f'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("MLX90614 object temp (°F)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.mlx90614_read_object_f.tooltip"));
      this.setHelpUrl("");
    }
  };

  Blockly.Blocks['mlx90614_read_ambient_f'] = {
    init: function() {
      this.appendDummyInput()
          .appendField("MLX90614 ambient temp (°F)");
      this.setOutput(true, "Number");
      this.setColour(sensor_colour);
      this.setTooltip(t("legacy.mlx90614_read_ambient_f.tooltip"));
      this.setHelpUrl("");
    }
  };
    //////////////////////
  Blockly.Blocks['math_map'] = {
  init: function() {

    this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("map");

    this.appendDummyInput()
        .appendField("from")
        .appendField(new Blockly.FieldNumber(0), "FROM_LOW")
        .appendField("to")
        .appendField(new Blockly.FieldNumber(1023), "FROM_HIGH")
        .appendField("out min")
        .appendField(new Blockly.FieldNumber(0), "TO_LOW")
        .appendField("out max")
        .appendField(new Blockly.FieldNumber(100), "TO_HIGH");

    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour(230);
    this.setTooltip("Map value from one range to another");
    this.setHelpUrl("");
  }
};
  ///////////////////
  
};