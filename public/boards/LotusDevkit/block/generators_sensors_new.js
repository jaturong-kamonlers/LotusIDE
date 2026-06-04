module.exports = function(Blockly) {
  'use strict';

  // ─── MPU6050 ────────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_mpu6050_begin'] = function(block) {
    return `#EXTINC
\t#include "MPU6050.h"
\t#END
\t#VARIABLE
\tMPU6050 _mpu;
\t#END
\t_mpu.begin();\n`;
  };
  Blockly.JavaScript['lt_mpu6050_update'] = function(block) {
    return `_mpu.update();\n`;
  };
  Blockly.JavaScript['lt_mpu6050_accel'] = function(block) {
    var axis = block.getFieldValue('AXIS');
    var map = {AX:'ax()',AY:'ay()',AZ:'az()'};
    return [`_mpu.${map[axis]}`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_mpu6050_gyro'] = function(block) {
    var axis = block.getFieldValue('AXIS');
    var map = {GX:'gx()',GY:'gy()',GZ:'gz()'};
    return [`_mpu.${map[axis]}`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_mpu6050_temp'] = function(block) {
    return [`_mpu.temp()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── BH1750 ─────────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_bh1750_begin'] = function(block) {
    return `#EXTINC
\t#include "BH1750.h"
\t#END
\t#VARIABLE
\tBH1750 _bh1750;
\t#END
\t_bh1750.begin();\n`;
  };
  Blockly.JavaScript['lt_bh1750_lux'] = function(block) {
    return [`_bh1750.readLightLevel()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── MLX90614 ───────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_mlx_begin'] = function(block) {
    return `#EXTINC
\t#include "Adafruit_MLX90614.h"
\t#END
\t#VARIABLE
\tAdafruit_MLX90614 _mlx;
\t#END
\t_mlx.begin();\n`;
  };
  Blockly.JavaScript['lt_mlx_object_temp'] = function(block) {
    return [`_mlx.readObjectTempC()`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_mlx_ambient_temp'] = function(block) {
    return [`_mlx.readAmbientTempC()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── DHT ────────────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_dht_begin'] = function(block) {
    var pin  = block.getFieldValue('PIN')  || '26';
    var type = block.getFieldValue('TYPE') || 'DHT22';
    var typeMap = {DHT22:'22', DHT11:'11', DHT21:'21'};
    return `#EXTINC
\t#include "DHT.h"
\t#END
\t#VARIABLE
\tDHT _dht(${pin}, ${typeMap[type]||22});
\t#END
\t_dht.begin();\n`;
  };
  Blockly.JavaScript['lt_dht_temperature'] = function(block) {
    return [`_dht.readTemperature()`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_dht_humidity'] = function(block) {
    return [`_dht.readHumidity()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── BMP280 ─────────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_bmp280_begin'] = function(block) {
    return `#EXTINC
\t#include "Adafruit_BMP280.h"
\t#END
\t#VARIABLE
\tAdafruit_BMP280 _bmp;
\t#END
\t_bmp.begin(0x76);\n`;
  };
  Blockly.JavaScript['lt_bmp280_temperature'] = function(block) {
    return [`_bmp.readTemperature()`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_bmp280_pressure'] = function(block) {
    return [`_bmp.readPressure()`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_bmp280_altitude'] = function(block) {
    return [`_bmp.readAltitude(1013.25)`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── SHT31 ──────────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_sht31_begin'] = function(block) {
    return `#EXTINC
\t#include "Adafruit_SHT31.h"
\t#END
\t#VARIABLE
\tAdafruit_SHT31 _sht31;
\t#END
\t_sht31.begin(0x44);\n`;
  };
  Blockly.JavaScript['lt_sht31_temperature'] = function(block) {
    return [`_sht31.readTemperature()`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_sht31_humidity'] = function(block) {
    return [`_sht31.readHumidity()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── Ultrasonic HC-SR04 ─────────────────────────────────────────────────────
  Blockly.JavaScript['lt_ultrasonic_begin'] = function(block) {
    var trig = block.getFieldValue('TRIG') || '12';
    var echo = block.getFieldValue('ECHO') || '14';
    return `#VARIABLE
\tint _us_trig=${trig}, _us_echo=${echo};
\tfloat _us_read_cm() {
\t  digitalWrite(_us_trig,LOW); delayMicroseconds(2);
\t  digitalWrite(_us_trig,HIGH); delayMicroseconds(10);
\t  digitalWrite(_us_trig,LOW);
\t  return pulseIn(_us_echo,HIGH,30000)/58.0;
\t}
\t#END
\tpinMode(_us_trig,OUTPUT); pinMode(_us_echo,INPUT);\n`;
  };
  Blockly.JavaScript['lt_ultrasonic_cm'] = function(block) {
    return [`_us_read_cm()`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_ultrasonic_inch'] = function(block) {
    return [`(_us_read_cm()/2.54)`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── RTC DS1307/DS3231 ──────────────────────────────────────────────────────
  Blockly.JavaScript['lt_rtc_begin'] = function(block) {
    var type = block.getFieldValue('TYPE') || 'DS1307';
    return `#EXTINC
\t#include "RTClib.h"
\t#END
\t#VARIABLE
\tRTC_${type} _rtc;
\tDateTime _rtcNow;
\t#END
\t_rtc.begin();\n`;
  };
  Blockly.JavaScript['lt_rtc_now'] = function(block) {
    var field = block.getFieldValue('FIELD') || 'hour';
    var map = {year:'year()',month:'month()',day:'day()',
               hour:'hour()',minute:'minute()',second:'second()',
               dayOfWeek:'dayOfWeek()',unixtime:'unixtime()'};
    return [`(_rtcNow=_rtc.now(),_rtcNow.${map[field]||'hour()'})`,
            Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_rtc_datetime_string'] = function(block) {
    return [`(_rtcNow=_rtc.now(),String(_rtcNow.year())+"/"+String(_rtcNow.month())+"/"+String(_rtcNow.day())+" "+String(_rtcNow.hour())+":"+String(_rtcNow.minute())+":"+String(_rtcNow.second()))`,
            Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_rtc_set_time'] = function(block) {
    var y = Blockly.JavaScript.valueToCode(block,'YEAR',  Blockly.JavaScript.ORDER_ATOMIC)||'2025';
    var mo= Blockly.JavaScript.valueToCode(block,'MONTH', Blockly.JavaScript.ORDER_ATOMIC)||'1';
    var d = Blockly.JavaScript.valueToCode(block,'DAY',   Blockly.JavaScript.ORDER_ATOMIC)||'1';
    var h = Blockly.JavaScript.valueToCode(block,'HOUR',  Blockly.JavaScript.ORDER_ATOMIC)||'0';
    var mi= Blockly.JavaScript.valueToCode(block,'MINUTE',Blockly.JavaScript.ORDER_ATOMIC)||'0';
    var s = Blockly.JavaScript.valueToCode(block,'SECOND',Blockly.JavaScript.ORDER_ATOMIC)||'0';
    return `_rtc.adjust(DateTime(${y},${mo},${d},${h},${mi},${s}));\n`;
  };

  // ─── LCD I2C ────────────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_lcd_begin'] = function(block) {
    var addr = block.getFieldValue('ADDR') || '0x27';
    var col  = block.getFieldValue('COL')  || '16';
    var row  = block.getFieldValue('ROW')  || '2';
    return `#EXTINC
\t#include <LiquidCrystal_I2C.h>
\t#END
\t#VARIABLE
\tLiquidCrystal_I2C _lcd(${addr},${col},${row});
\t#END
\t_lcd.init(); _lcd.backlight();\n`;
  };
  Blockly.JavaScript['lt_lcd_clear'] = function(block) {
    return `_lcd.clear();\n`;
  };
  Blockly.JavaScript['lt_lcd_backlight'] = function(block) {
    var val = block.getFieldValue('STATE') || '1';
    return val==='1' ? `_lcd.backlight();\n` : `_lcd.noBacklight();\n`;
  };
  Blockly.JavaScript['lt_lcd_print'] = function(block) {
    // ใช้ valueToCode สำหรับตัวเลข col/row
    var col  = Blockly.JavaScript.valueToCode(block,'COL', Blockly.JavaScript.ORDER_ATOMIC)||'0';
    var row  = Blockly.JavaScript.valueToCode(block,'ROW', Blockly.JavaScript.ORDER_ATOMIC)||'0';
    if(!col || col==='null') col = '0';
    if(!row || row==='null') row = '0';
    // ใช้ valueToCode แต่ตรวจ null ก่อน — ถ้า null ให้เป็น string ว่าง
    var textBlock = block.getInputTargetBlock('TEXT');
    var text;
    if (!textBlock) {
      text = '""';
    } else if (textBlock.type === 'text') {
      var fieldVal = textBlock.getFieldValue('TEXT');
      text = '"' + (fieldVal || '') + '"';
    } else {
      text = Blockly.JavaScript.valueToCode(block,'TEXT',Blockly.JavaScript.ORDER_ATOMIC)||'""';
      if(!text || text==='null') text = '""';
    }
    return `_lcd.setCursor(${col},${row}); _lcd.print(${text});\n`;
  };

  // ─── Compass HMC5883L/QMC5883L ─────────────────────────────────────────────
  Blockly.JavaScript['lt_compass_begin'] = function(block) {
    var type = block.getFieldValue('TYPE') || 'HMC';
    if (type === 'HMC') {
      return `#EXTINC
\t#include "Adafruit_HMC5883_U.h"
\t#END
\t#VARIABLE
\tAdafruit_HMC5883_Unified _compass(12345);
\t#END
\t_compass.begin();\n`;
    } else {
      return `#EXTINC
\t#include "QMC5883LCompass.h"
\t#END
\t#VARIABLE
\tQMC5883LCompass _compass;
\t#END
\t_compass.init();\n`;
    }
  };
  Blockly.JavaScript['lt_compass_read'] = function(block) {
    return `_compass.read();\n`;
  };
  Blockly.JavaScript['lt_compass_axis'] = function(block) {
    var axis = block.getFieldValue('AXIS') || 'X';
    var fnMap = { X: 'getX()', Y: 'getY()', Z: 'getZ()' };
    return [`_compass.${fnMap[axis] || 'getX()'}`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_compass_heading'] = function(block) {
    return [`_compass.getAzimuth()`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── PMS Dust Sensor ────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_pms_begin'] = function(block) {
    var rx = block.getFieldValue('RX') || '16';
    var tx = block.getFieldValue('TX') || '17';
    return `#EXTINC
\t#include "PMS.h"
\t#END
\t#VARIABLE
\tHardwareSerial _pmsSerial(2);
\tPMS _pms(_pmsSerial);
\tPMS::DATA _pmsData;
\t#END
\t_pmsSerial.begin(9600,SERIAL_8N1,${rx},${tx});\n`;
  };
  Blockly.JavaScript['lt_pms_read'] = function(block) {
    return `_pms.readUntil(_pmsData);\n`;
  };
  Blockly.JavaScript['lt_pms_pm25'] = function(block) {
    return [`_pmsData.PM_AE_UG_2_5`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_pms_pm10'] = function(block) {
    return [`_pmsData.PM_AE_UG_1_0`, Blockly.JavaScript.ORDER_ATOMIC];
  };
  Blockly.JavaScript['lt_pms_pm100'] = function(block) {
    return [`_pmsData.PM_AE_UG_10_0`, Blockly.JavaScript.ORDER_ATOMIC];
  };

  // ─── DFPlayer Mini ──────────────────────────────────────────────────────────
  Blockly.JavaScript['lt_dfplayer_begin'] = function(block) {
    var rx = block.getFieldValue('RX') || '25';
    var tx = block.getFieldValue('TX') || '26';
    return `#EXTINC
\t#include "DFRobotDFPlayerMini.h"
\t#END
\t#VARIABLE
\tHardwareSerial _dfSerial(2);
\tDFRobotDFPlayerMini _dfPlayer;
\t#END
\t_dfSerial.begin(9600,SERIAL_8N1,${rx},${tx});
\t_dfPlayer.begin(_dfSerial);\n`;
  };
  Blockly.JavaScript['lt_dfplayer_play'] = function(block) {
    var num = Blockly.JavaScript.valueToCode(block,'NUM',Blockly.JavaScript.ORDER_ATOMIC)||'1';
    return `_dfPlayer.play(${num});\n`;
  };
  Blockly.JavaScript['lt_dfplayer_next'] = function(block) {
    return `_dfPlayer.next();\n`;
  };
  Blockly.JavaScript['lt_dfplayer_prev'] = function(block) {
    return `_dfPlayer.previous();\n`;
  };
  Blockly.JavaScript['lt_dfplayer_pause'] = function(block) {
    return `_dfPlayer.pause();\n`;
  };
  Blockly.JavaScript['lt_dfplayer_stop'] = function(block) {
    return `_dfPlayer.stop();\n`;
  };
  Blockly.JavaScript['lt_dfplayer_volume'] = function(block) {
    var vol = Blockly.JavaScript.valueToCode(block,'VOL',Blockly.JavaScript.ORDER_ATOMIC)||'15';
    return `_dfPlayer.volume(${vol});\n`;
  };

};
