/**
 * blocks_sensors_new.js - LotusDevkit Sensor Blocks
 * Grouped by function (matching toolbox colour):
 *
 * 🌡 Temperature/Humidity   DHT, SHT31, MLX90614        #C62828 deep red
 * 🌤 Environment            BMP280, BH1750, PMS Dust    #1565C0 deep blue
 * 🧭 Motion                 MPU6050, HMC5883/QMC5883L   #4527A0 deep purple
 * 📡 Distance               Ultrasonic                  #00695C turquoise
 * 🕐 Time                   RTC DS1307                  #E65100 deep orange
 * 🔊 Audio                  DFPlayerMini MP3            #558B2F olive green
 * 📺 Display                LiquidCrystal I2C           #2979FF bright blue
 *
 * Tooltips go through Blockly.lotus.t() so they switch with the TitleBar
 * language toggle. Labels (DHT begin pin, RTC set time YY, etc.) stay
 * English — they're technical identifiers, not prose.
 */

module.exports = function(Blockly) {
  'use strict';

  var t = Blockly.lotus.t;

  // ── Category colours ────────────────────────────────────────────
  var C_TEMP    = '#C62828';  // temperature / humidity
  var C_ENV     = '#1565C0';  // environment
  var C_MOTION  = '#4527A0';  // motion / direction
  var C_DIST    = '#00695C';  // distance
  var C_RTC     = '#E65100';  // RTC
  var C_AUDIO   = '#558B2F';  // audio / MP3
  var C_LCD     = '#2979FF';  // LCD


  // ================================================================
  // 🌡 Temperature / Humidity — C62828 deep red
  // ================================================================

  // ── DHT ──
  Blockly.Blocks['lt_dht_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DHT begin pin')
        .appendField(new Blockly.FieldDropdown([
          ['D26 (gpio26)','26'],['D4 (gpio4)','4'],['D13 (gpio13)','13'],
          ['D14 (gpio14)','14'],['D25 (gpio25)','25'],['D27 (gpio27)','27'],
          ['D32 (gpio32)','32'],['D33 (gpio33)','33'],
        ]), 'PIN')
        .appendField('type')
        .appendField(new Blockly.FieldDropdown([
          ['DHT22','DHT22'],['DHT11','DHT11'],['DHT21','DHT21'],
        ]), 'TYPE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_dht_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_dht_temperature'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DHT temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_dht_temperature.tooltip'));
    }
  };

  Blockly.Blocks['lt_dht_humidity'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DHT humidity (%)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_dht_humidity.tooltip'));
    }
  };

  // ── SHT31 ──
  Blockly.Blocks['lt_sht31_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('SHT31 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_sht31_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_sht31_temperature'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('SHT31 temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_sht31_temperature.tooltip'));
    }
  };

  Blockly.Blocks['lt_sht31_humidity'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('SHT31 humidity (%)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_sht31_humidity.tooltip'));
    }
  };

  // ── MLX90614 IR Temperature ──
  Blockly.Blocks['lt_mlx_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MLX90614 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_mlx_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_mlx_object_temp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MLX90614 object temp (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_mlx_object_temp.tooltip'));
    }
  };

  Blockly.Blocks['lt_mlx_ambient_temp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MLX90614 ambient temp (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip(t('sensors.lt_mlx_ambient_temp.tooltip'));
    }
  };

  // ================================================================
  // 🌤 Environment — 1565C0 deep blue
  // ================================================================

  // ── BMP280 ──
  Blockly.Blocks['lt_bmp280_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_bmp280_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_bmp280_temperature'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_bmp280_temperature.tooltip'));
    }
  };

  Blockly.Blocks['lt_bmp280_pressure'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 pressure (hPa)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_bmp280_pressure.tooltip'));
    }
  };

  Blockly.Blocks['lt_bmp280_altitude'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 altitude (m)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_bmp280_altitude.tooltip'));
    }
  };

  // ── BH1750 Light ──
  Blockly.Blocks['lt_bh1750_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BH1750 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_bh1750_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_bh1750_lux'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BH1750 light (lux)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_bh1750_lux.tooltip'));
    }
  };

  // ── PMS Dust Sensor ──
  Blockly.Blocks['lt_pms_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS Dust begin RX pin')
        .appendField(new Blockly.FieldNumber(16, 0, 39), 'RX')
        .appendField('TX pin')
        .appendField(new Blockly.FieldNumber(17, 0, 39), 'TX');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_pms_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_pms_read'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS read');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_pms_read.tooltip'));
    }
  };

  Blockly.Blocks['lt_pms_pm25'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS PM2.5 (µg/m³)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_pms_pm25.tooltip'));
    }
  };

  Blockly.Blocks['lt_pms_pm10'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS PM10 (µg/m³)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_pms_pm10.tooltip'));
    }
  };

  Blockly.Blocks['lt_pms_pm100'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS PM100 (µg/m³)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip(t('sensors.lt_pms_pm100.tooltip'));
    }
  };

  // ================================================================
  // 🧭 Motion / Direction — 4527A0 deep purple
  // ================================================================

  // ── MPU6050 ──
  Blockly.Blocks['lt_mpu6050_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_mpu6050_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_mpu6050_update'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 update');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_mpu6050_update.tooltip'));
    }
  };

  Blockly.Blocks['lt_mpu6050_accel'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 accel')
        .appendField(new Blockly.FieldDropdown([
          ['X','AX'],['Y','AY'],['Z','AZ'],
        ]), 'AXIS')
        .appendField('(m/s²)');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_mpu6050_accel.tooltip'));
    }
  };

  Blockly.Blocks['lt_mpu6050_gyro'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 gyro')
        .appendField(new Blockly.FieldDropdown([
          ['X','GX'],['Y','GY'],['Z','GZ'],
        ]), 'AXIS')
        .appendField('(°/s)');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_mpu6050_gyro.tooltip'));
    }
  };

  Blockly.Blocks['lt_mpu6050_temp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_mpu6050_temp.tooltip'));
    }
  };

  // ── HMC5883L / QMC5883L Compass ──
  Blockly.Blocks['lt_compass_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Compass begin')
        .appendField(new Blockly.FieldDropdown([
          ['HMC5883L','HMC'],['QMC5883L','QMC'],
        ]), 'TYPE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_compass_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_compass_read'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Compass read');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_compass_read.tooltip'));
    }
  };

  Blockly.Blocks['lt_compass_heading'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Compass heading (°)');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_compass_heading.tooltip'));
    }
  };

  Blockly.Blocks['lt_compass_axis'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Compass')
        .appendField(new Blockly.FieldDropdown([
          ['X','X'],['Y','Y'],['Z','Z'],
        ]), 'AXIS');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip(t('sensors.lt_compass_axis.tooltip'));
    }
  };

  // ================================================================
  // 📡 Distance — 00695C turquoise
  // ================================================================

  Blockly.Blocks['lt_ultrasonic_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Ultrasonic begin TRIG pin')
        .appendField(new Blockly.FieldNumber(12, 0, 39), 'TRIG')
        .appendField('ECHO pin')
        .appendField(new Blockly.FieldNumber(14, 0, 39), 'ECHO');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_DIST);
      this.setTooltip(t('sensors.lt_ultrasonic_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_ultrasonic_cm'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Ultrasonic distance (cm)');
      this.setOutput(true, 'Number');
      this.setColour(C_DIST);
      this.setTooltip(t('sensors.lt_ultrasonic_cm.tooltip'));
    }
  };

  Blockly.Blocks['lt_ultrasonic_inch'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Ultrasonic distance (inch)');
      this.setOutput(true, 'Number');
      this.setColour(C_DIST);
      this.setTooltip(t('sensors.lt_ultrasonic_inch.tooltip'));
    }
  };

  // ================================================================
  // 🕐 RTC — E65100 deep orange
  // ================================================================

  Blockly.Blocks['lt_rtc_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('RTC begin')
        .appendField(new Blockly.FieldDropdown([
          ['DS1307','DS1307'],['DS3231','DS3231'],
        ]), 'TYPE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_RTC);
      this.setTooltip(t('sensors.lt_rtc_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_rtc_set_time'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('RTC set time YY')
        .appendField(new Blockly.FieldNumber(2025, 2000, 2099), 'YEAR')
        .appendField('MM')
        .appendField(new Blockly.FieldNumber(1, 1, 12), 'MONTH')
        .appendField('DD')
        .appendField(new Blockly.FieldNumber(1, 1, 31), 'DAY');
      this.appendDummyInput()
        .appendField('HH')
        .appendField(new Blockly.FieldNumber(0, 0, 23), 'HOUR')
        .appendField('mm')
        .appendField(new Blockly.FieldNumber(0, 0, 59), 'MIN')
        .appendField('SS')
        .appendField(new Blockly.FieldNumber(0, 0, 59), 'SEC');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_RTC);
      this.setTooltip(t('sensors.lt_rtc_set_time.tooltip'));
    }
  };

  Blockly.Blocks['lt_rtc_now'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('RTC get')
        .appendField(new Blockly.FieldDropdown([
          ['year','year'],['month','month'],['day','day'],
          ['hour','hour'],['minute','minute'],['second','second'],
          ['dayOfWeek','dayOfWeek'],['unixtime','unixtime'],
        ]), 'FIELD');
      this.setOutput(true, 'Number');
      this.setColour(C_RTC);
      this.setTooltip(t('sensors.lt_rtc_now.tooltip'));
    }
  };

  Blockly.Blocks['lt_rtc_datetime_string'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('RTC datetime string');
      this.setOutput(true, 'String');
      this.setColour(C_RTC);
      this.setTooltip(t('sensors.lt_rtc_datetime_string.tooltip'));
    }
  };

  // ================================================================
  // 🔊 Audio / MP3 — 558B2F olive green
  // ================================================================

  Blockly.Blocks['lt_dfplayer_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer begin RX pin')
        .appendField(new Blockly.FieldNumber(16, 0, 39), 'RX')
        .appendField('TX pin')
        .appendField(new Blockly.FieldNumber(17, 0, 39), 'TX');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_dfplayer_play'] = {
    init: function() {
      this.appendValueInput('NUM')
        .setCheck('Number')
        .appendField('DFPlayer play track');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_play.tooltip'));
    }
  };

  Blockly.Blocks['lt_dfplayer_volume'] = {
    init: function() {
      this.appendValueInput('VOL')
        .setCheck('Number')
        .appendField('DFPlayer volume');
      this.appendDummyInput().appendField('(0-30)');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_volume.tooltip'));
    }
  };

  Blockly.Blocks['lt_dfplayer_pause'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer pause');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_pause.tooltip'));
    }
  };

  Blockly.Blocks['lt_dfplayer_stop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer stop');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_stop.tooltip'));
    }
  };

  Blockly.Blocks['lt_dfplayer_next'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer next track');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_next.tooltip'));
    }
  };

  Blockly.Blocks['lt_dfplayer_prev'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer previous track');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip(t('sensors.lt_dfplayer_prev.tooltip'));
    }
  };

  // ================================================================
  // 📺 LCD I2C — 2979FF bright blue
  // ================================================================

  Blockly.Blocks['lt_lcd_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('LCD I2C begin addr 0x')
        .appendField(new Blockly.FieldTextInput('27'), 'ADDR')
        .appendField('cols')
        .appendField(new Blockly.FieldNumber(16, 8, 40), 'COLS')
        .appendField('rows')
        .appendField(new Blockly.FieldNumber(2, 1, 4), 'ROWS');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_LCD);
      this.setTooltip(t('sensors.lt_lcd_begin.tooltip'));
    }
  };

  Blockly.Blocks['lt_lcd_print'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('LCD print col')
        .appendField(new Blockly.FieldNumber(0, 0, 39), 'COL')
        .appendField('row')
        .appendField(new Blockly.FieldNumber(0, 0, 3), 'ROW');
      this.appendValueInput('TEXT').setCheck(null).appendField('text');
      this.setInputsInline(false);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_LCD);
      this.setTooltip(t('sensors.lt_lcd_print.tooltip'));
    }
  };

  Blockly.Blocks['lt_lcd_clear'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('LCD clear');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_LCD);
      this.setTooltip(t('sensors.lt_lcd_clear.tooltip'));
    }
  };

  Blockly.Blocks['lt_lcd_backlight'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('LCD backlight')
        .appendField(new Blockly.FieldDropdown([
          ['ON','1'],['OFF','0'],
        ]), 'STATE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_LCD);
      this.setTooltip(t('sensors.lt_lcd_backlight.tooltip'));
    }
  };

};
