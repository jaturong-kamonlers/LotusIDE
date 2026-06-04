/**
 * config.group.sensor.js - Sensor Menu (แทน SD Card)
 */
module.exports = {
  name: 'Sensor',
  index: 40,
  color: '230',
  icon: '/icons/sensor.svg',
  blocks: [

    // ── 🌡 อุณหภูมิ/ความชื้น ───────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="🌡 Temperature / Humidity" web-class="headline"></label>' },

    'lt_dht_begin',
    'lt_dht_temperature',
    'lt_dht_humidity',

    { xml: '<sep gap="8"></sep>' },
    'lt_sht31_begin',
    'lt_sht31_temperature',
    'lt_sht31_humidity',

    { xml: '<sep gap="8"></sep>' },
    'lt_mlx_begin',
    'lt_mlx_object_temp',
    'lt_mlx_ambient_temp',

    // ── 🌤 สิ่งแวดล้อม ─────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="🌤 Environment" web-class="headline"></label>' },

    'lt_bmp280_begin',
    'lt_bmp280_temperature',
    'lt_bmp280_pressure',
    'lt_bmp280_altitude',

    { xml: '<sep gap="8"></sep>' },
    'lt_bh1750_begin',
    'lt_bh1750_lux',

    { xml: '<sep gap="8"></sep>' },
    'lt_pms_begin',
    'lt_pms_read',
    'lt_pms_pm25',
    'lt_pms_pm10',
    'lt_pms_pm100',

    // 🎨 Color sensor — self-contained value block; emits #SETUP / #FUNCTION
    // markers on first use, no separate begin block needed.
    { xml: '<sep gap="8"></sep>' },
    { xml: '<block type="TCS_read_rgb"><field name="color">1</field></block>' },

    // ── 🧭 การเคลื่อนไหว/ทิศทาง ────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="🧭 Motion / Direction" web-class="headline"></label>' },

    'lt_mpu6050_begin',
    'lt_mpu6050_update',
    {
      xml: '<block type="lt_mpu6050_accel"><field name="AXIS">AX</field></block>'
    },
    {
      xml: '<block type="lt_mpu6050_gyro"><field name="AXIS">GX</field></block>'
    },
    'lt_mpu6050_temp',

    { xml: '<sep gap="8"></sep>' },
    {
      xml: '<block type="lt_compass_begin"><field name="TYPE">QMC</field></block>'
    },
    'lt_compass_read',
    'lt_compass_heading',
    {
      xml: '<block type="lt_compass_axis"><field name="AXIS">X</field></block>'
    },

    // ── 📡 ระยะทาง ─────────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="📡 Distance" web-class="headline"></label>' },

    {
      xml: '<block type="lt_ultrasonic_begin"><field name="TRIG">12</field><field name="ECHO">14</field></block>'
    },
    'lt_ultrasonic_cm',
    'lt_ultrasonic_inch',

    // ── 🕐 เวลา RTC ────────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="🕐 RTC Clock" web-class="headline"></label>' },

    'lt_rtc_begin',
    'lt_rtc_set_time',
    {
      xml: '<block type="lt_rtc_now"><field name="FIELD">hour</field></block>'
    },
    'lt_rtc_datetime_string',

    // ── 🔊 เสียง/MP3 ───────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="🔊 Audio / MP3" web-class="headline"></label>' },

    'lt_dfplayer_begin',
    {
      xml: '<block type="lt_dfplayer_play"><value name="NUM"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>'
    },
    {
      xml: '<block type="lt_dfplayer_volume"><value name="VOL"><shadow type="math_number"><field name="NUM">15</field></shadow></value></block>'
    },
    'lt_dfplayer_pause',
    'lt_dfplayer_stop',
    'lt_dfplayer_next',
    'lt_dfplayer_prev',

    // ── 📺 จอ LCD I2C ──────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="📺 LCD I2C" web-class="headline"></label>' },

    'lt_lcd_begin',
    {
      xml: '<block type="lt_lcd_print"><field name="COL">0</field><field name="ROW">0</field><value name="TEXT"><shadow type="text"><field name="TEXT">Hello</field></shadow></value></block>'
    },
    'lt_lcd_clear',
    'lt_lcd_backlight',
  ]
};
