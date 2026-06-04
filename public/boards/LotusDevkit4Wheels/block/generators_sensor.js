module.exports = function(Blockly) {
  'use strict';

  // ===== Buttons =====
  Blockly.JavaScript['button_1_status'] = function(block) {
    var code = '(botton.digitalRead(P1))';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['button_2_status'] = function(block) {
    var code = '(botton.digitalRead(P2))';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ===== Analog Sensor =====
  Blockly.JavaScript['analog_sensor'] = function(block) {
    var value_pin = block.getFieldValue('pin');
    var code = `analogRead(${value_pin})`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ===== Digital Sensor =====
  Blockly.JavaScript['digital_sensor'] = function(block) {
    var value_pin = block.getFieldValue('pin');
    var code = `(analogRead(${value_pin}) > 500) ? 1 : 0`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ===== TCS Color Sensor =====
  Blockly.JavaScript['TCS_read_rgb'] = function(block) {
    var value_color = block.getFieldValue('color');
    var code = `TCS_Read(${value_color})`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ===== Knob =====
  Blockly.JavaScript['Knob_status'] = function(block) {
    var code = '(_Knob())';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ===== Buzzer =====
  Blockly.JavaScript['WIT_beep'] = function(block) {
    var code = 'beep();\n';
    return code;
  };

  Blockly.JavaScript['WIT_beep_on'] = function(block) {
    var code = 'beep_on();\n';
    return code;
  };

  Blockly.JavaScript['WIT_beep_off'] = function(block) {
    var code = 'beep_off();\n';
    return code;
  };

  Blockly.JavaScript['WIT_beep_delay'] = function(block) {
    var value_delay = Blockly.JavaScript.valueToCode(block, '_delay', Blockly.JavaScript.ORDER_ATOMIC) || '0';
    var code = 'beep(' + value_delay + ');\n';
    return code;
  };

  // ===== Start Button =====
  Blockly.JavaScript['sw1_press'] = function(block) {
    var code = 'wait();\n';
    return code;
  };

  // ===== BMP280 =====
  Blockly.JavaScript['bmp280_begin'] = function(block) {
    var code = `
  // Initialize BMP280 sensor
  Serial.println("Initializing BMP280...");
  if (!bmp280.begin()) {
    Serial.println("BMP280 not found!");
    display.clear();
    display.setFont(ArialMT_Plain_10);
    display.drawString(0, 0, "BMP280 Error!");
    display.drawString(0, 12, "Check connections");
    display.display();
    delay(2000);
  } else {
    Serial.println("BMP280 initialized successfully");
  }
    `;
    return code;
  };

  Blockly.JavaScript['bmp280_read_temperature'] = function(block) {
    var code = 'bmp280.readTemperature()';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['bmp280_read_pressure'] = function(block) {
    var code = 'bmp280.readPressureHPa()';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['bmp280_read_altitude'] = function(block) {
    var code = 'bmp280.readAltitude(1013.25)';  // 1013.25 hPa ที่ระดับน้ำทะเล
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['bmp280_read_all'] = function(block) {
    var temp_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('temp_var'), Blockly.Variables.NAME_TYPE);
    var pressure_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('pressure_var'), Blockly.Variables.NAME_TYPE);
    var altitude_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('altitude_var'), Blockly.Variables.NAME_TYPE);
    
    var code = `
  // Read all BMP280 sensors
  ${temp_var} = bmp280.readTemperature();
  ${pressure_var} = bmp280.readPressureHPa();
  ${altitude_var} = bmp280.readAltitude(1013.25);
  
  // Debug output
  Serial.printf("BMP280 - Temp: %.2f C, Pressure: %.2f hPa, Alt: %.2f m\\n", 
                ${temp_var}, ${pressure_var}, ${altitude_var});
    `;
    return code;
  };

  // ===== MLX90614 =====
  Blockly.JavaScript['mlx90614_begin'] = function(block) {
    var code = `
  // Initialize MLX90614 sensor
  Serial.println("Initializing MLX90614...");
  if (!mlx90614.begin()) {
    Serial.println("MLX90614 not found at address 0x5A!");
    display.clear();
    display.setFont(ArialMT_Plain_10);
    display.drawString(0, 0, "MLX90614 Error!");
    display.drawString(0, 12, "Check connections");
    display.drawString(0, 24, "I2C addr: 0x5A");
    display.display();
    delay(2000);
  } else {
    Serial.println("MLX90614 initialized successfully");
    display.clear();
    display.setFont(ArialMT_Plain_10);
    display.drawString(0, 0, "MLX90614 OK!");
    display.drawString(0, 12, "IR Temp Sensor");
    display.display();
    delay(1000);
  }
    `;
    return code;
  };

  Blockly.JavaScript['mlx90614_read_object'] = function(block) {
    var code = 'mlx90614.readObjectTempC()';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['mlx90614_read_ambient'] = function(block) {
    var code = 'mlx90614.readAmbientTempC()';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['mlx90614_read_object_f'] = function(block) {
    var code = 'mlx90614.readObjectTempF()';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['mlx90614_read_ambient_f'] = function(block) {
    var code = 'mlx90614.readAmbientTempF()';
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };

  Blockly.JavaScript['mlx90614_read_both'] = function(block) {
    var obj_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('obj_var'), Blockly.Variables.NAME_TYPE);
    var amb_var = Blockly.JavaScript.variableDB_.getName(block.getFieldValue('amb_var'), Blockly.Variables.NAME_TYPE);
    
    var code = `
  // Read MLX90614 temperatures
  ${obj_var} = mlx90614.readObjectTempC();
  ${amb_var} = mlx90614.readAmbientTempC();
  
  // Debug output
  Serial.printf("MLX90614 - Object: %.2f C, Ambient: %.2f C\\n", 
                ${obj_var}, ${amb_var});
    `;
    return code;
  };
  
  //////////////////////
  Blockly.JavaScript['math_map'] = function(block) {

  var value = Blockly.JavaScript.valueToCode(block, 'VALUE',
      Blockly.JavaScript.ORDER_ATOMIC) || 0;

  var from_low = block.getFieldValue('FROM_LOW');
  var from_high = block.getFieldValue('FROM_HIGH');
  var to_low = block.getFieldValue('TO_LOW');
  var to_high = block.getFieldValue('TO_HIGH');

  var code = `map(${value}, ${from_low}, ${from_high}, ${to_low}, ${to_high})`;

  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
  ///////////////////

  // ===== TCS34725 Color Sensor =====
  // Value block — uses definitions_ key so includes/globals/setup/helper get
  // hoisted by finish()'s marker extraction. _tcs_read() throttles I2C reads
  // to once per 100 ms so calling the block 3 times (R + G + B) in one frame
  // only does one sensor read.
  Blockly.JavaScript['TCS_read_rgb'] = function(block) {
    var ch = block.getFieldValue('color') || '1';
    Blockly.JavaScript.definitions_['__lotus_tcs34725__'] =
      '#EXTINC\n#include <Adafruit_TCS34725.h>\n#END\n' +
      '#VARIABLE\nAdafruit_TCS34725 _tcs = Adafruit_TCS34725(TCS34725_INTEGRATIONTIME_50MS, TCS34725_GAIN_4X);\n#END\n' +
      '#SETUP\n_tcs.begin();\n#END\n' +
      '#FUNCTION\n' +
      'uint16_t _tcs_read(uint8_t ch) {\n' +
      '  static uint32_t lastT = 0;\n' +
      '  static uint16_t r=0, g=0, b=0, c=0;\n' +
      '  if (millis() - lastT > 100) { _tcs.getRawData(&r, &g, &b, &c); lastT = millis(); }\n' +
      '  if (ch == 1) return r;\n' +
      '  if (ch == 2) return g;\n' +
      '  return b;\n' +
      '}\n' +
      '#END\n';
    return ['_tcs_read(' + ch + ')', Blockly.JavaScript.ORDER_ATOMIC];
  };

};