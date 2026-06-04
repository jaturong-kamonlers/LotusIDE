/**
 * blocks_sensors_new.js - LotusDevkit Sensor Blocks
 * จัดกลุ่มตาม function ที่คล้ายกัน สีแตกต่างกัน:
 *
 * 🌡 อุณหภูมิ/ความชื้น  DHT, SHT31, MLX90614        #C62828 แดงเข้ม
 * 🌤 สิ่งแวดล้อม       BMP280, BH1750, PMS Dust     #1565C0 น้ำเงินเข้ม  
 * 🧭 การเคลื่อนไหว     MPU6050, HMC5883/QMC5883L   #4527A0 ม่วงเข้ม
 * 📡 ระยะทาง           Ultrasonic                   #00695C เขียวเทอร์ควอยซ์
 * 🕐 เวลา              RTC DS1307                   #E65100 ส้มเข้ม
 * 🔊 เสียง             DFPlayerMini MP3             #558B2F เขียวมะกอก
 * 📺 จอแสดงผล          LiquidCrystal I2C            #2979FF น้ำเงินสว่าง
 */

module.exports = function(Blockly) {
  'use strict';

  // ── สีแต่ละหมวด ──────────────────────────────────────────────────
  var C_TEMP    = '#C62828';  // อุณหภูมิ/ความชื้น
  var C_ENV     = '#1565C0';  // สิ่งแวดล้อม
  var C_MOTION  = '#4527A0';  // การเคลื่อนไหว/ทิศทาง
  var C_DIST    = '#00695C';  // ระยะทาง
  var C_RTC     = '#E65100';  // เวลา RTC
  var C_AUDIO   = '#558B2F';  // เสียง/MP3
  var C_LCD     = '#2979FF';  // จอ LCD


  // ================================================================
  // 🌡 อุณหภูมิ/ความชื้น — สี แดง C62828
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
      this.setTooltip('เริ่มต้น DHT sensor');
    }
  };

  Blockly.Blocks['lt_dht_temperature'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DHT temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip('อ่านอุณหภูมิจาก DHT (°C)');
    }
  };

  Blockly.Blocks['lt_dht_humidity'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DHT humidity (%)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip('อ่านความชื้นสัมพัทธ์จาก DHT (%)');
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
      this.setTooltip('เริ่มต้น SHT31 (I2C 0x44)');
    }
  };

  Blockly.Blocks['lt_sht31_temperature'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('SHT31 temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip('อ่านอุณหภูมิจาก SHT31 (°C)');
    }
  };

  Blockly.Blocks['lt_sht31_humidity'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('SHT31 humidity (%)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip('อ่านความชื้นจาก SHT31 (%)');
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
      this.setTooltip('เริ่มต้น MLX90614 IR Temperature sensor (I2C)');
    }
  };

  Blockly.Blocks['lt_mlx_object_temp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MLX90614 object temp (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip('อ่านอุณหภูมิวัตถุ (IR) จาก MLX90614');
    }
  };

  Blockly.Blocks['lt_mlx_ambient_temp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MLX90614 ambient temp (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_TEMP);
      this.setTooltip('อ่านอุณหภูมิสิ่งแวดล้อมจาก MLX90614');
    }
  };

  // ================================================================
  // 🌤 สิ่งแวดล้อม — สี น้ำเงินเข้ม 1565C0
  // ================================================================

  // ── BMP280 ──
  Blockly.Blocks['lt_bmp280_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_ENV);
      this.setTooltip('เริ่มต้น BMP280 (I2C 0x76 หรือ 0x77)');
    }
  };

  Blockly.Blocks['lt_bmp280_temperature'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('อ่านอุณหภูมิจาก BMP280');
    }
  };

  Blockly.Blocks['lt_bmp280_pressure'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 pressure (hPa)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('อ่านความดันอากาศจาก BMP280 (hPa)');
    }
  };

  Blockly.Blocks['lt_bmp280_altitude'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BMP280 altitude (m)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('คำนวณความสูงจากระดับน้ำทะเล (m)');
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
      this.setTooltip('เริ่มต้น BH1750 Light sensor (I2C)');
    }
  };

  Blockly.Blocks['lt_bh1750_lux'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('BH1750 light (lux)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('อ่านความเข้มแสง (lux) จาก BH1750');
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
      this.setTooltip('เริ่มต้น PMS Dust Sensor (Serial)');
    }
  };

  Blockly.Blocks['lt_pms_read'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS read');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_ENV);
      this.setTooltip('อ่านข้อมูลจาก PMS Dust sensor');
    }
  };

  Blockly.Blocks['lt_pms_pm25'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS PM2.5 (µg/m³)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('ค่าฝุ่น PM2.5 (µg/m³)');
    }
  };

  Blockly.Blocks['lt_pms_pm10'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS PM10 (µg/m³)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('ค่าฝุ่น PM10 (µg/m³)');
    }
  };

  Blockly.Blocks['lt_pms_pm100'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('PMS PM100 (µg/m³)');
      this.setOutput(true, 'Number');
      this.setColour(C_ENV);
      this.setTooltip('ค่าฝุ่น PM100 (µg/m³)');
    }
  };

  // ================================================================
  // 🧭 การเคลื่อนไหว/ทิศทาง — สี ม่วง 4527A0
  // ================================================================

  // ── MPU6050 ──
  Blockly.Blocks['lt_mpu6050_begin'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 begin');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip('เริ่มต้น MPU6050 Gyro+Accelerometer (I2C 0x68)');
    }
  };

  Blockly.Blocks['lt_mpu6050_update'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 update');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip('อ่านข้อมูลใหม่จาก MPU6050 (ใส่ใน loop)');
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
      this.setTooltip('ค่า Accelerometer X/Y/Z (m/s²)');
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
      this.setTooltip('ค่า Gyroscope X/Y/Z (°/s)');
    }
  };

  Blockly.Blocks['lt_mpu6050_temp'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('MPU6050 temperature (°C)');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip('อ่านอุณหภูมิภายใน MPU6050');
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
      this.setTooltip('เริ่มต้น HMC5883L หรือ QMC5883L Compass (I2C)');
    }
  };

  Blockly.Blocks['lt_compass_read'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Compass read');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_MOTION);
      this.setTooltip('อ่านค่าจาก Compass sensor');
    }
  };

  Blockly.Blocks['lt_compass_heading'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Compass heading (°)');
      this.setOutput(true, 'Number');
      this.setColour(C_MOTION);
      this.setTooltip('ทิศทางแม่เหล็ก (0-360°)');
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
      this.setTooltip('ค่าแกน X/Y/Z ของ Compass (gauss)');
    }
  };

  // ================================================================
  // 📡 ระยะทาง — สี เขียวเทอร์ควอยซ์ 00695C
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
      this.setTooltip('ตั้งค่า Ultrasonic sensor (HC-SR04)');
    }
  };

  Blockly.Blocks['lt_ultrasonic_cm'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Ultrasonic distance (cm)');
      this.setOutput(true, 'Number');
      this.setColour(C_DIST);
      this.setTooltip('อ่านระยะทาง (เซนติเมตร) จาก HC-SR04');
    }
  };

  Blockly.Blocks['lt_ultrasonic_inch'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Ultrasonic distance (inch)');
      this.setOutput(true, 'Number');
      this.setColour(C_DIST);
      this.setTooltip('อ่านระยะทาง (นิ้ว) จาก HC-SR04');
    }
  };

  // ================================================================
  // 🕐 เวลา RTC — สี ส้มเข้ม E65100
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
      this.setTooltip('เริ่มต้น RTC Module DS1307 / DS3231 (I2C)');
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
      this.setTooltip('ตั้งเวลา RTC');
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
      this.setTooltip('อ่านเวลาจาก RTC');
    }
  };

  Blockly.Blocks['lt_rtc_datetime_string'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('RTC datetime string');
      this.setOutput(true, 'String');
      this.setColour(C_RTC);
      this.setTooltip('คืนค่าวันเวลาเป็น String เช่น "2025-01-15 14:30:00"');
    }
  };

  // ================================================================
  // 🔊 เสียง/MP3 — สี เขียวมะกอก 558B2F
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
      this.setTooltip('เริ่มต้น DFPlayer Mini MP3');
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
      this.setTooltip('เล่นไฟล์เพลงหมายเลขที่กำหนด (1-999)');
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
      this.setTooltip('ตั้งระดับเสียง 0-30');
    }
  };

  Blockly.Blocks['lt_dfplayer_pause'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer pause');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip('หยุดเล่นชั่วคราว');
    }
  };

  Blockly.Blocks['lt_dfplayer_stop'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer stop');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip('หยุดเล่น');
    }
  };

  Blockly.Blocks['lt_dfplayer_next'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer next track');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip('เล่นเพลงถัดไป');
    }
  };

  Blockly.Blocks['lt_dfplayer_prev'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('DFPlayer previous track');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_AUDIO);
      this.setTooltip('เล่นเพลงก่อนหน้า');
    }
  };

  // ================================================================
  // 📺 จอ LCD I2C — สี น้ำเงินสว่าง 2979FF
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
      this.setTooltip('เริ่มต้น LCD I2C (0x27 หรือ 0x3F)');
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
      this.setTooltip('แสดงข้อความบน LCD ที่ตำแหน่ง col, row');
    }
  };

  Blockly.Blocks['lt_lcd_clear'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('LCD clear');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C_LCD);
      this.setTooltip('ลบข้อความทั้งหมดบน LCD');
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
      this.setTooltip('เปิด/ปิดไฟหลัง LCD');
    }
  };

};
