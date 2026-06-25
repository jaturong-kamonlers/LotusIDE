// Lotus IDE i18n message catalog (Phase 1 — Vue UI strings only).
//
// Keys are flat dot-paths. Values are either plain strings or functions for
// templated messages (count + boardName etc.). English is the default; Thai
// is the opt-in translation. New translations: add an entry to BOTH `en` and
// `th` with the same key. Untranslated keys fall back to English.
//
// To add a UI string elsewhere in the codebase:
//   1. Add the key+text here under en + th
//   2. Replace the literal in the component with t('your.key', ...args)
//
// To migrate board / plugin block tooltips later (Phase 2+), use the same
// pattern — extend this file (or split into separate files) with a 'blocks.*'
// namespace.

const en = {
  // Top-bar language toggle
  'language.label': 'Language',
  'language.toggle_tooltip': 'Switch UI language',

  // Board-switch compatibility popup (BlocklyEditor.vue)
  'boardCompat.popup': (count, boardName) =>
    `Switching to "${boardName}" will leave ${count} block(s) unusable on this board.\n\n` +
    `OK = Remove them (keep only setup/loop; backup saved to Browser storage)\n` +
    `Cancel = Keep them in place (disabled with a ⚠ warning)`,
  'boardCompat.removed_with_backup': (n, key) =>
    `Removed ${n} block(s) (backup: ${key})`,
  'boardCompat.removed_no_backup': (n) =>
    `Removed ${n} block(s) (backup failed — see console)`,
  'boardCompat.disabled_count': (n) =>
    `Disabled ${n} block(s) not supported by this board`,
  'boardCompat.reenabled_count': (n) =>
    `Re-enabled ${n} block(s) now supported again`,
  'boardCompat.warning_tooltip':
    '⚠ Not supported on this board — switch back to the original board to use',

  // ── Blocks: WiFi (LotusDevkit + LotusDevkit4Wheels) ───────────────────────
  // Translate tooltips + the prose-y "password" label. Technical terms
  // (HTTP GET, dBm, AP, IP, SSID) stay in English in both languages.
  'wifi.label.password': 'password',
  'wifi.lt_wifi_begin.tooltip':
    'Connect to a WiFi network (Station mode) — blocks until connected or 15s timeout (place in setup)',
  'wifi.lt_wifi_is_connected.tooltip':
    'Returns true when WiFi is connected to the access point',
  'wifi.lt_wifi_local_ip.tooltip':
    'IP address of this board on the network, e.g. 192.168.1.42',
  'wifi.lt_wifi_rssi.tooltip':
    'Signal strength in dBm — closer to 0 = stronger (e.g. -50 = good, -90 = weak)',
  'wifi.lt_http_get.tooltip':
    'Send HTTP GET to URL — returns response body (empty String on failure)',
  'wifi.lt_http_post.tooltip':
    'Send HTTP POST to URL with body — returns response body (empty String on failure)',
  'wifi.lt_wifi_ap_begin.tooltip':
    'Start an Access Point so other devices can connect (password must be ≥ 8 characters) — useful when no router is available',
  'wifi.lt_wifi_ap_ip.tooltip':
    'IP of this board in AP mode, default 192.168.4.1',
  'wifi.lt_wifi_ap_clients.tooltip':
    'Number of devices currently connected to the AP',

  // ── Blocks: Sensors (LotusDevkit + LotusDevkit4Wheels — blocks_sensors_new.js) ──
  // 47 tooltips; labels are already English so we leave them alone.
  'sensors.lt_dht_begin.tooltip':            'Initialise the DHT temperature + humidity sensor',
  'sensors.lt_dht_temperature.tooltip':      'Read temperature from DHT (°C)',
  'sensors.lt_dht_humidity.tooltip':         'Read relative humidity from DHT (%)',
  'sensors.lt_sht31_begin.tooltip':          'Initialise SHT31 (I2C 0x44)',
  'sensors.lt_sht31_temperature.tooltip':    'Read temperature from SHT31 (°C)',
  'sensors.lt_sht31_humidity.tooltip':       'Read humidity from SHT31 (%)',
  'sensors.lt_mlx_begin.tooltip':            'Initialise MLX90614 IR temperature sensor (I2C)',
  'sensors.lt_mlx_object_temp.tooltip':      'Read object (IR) temperature from MLX90614',
  'sensors.lt_mlx_ambient_temp.tooltip':     'Read ambient temperature from MLX90614',
  'sensors.lt_bmp280_begin.tooltip':         'Initialise BMP280 (I2C 0x76 or 0x77)',
  'sensors.lt_bmp280_temperature.tooltip':   'Read temperature from BMP280',
  'sensors.lt_bmp280_pressure.tooltip':      'Read atmospheric pressure from BMP280 (hPa)',
  'sensors.lt_bmp280_altitude.tooltip':      'Compute altitude above sea level (m)',
  'sensors.lt_bh1750_begin.tooltip':         'Initialise BH1750 light sensor (I2C)',
  'sensors.lt_bh1750_lux.tooltip':           'Read light intensity (lux) from BH1750',
  'sensors.lt_pms_begin.tooltip':            'Initialise PMS dust sensor (Serial)',
  'sensors.lt_pms_read.tooltip':             'Read data from PMS dust sensor',
  'sensors.lt_pms_pm25.tooltip':             'PM2.5 dust value (µg/m³)',
  'sensors.lt_pms_pm10.tooltip':             'PM10 dust value (µg/m³)',
  'sensors.lt_pms_pm100.tooltip':            'PM100 dust value (µg/m³)',
  'sensors.lt_mpu6050_begin.tooltip':        'Initialise MPU6050 gyro + accelerometer (I2C 0x68)',
  'sensors.lt_mpu6050_update.tooltip':       'Refresh data from MPU6050 (place in loop)',
  'sensors.lt_mpu6050_accel.tooltip':        'Accelerometer reading X/Y/Z (m/s²)',
  'sensors.lt_mpu6050_gyro.tooltip':         'Gyroscope reading X/Y/Z (°/s)',
  'sensors.lt_mpu6050_temp.tooltip':         'Read MPU6050 internal temperature',
  'sensors.lt_compass_begin.tooltip':        'Initialise HMC5883L or QMC5883L compass (I2C)',
  'sensors.lt_compass_read.tooltip':         'Read data from the compass sensor',
  'sensors.lt_compass_heading.tooltip':      'Magnetic heading (0–360°)',
  'sensors.lt_compass_axis.tooltip':         'X/Y/Z axis value of the compass (gauss)',
  'sensors.lt_ultrasonic_begin.tooltip':     'Configure ultrasonic sensor (HC-SR04)',
  'sensors.lt_ultrasonic_cm.tooltip':        'Read distance (centimetres) from HC-SR04',
  'sensors.lt_ultrasonic_inch.tooltip':      'Read distance (inches) from HC-SR04',
  'sensors.lt_rtc_begin.tooltip':            'Initialise RTC module DS1307 / DS3231 (I2C)',
  'sensors.lt_rtc_set_time.tooltip':         'Set RTC time',
  'sensors.lt_rtc_now.tooltip':              'Read time from RTC',
  'sensors.lt_rtc_datetime_string.tooltip':  'Return datetime as a string, e.g. "2025-01-15 14:30:00"',
  'sensors.lt_dfplayer_begin.tooltip':       'Initialise DFPlayer Mini MP3',
  'sensors.lt_dfplayer_play.tooltip':        'Play track number (1–999)',
  'sensors.lt_dfplayer_volume.tooltip':      'Set volume (0–30)',
  'sensors.lt_dfplayer_pause.tooltip':       'Pause playback',
  'sensors.lt_dfplayer_stop.tooltip':        'Stop playback',
  'sensors.lt_dfplayer_next.tooltip':        'Play next track',
  'sensors.lt_dfplayer_prev.tooltip':        'Play previous track',
  'sensors.lt_lcd_begin.tooltip':            'Initialise LCD I2C (0x27 or 0x3F)',
  'sensors.lt_lcd_print.tooltip':            'Display text on LCD at col, row',
  'sensors.lt_lcd_clear.tooltip':            'Clear all text on the LCD',
  'sensors.lt_lcd_backlight.tooltip':        'Turn LCD backlight on / off',

  // ── Blocks: IoT Extras (Blynk 1.0 / 2.0 / NETPIE / MQTT / UDP) ────────────
  // blocks_lt_more.js shares 28 tooltips across both Lotus ESP32 boards;
  // LotusDevkit4Wheels has 7 additional lt_mqtt_* dead-duplicate definitions
  // (overwritten by blocks_mqtt.js at load time). Translate them anyway so
  // the file is fully consistent.
  'iotmore.in_loop':
    'Place inside loop()',
  'iotmore.blynk_iot_virtual_write.tooltip':       'Send a value to a Virtual Pin on the Blynk app',
  'iotmore.blynk_iot_virtual_read.tooltip':        'Read a value from a Virtual Pin on the Blynk app',
  'iotmore.blynk_iot_on_virtual_write.tooltip':    'Run when a value arrives from the Blynk app on a Virtual Pin',
  'iotmore.blynk_iot_sync_all.tooltip':            'Ask the Blynk server for the latest value of every Virtual Pin',
  'iotmore.blynk_iot_sync_virtual.tooltip':        'Ask the Blynk server for the latest value of the given Virtual Pin',
  'iotmore.blynk_iot_push.tooltip':                'Send a push notification to the Blynk app',
  'iotmore.blynk_iot_notify.tooltip':              'Send a notification to the Blynk app',
  'iotmore.blynk_iot_tweet.tooltip':               'Tweet via Blynk (requires Twitter already linked)',
  'iotmore.blynk_iot_run.tooltip':                 'Call inside loop() so Blynk can run',
  'iotmore.blynk_iot_connected.tooltip':           'Check Blynk connection status',
  'iotmore.lt_blynk2_begin.tooltip':               'Connect to Blynk 2.0',
  'iotmore.lt_blynk2_set_virtual.tooltip':         'Send a value to a Virtual Pin',
  'iotmore.lt_blynk2_get_virtual.tooltip':         'Read a value from a Virtual Pin',
  'iotmore.lt_blynk2_on_write.tooltip':            'Run when Blynk sends a value',
  'iotmore.lt_blynk2_connected.tooltip':           'true when Blynk 2.0 is connected',
  'iotmore.lt_netpie_begin.tooltip':               'Configure and connect to NETPIE 2020',
  'iotmore.lt_netpie_publish.tooltip':             'Publish data to NETPIE 2020',
  'iotmore.lt_netpie_on_message.tooltip':          'Run when a message arrives from NETPIE 2020',
  'iotmore.lt_netpie_msg_topic.tooltip':           'Topic of the most recent message',
  'iotmore.lt_netpie_msg_payload.tooltip':         'Payload of the most recent message',
  'iotmore.lt_netpie_connected.tooltip':           'true when connected to NETPIE 2020',
  'iotmore.lt_udp_begin.tooltip':                  'Open a UDP socket on the given port',
  'iotmore.lt_udp_send.tooltip':                   'Send data via UDP to IP:Port',
  'iotmore.lt_udp_receive.tooltip':                'Read the most recent UDP data',
  'iotmore.lt_udp_remote_ip.tooltip':              'IP address of the UDP sender',
  'iotmore.lt_udp_packet_size.tooltip':            'UDP packet size (0 = no data yet)',
  'iotmore.lt_mqtt_begin.tooltip':                 'Configure and connect to MQTT broker',
  'iotmore.lt_mqtt_publish.tooltip':               'Publish data to the MQTT broker',
  'iotmore.lt_mqtt_subscribe.tooltip':             'Subscribe to an MQTT topic',
  'iotmore.lt_mqtt_on_message.tooltip':            'Run when an MQTT message arrives',
  'iotmore.lt_mqtt_msg_topic.tooltip':             'Topic of the most recent MQTT message',
  'iotmore.lt_mqtt_msg_payload.tooltip':           'Payload of the most recent MQTT message',
  'iotmore.lt_mqtt_connected.tooltip':             'true when the MQTT broker is connected',

  // ── Blocks: BLE (LotusDevkit + LotusDevkit4Wheels — blocks_ble.js) ────────
  'ble.lotus_ble_begin.tooltip':            'Start the BLE server and set the device name',
  'ble.lotus_ble_advertise_start.tooltip':  'Start advertising so other devices can discover this BLE peripheral',
  'ble.lotus_ble_advertise_stop.tooltip':   'Stop advertising the BLE peripheral',
  'ble.lotus_ble_send_string.tooltip':      'Send a string via BLE notification',
  'ble.lotus_ble_send_number.tooltip':      'Send a number via BLE notification',
  'ble.lotus_ble_received_string.tooltip':  'Read the most recent string received from the BLE client',
  'ble.lotus_ble_is_connected.tooltip':     'true when a BLE client is connected',
  'ble.lotus_ble_has_data.tooltip':         'true when new data has arrived from the BLE client',
  'ble.lotus_ble_on_received.tooltip':      'Run when data arrives from the BLE client',
  'ble.lotus_ble_clear.tooltip':            'Clear the receive buffer',

  // ── Blocks: Blynk 1.0 IoT setup (blocks_iot.js) ───────────────────────────
  'iotsetup.blynk_iot_setup_code.tooltip':  'Connect to Blynk 1.0 — Server: rail.kls.ac.th Port: 8080',

  // ── Blocks: Legacy sensors (blocks_sensor.js — old set, may still appear in toolbox) ──
  'legacy.button_1_status.tooltip':         'Whether the green button is pressed (returns 1 if pressed, 0 otherwise)',
  'legacy.button_2_status.tooltip':         'Whether the red button is pressed (returns 1 if pressed, 0 otherwise)',
  'legacy.analog_sensor.tooltip':           'Read analog value from the selected pin (0–1023)',
  'legacy.digital_sensor.tooltip':          'Read digital value from the selected pin (0 or 1) using threshold 500',
  'legacy.TCS_read_rgb.tooltip':            'Read RGB colour from the TCS34725 sensor',
  'legacy.Knob_status.tooltip':             'Read the knob (variable resistor) — value 0–1023',
  'legacy.sw1_press.tooltip':               'Wait until the start button (GPIO27) is pressed',
  'legacy.WIT_beep.tooltip':                'Beep the buzzer for 200 milliseconds',
  'legacy.WIT_beep_delay.tooltip':          'Beep the buzzer for the given number of milliseconds',
  'legacy.WIT_beep_on.tooltip':             'Turn the buzzer on (continuous)',
  'legacy.WIT_beep_off.tooltip':            'Turn the buzzer off (silent)',
  'legacy.bmp280_begin.tooltip':            'Initialise the BMP280 sensor (place in Setup)',
  'legacy.bmp280_read_temperature.tooltip': 'Read temperature from BMP280 (°C)',
  'legacy.bmp280_read_pressure.tooltip':    'Read pressure from BMP280 (hPa — hectopascals)',
  'legacy.bmp280_read_altitude.tooltip':    'Read altitude from BMP280 (metres) — computed against sea-level pressure 1013.25 hPa',
  'legacy.bmp280_read_all.tooltip':         'Read all values from BMP280 into variables',
  'legacy.mlx90614_begin.tooltip':          'Initialise the MLX90614 IR temperature sensor (place in Setup)',
  'legacy.mlx90614_read_object.tooltip':    'Read object temperature from MLX90614 (°C)',
  'legacy.mlx90614_read_ambient.tooltip':   'Read ambient temperature from MLX90614 (°C)',
  'legacy.mlx90614_read_both.tooltip':      'Read both temperatures from MLX90614 into variables',
  'legacy.mlx90614_read_object_f.tooltip':  'Read object temperature from MLX90614 (°F)',
  'legacy.mlx90614_read_ambient_f.tooltip': 'Read ambient temperature from MLX90614 (°F)',

  // ── Blocks: Motors (LotusDevkit4Wheels-only — blocks_motor.js) ────────────
  'motor.move_front.tooltip':  'Drive the front motor pair — M1 = front-left (D13), M2 = front-right (D4). Range -100 to +100 %.',
  'motor.move_rear.tooltip':   'Drive the rear motor pair — M3 = rear-left (D14), M4 = rear-right (D23). Range -100 to +100 %.',

  // ── Blocks: Functions (LotusNanoBot — blocks_functions.js) ────────────────
  'func.define_void.tooltip':         'Function that takes no parameters and returns nothing — void myFunction() { }',
  'func.call_void.tooltip':           'Call a function that takes no parameters and returns nothing',
  'func.define_param.tooltip':        'Function that takes parameters but returns nothing — void myFunction(int x) { }',
  'func.call_param.tooltip':          'Call a function that takes parameters but returns nothing',
  'func.define_return.tooltip':       'Function with no parameters that returns a value — int myFunction() { return val; }',
  'func.call_return.tooltip':         'Call a function that returns a value (no parameters)',
  'func.define_param_return.tooltip': 'Function that takes parameters and returns a value — int myFunction(int x) { return val; }',
  'func.call_param_return.tooltip':   'Call a function that takes parameters and returns a value',
  'func.return_statement.tooltip':    'Return a value from the function (only usable inside a function)',
  'func.get_param.tooltip':           'Get the value of a parameter passed into the function — name must match the definition',

  // ── UI: MenuBar (about box + menu items) ──────────────────────────────────
  'menu.about.license_para1':  'License: Free for any use including education.',
  'menu.about.license_para2':  'Redistribution of the official installer is allowed without modification,',
  'menu.about.license_para3':  'and you may freely develop your own Plugins / Boards.',
  'menu.about.license_para4':  'Modifying the IDE itself, or reusing the "Lotus" trademark for another brand, is not permitted.',
  'menu.about.third_party':    'Full third-party license list is available under "Third-Party Notices".',
  'menu.diagnose_esp32':       'Diagnose ESP32…',

  // ── UI: DiagnoseEsp32Dialog ───────────────────────────────────────────────
  'diag.title':                'ESP32 Health Check',
  'diag.intro':                'Use this when a compile against an ESP32 board fails (e.g. "cannot find the path specified", "header not found", or compile is unusually slow) — the items below check every spot that has caused trouble before.',
  'diag.start':                'Start check',
  'diag.running':              'Checking system…',
  'diag.summary_ok':           'Everything looks fine',
  'diag.summary_problems':     (n) => 'Found ' + n + ' problem' + (n === 1 ? '' : 's'),
  'diag.checked_at':           (when) => 'Checked at ' + when,
  'diag.copy_report':          'Copy report',
  'diag.clear_cache_btn':      'Clear build cache',
  'diag.reinstall_core_btn':   'Remove ESP32 core to reinstall',
  'diag.defender_btn':         'Add Defender exclusion (requires UAC)',
  'diag.recheck':              'Check again',
  'diag.close':                'Close',
  'diag.cleared_ok':           'Build cache cleared — try compiling again',
  'diag.cleared_fail':         'Failed to clear cache (a file may be in use)',
  'diag.defender_ok':          'Exclusion added — Defender will skip the LotusIDE folder; compiles should be faster now',
  'diag.defender_cancel':      'You cancelled UAC — exclusion was not added',
  'diag.defender_fail':        (err) => 'Failed to add exclusion: ' + err,
  'diag.confirm_remove_core':  'Remove the current ESP32 core (~600 MB) — it will have to be downloaded again. Continue?',
  'diag.removed_core_ok':      'ESP32 core removed — open Lotus → Manage Boards → Cores and click Download ESP32',
  'diag.removed_core_fail':    'Removal failed (a file may be in use) — close LotusIDE and remove the folder manually',
  'diag.copy_success':         'Report copied',
  'diag.copy_fail':            'Copy failed',

  // ── UI: Sidebar ───────────────────────────────────────────────────────────
  'sidebar.help_tooltip':      'Help',
}

const th = {
  'language.label': 'ภาษา',
  'language.toggle_tooltip': 'สลับภาษาของ UI',

  'boardCompat.popup': (count, boardName) =>
    `การสลับเป็น "${boardName}" ทำให้ ${count} block ใช้ไม่ได้\n\n` +
    `OK = ลบทิ้ง (เหลือแค่ setup/loop, backup ใน Browser storage)\n` +
    `Cancel = เก็บไว้ (block จะถูก disable + ⚠ เตือน)`,
  'boardCompat.removed_with_backup': (n, key) =>
    `ลบ ${n} block (backup: ${key})`,
  'boardCompat.removed_no_backup': (n) =>
    `ลบ ${n} block (backup ล้มเหลว — ดู console)`,
  'boardCompat.disabled_count': (n) =>
    `ปิดใช้งาน ${n} block ที่ไม่รองรับบนบอร์ดนี้`,
  'boardCompat.reenabled_count': (n) =>
    `เปิดใช้งาน ${n} block ที่กลับมารองรับแล้ว`,
  'boardCompat.warning_tooltip':
    '⚠ ไม่รองรับบนบอร์ดนี้ — สลับบอร์ดกลับเพื่อใช้งาน',

  // ── Blocks: WiFi (LotusDevkit + LotusDevkit4Wheels) ───────────────────────
  'wifi.label.password': 'รหัสผ่าน',
  'wifi.lt_wifi_begin.tooltip':
    'เชื่อม WiFi (Station mode) — รอจนเชื่อมต่อสำเร็จหรือครบ 15 วินาที (ใส่ใน setup)',
  'wifi.lt_wifi_is_connected.tooltip':
    'คืน true ถ้า WiFi เชื่อมต่อ AP สำเร็จ',
  'wifi.lt_wifi_local_ip.tooltip':
    'IP address ของบอร์ดในเครือข่าย เช่น 192.168.1.42',
  'wifi.lt_wifi_rssi.tooltip':
    'ความแรงสัญญาณ ค่าเป็นลบ ใกล้ 0 = แรง (เช่น -50 = ดี, -90 = แย่)',
  'wifi.lt_http_get.tooltip':
    'ส่ง HTTP GET ไปยัง URL คืน response body (String ว่างถ้า fail)',
  'wifi.lt_http_post.tooltip':
    'ส่ง HTTP POST ไปยัง URL พร้อม body คืน response body (String ว่างถ้า fail)',
  'wifi.lt_wifi_ap_begin.tooltip':
    'เปิด Access Point ให้อุปกรณ์อื่นเชื่อมเข้ามา (password ต้อง ≥ 8 ตัว) — ใช้ห้องเรียนไม่มี router',
  'wifi.lt_wifi_ap_ip.tooltip':
    'IP ของบอร์ดในโหมด AP ค่า default คือ 192.168.4.1',
  'wifi.lt_wifi_ap_clients.tooltip':
    'จำนวนอุปกรณ์ที่เชื่อมเข้า AP อยู่ตอนนี้',

  // ── Blocks: Sensors (LotusDevkit + LotusDevkit4Wheels — blocks_sensors_new.js) ──
  'sensors.lt_dht_begin.tooltip':            'เริ่มต้น DHT sensor',
  'sensors.lt_dht_temperature.tooltip':      'อ่านอุณหภูมิจาก DHT (°C)',
  'sensors.lt_dht_humidity.tooltip':         'อ่านความชื้นสัมพัทธ์จาก DHT (%)',
  'sensors.lt_sht31_begin.tooltip':          'เริ่มต้น SHT31 (I2C 0x44)',
  'sensors.lt_sht31_temperature.tooltip':    'อ่านอุณหภูมิจาก SHT31 (°C)',
  'sensors.lt_sht31_humidity.tooltip':       'อ่านความชื้นจาก SHT31 (%)',
  'sensors.lt_mlx_begin.tooltip':            'เริ่มต้น MLX90614 IR Temperature sensor (I2C)',
  'sensors.lt_mlx_object_temp.tooltip':      'อ่านอุณหภูมิวัตถุ (IR) จาก MLX90614',
  'sensors.lt_mlx_ambient_temp.tooltip':     'อ่านอุณหภูมิสิ่งแวดล้อมจาก MLX90614',
  'sensors.lt_bmp280_begin.tooltip':         'เริ่มต้น BMP280 (I2C 0x76 หรือ 0x77)',
  'sensors.lt_bmp280_temperature.tooltip':   'อ่านอุณหภูมิจาก BMP280',
  'sensors.lt_bmp280_pressure.tooltip':      'อ่านความดันอากาศจาก BMP280 (hPa)',
  'sensors.lt_bmp280_altitude.tooltip':      'คำนวณความสูงจากระดับน้ำทะเล (m)',
  'sensors.lt_bh1750_begin.tooltip':         'เริ่มต้น BH1750 Light sensor (I2C)',
  'sensors.lt_bh1750_lux.tooltip':           'อ่านความเข้มแสง (lux) จาก BH1750',
  'sensors.lt_pms_begin.tooltip':            'เริ่มต้น PMS Dust Sensor (Serial)',
  'sensors.lt_pms_read.tooltip':             'อ่านข้อมูลจาก PMS Dust sensor',
  'sensors.lt_pms_pm25.tooltip':             'ค่าฝุ่น PM2.5 (µg/m³)',
  'sensors.lt_pms_pm10.tooltip':             'ค่าฝุ่น PM10 (µg/m³)',
  'sensors.lt_pms_pm100.tooltip':            'ค่าฝุ่น PM100 (µg/m³)',
  'sensors.lt_mpu6050_begin.tooltip':        'เริ่มต้น MPU6050 Gyro+Accelerometer (I2C 0x68)',
  'sensors.lt_mpu6050_update.tooltip':       'อ่านข้อมูลใหม่จาก MPU6050 (ใส่ใน loop)',
  'sensors.lt_mpu6050_accel.tooltip':        'ค่า Accelerometer X/Y/Z (m/s²)',
  'sensors.lt_mpu6050_gyro.tooltip':         'ค่า Gyroscope X/Y/Z (°/s)',
  'sensors.lt_mpu6050_temp.tooltip':         'อ่านอุณหภูมิภายใน MPU6050',
  'sensors.lt_compass_begin.tooltip':        'เริ่มต้น HMC5883L หรือ QMC5883L Compass (I2C)',
  'sensors.lt_compass_read.tooltip':         'อ่านค่าจาก Compass sensor',
  'sensors.lt_compass_heading.tooltip':      'ทิศทางแม่เหล็ก (0–360°)',
  'sensors.lt_compass_axis.tooltip':         'ค่าแกน X/Y/Z ของ Compass (gauss)',
  'sensors.lt_ultrasonic_begin.tooltip':     'ตั้งค่า Ultrasonic sensor (HC-SR04)',
  'sensors.lt_ultrasonic_cm.tooltip':        'อ่านระยะทาง (เซนติเมตร) จาก HC-SR04',
  'sensors.lt_ultrasonic_inch.tooltip':      'อ่านระยะทาง (นิ้ว) จาก HC-SR04',
  'sensors.lt_rtc_begin.tooltip':            'เริ่มต้น RTC Module DS1307 / DS3231 (I2C)',
  'sensors.lt_rtc_set_time.tooltip':         'ตั้งเวลา RTC',
  'sensors.lt_rtc_now.tooltip':              'อ่านเวลาจาก RTC',
  'sensors.lt_rtc_datetime_string.tooltip':  'คืนค่าวันเวลาเป็น String เช่น "2025-01-15 14:30:00"',
  'sensors.lt_dfplayer_begin.tooltip':       'เริ่มต้น DFPlayer Mini MP3',
  'sensors.lt_dfplayer_play.tooltip':        'เล่นไฟล์เพลงหมายเลขที่กำหนด (1–999)',
  'sensors.lt_dfplayer_volume.tooltip':      'ตั้งระดับเสียง 0–30',
  'sensors.lt_dfplayer_pause.tooltip':       'หยุดเล่นชั่วคราว',
  'sensors.lt_dfplayer_stop.tooltip':        'หยุดเล่น',
  'sensors.lt_dfplayer_next.tooltip':        'เล่นเพลงถัดไป',
  'sensors.lt_dfplayer_prev.tooltip':        'เล่นเพลงก่อนหน้า',
  'sensors.lt_lcd_begin.tooltip':            'เริ่มต้น LCD I2C (0x27 หรือ 0x3F)',
  'sensors.lt_lcd_print.tooltip':            'แสดงข้อความบน LCD ที่ตำแหน่ง col, row',
  'sensors.lt_lcd_clear.tooltip':            'ลบข้อความทั้งหมดบน LCD',
  'sensors.lt_lcd_backlight.tooltip':        'เปิด/ปิดไฟหลัง LCD',

  // ── Blocks: IoT Extras (Blynk 1.0 / 2.0 / NETPIE / MQTT / UDP) ────────────
  'iotmore.in_loop':
    'ใส่ใน loop()',
  'iotmore.blynk_iot_virtual_write.tooltip':       'ส่งค่าไปยัง Virtual Pin บน Blynk App',
  'iotmore.blynk_iot_virtual_read.tooltip':        'อ่านค่าจาก Virtual Pin บน Blynk App',
  'iotmore.blynk_iot_on_virtual_write.tooltip':    'ทำงานเมื่อมีค่าส่งมาจาก Blynk App ที่ Virtual Pin',
  'iotmore.blynk_iot_sync_all.tooltip':            'ขอให้ Blynk Server ส่งค่าล่าสุดของ Virtual Pins ทั้งหมด',
  'iotmore.blynk_iot_sync_virtual.tooltip':        'ขอให้ Blynk Server ส่งค่าล่าสุดของ Virtual Pin ที่ระบุ',
  'iotmore.blynk_iot_push.tooltip':                'ส่งการแจ้งเตือนแบบ Push ไปยัง Blynk App',
  'iotmore.blynk_iot_notify.tooltip':              'ส่งการแจ้งเตือนไปยัง Blynk App',
  'iotmore.blynk_iot_tweet.tooltip':               'ส่งทวีตผ่าน Blynk (ต้องเชื่อมต่อ Twitter แล้ว)',
  'iotmore.blynk_iot_run.tooltip':                 'เรียกใน loop() เพื่อให้ Blynk ทำงาน',
  'iotmore.blynk_iot_connected.tooltip':           'ตรวจสอบสถานะการเชื่อมต่อ Blynk',
  'iotmore.lt_blynk2_begin.tooltip':               'เชื่อมต่อ Blynk 2.0',
  'iotmore.lt_blynk2_set_virtual.tooltip':         'ส่งค่าไปยัง Virtual Pin',
  'iotmore.lt_blynk2_get_virtual.tooltip':         'อ่านค่าจาก Virtual Pin',
  'iotmore.lt_blynk2_on_write.tooltip':            'ทำงานเมื่อ Blynk ส่งค่ามา',
  'iotmore.lt_blynk2_connected.tooltip':           'true ถ้าเชื่อมต่อ Blynk 2.0 สำเร็จ',
  'iotmore.lt_netpie_begin.tooltip':               'ตั้งค่าและเชื่อมต่อ NETPIE 2020',
  'iotmore.lt_netpie_publish.tooltip':             'ส่งข้อมูลไปยัง NETPIE 2020',
  'iotmore.lt_netpie_on_message.tooltip':          'ทำงานเมื่อได้รับข้อมูลจาก NETPIE 2020',
  'iotmore.lt_netpie_msg_topic.tooltip':           'Topic ของข้อความล่าสุด',
  'iotmore.lt_netpie_msg_payload.tooltip':         'Payload ของข้อความล่าสุด',
  'iotmore.lt_netpie_connected.tooltip':           'true ถ้าเชื่อมต่อ NETPIE 2020 สำเร็จ',
  'iotmore.lt_udp_begin.tooltip':                  'เปิด UDP Socket บน port ที่กำหนด',
  'iotmore.lt_udp_send.tooltip':                   'ส่งข้อมูลผ่าน UDP ไปยัง IP:Port',
  'iotmore.lt_udp_receive.tooltip':                'อ่านข้อมูล UDP ที่ได้รับล่าสุด',
  'iotmore.lt_udp_remote_ip.tooltip':              'IP address ของผู้ส่ง UDP',
  'iotmore.lt_udp_packet_size.tooltip':            'ขนาด UDP packet (0 = ยังไม่มีข้อมูล)',
  'iotmore.lt_mqtt_begin.tooltip':                 'ตั้งค่าและเชื่อมต่อ MQTT Broker',
  'iotmore.lt_mqtt_publish.tooltip':               'ส่งข้อมูลไปยัง MQTT Broker',
  'iotmore.lt_mqtt_subscribe.tooltip':             'สมัครรับข้อมูลจาก MQTT Topic',
  'iotmore.lt_mqtt_on_message.tooltip':            'ทำงานเมื่อได้รับข้อมูล MQTT',
  'iotmore.lt_mqtt_msg_topic.tooltip':             'Topic ของข้อความ MQTT ล่าสุด',
  'iotmore.lt_mqtt_msg_payload.tooltip':           'Payload ของข้อความ MQTT ล่าสุด',
  'iotmore.lt_mqtt_connected.tooltip':             'true ถ้าเชื่อมต่อ MQTT Broker สำเร็จ',

  // ── Blocks: BLE (LotusDevkit + LotusDevkit4Wheels — blocks_ble.js) ────────
  'ble.lotus_ble_begin.tooltip':            'เริ่มต้น BLE Server และตั้งชื่ออุปกรณ์',
  'ble.lotus_ble_advertise_start.tooltip':  'เริ่มประกาศสัญญาณ BLE ให้อุปกรณ์อื่นค้นพบได้',
  'ble.lotus_ble_advertise_stop.tooltip':   'หยุดประกาศสัญญาณ BLE',
  'ble.lotus_ble_send_string.tooltip':      'ส่งข้อความผ่าน BLE Notification',
  'ble.lotus_ble_send_number.tooltip':      'ส่งตัวเลขผ่าน BLE Notification',
  'ble.lotus_ble_received_string.tooltip':  'อ่านข้อความล่าสุดที่ได้รับจาก BLE client',
  'ble.lotus_ble_is_connected.tooltip':     'คืนค่า true ถ้ามี BLE client เชื่อมต่ออยู่',
  'ble.lotus_ble_has_data.tooltip':         'คืนค่า true ถ้ามีข้อมูลใหม่จาก BLE client',
  'ble.lotus_ble_on_received.tooltip':      'ทำงานเมื่อได้รับข้อมูลจาก BLE client',
  'ble.lotus_ble_clear.tooltip':            'ล้างบัฟเฟอร์ข้อมูลที่รับมา',

  // ── Blocks: Blynk 1.0 IoT setup (blocks_iot.js) ───────────────────────────
  'iotsetup.blynk_iot_setup_code.tooltip':  'เชื่อมต่อ Blynk 1.0 — Server: rail.kls.ac.th Port: 8080',

  // ── Blocks: Legacy sensors (blocks_sensor.js) ─────────────────────────────
  'legacy.button_1_status.tooltip':         'ตรวจสอบว่ากดปุ่มสีเขียวหรือไม่ (คืนค่า 1 ถ้ากด, 0 ถ้าไม่กด)',
  'legacy.button_2_status.tooltip':         'ตรวจสอบว่ากดปุ่มสีแดงหรือไม่ (คืนค่า 1 ถ้ากด, 0 ถ้าไม่กด)',
  'legacy.analog_sensor.tooltip':           'อ่านค่า analog จากขาที่เลือก (ค่า 0-1023)',
  'legacy.digital_sensor.tooltip':          'อ่านค่า digital จากขาที่เลือก (0 หรือ 1) โดยใช้ค่า threshold 500',
  'legacy.TCS_read_rgb.tooltip':            'อ่านค่าสี RGB จากเซนเซอร์ TCS34725',
  'legacy.Knob_status.tooltip':             'อ่านค่าจาก Knob (ตัวต้านทานปรับค่าได้) ค่า 0-1023',
  'legacy.sw1_press.tooltip':               'รอจนกว่าจะกดปุ่มเริ่มต้น (GPIO27)',
  'legacy.WIT_beep.tooltip':                'ทำให้ Buzzer ส่งเสียงดัง 200 มิลลิวินาที',
  'legacy.WIT_beep_delay.tooltip':          'ทำให้ Buzzer ส่งเสียงดังตามระยะเวลาที่กำหนด (มิลลิวินาที)',
  'legacy.WIT_beep_on.tooltip':             'เปิด Buzzer (ดังต่อเนื่อง)',
  'legacy.WIT_beep_off.tooltip':            'ปิด Buzzer (เงียบ)',
  'legacy.bmp280_begin.tooltip':            'เริ่มต้นการทำงานของเซนเซอร์ BMP280 (ต้องใส่ใน Setup)',
  'legacy.bmp280_read_temperature.tooltip': 'อ่านค่าอุณหภูมิจาก BMP280 (องศาเซลเซียส)',
  'legacy.bmp280_read_pressure.tooltip':    'อ่านค่าความกดอากาศจาก BMP280 (hPa - เฮกโตปาสกาล)',
  'legacy.bmp280_read_altitude.tooltip':    'อ่านค่าความสูงจาก BMP280 (เมตร) คำนวณจากความกดอากาศที่ระดับน้ำทะเล 1013.25 hPa',
  'legacy.bmp280_read_all.tooltip':         'อ่านค่าจาก BMP280 ทั้งหมดและเก็บไว้ในตัวแปร',
  'legacy.mlx90614_begin.tooltip':          'เริ่มต้นการทำงานของเซนเซอร์วัดอุณหภูมิอินฟราเรด MLX90614 (ต้องใส่ใน Setup)',
  'legacy.mlx90614_read_object.tooltip':    'อ่านค่าอุณหภูมิของวัตถุจาก MLX90614 (องศาเซลเซียส)',
  'legacy.mlx90614_read_ambient.tooltip':   'อ่านค่าอุณหภูมิแวดล้อมจาก MLX90614 (องศาเซลเซียส)',
  'legacy.mlx90614_read_both.tooltip':      'อ่านค่าอุณหภูมิจาก MLX90614 ทั้งสองค่าและเก็บไว้ในตัวแปร',
  'legacy.mlx90614_read_object_f.tooltip':  'อ่านค่าอุณหภูมิของวัตถุจาก MLX90614 (องศาฟาเรนไฮต์)',
  'legacy.mlx90614_read_ambient_f.tooltip': 'อ่านค่าอุณหภูมิแวดล้อมจาก MLX90614 (องศาฟาเรนไฮต์)',

  // ── Blocks: Motors (LotusDevkit4Wheels-only — blocks_motor.js) ────────────
  'motor.move_front.tooltip':  'ควบคุมมอเตอร์คู่หน้า: M1=ซ้ายหน้า (D13), M2=ขวาหน้า (D4). Range -100 to +100 %.',
  'motor.move_rear.tooltip':   'ควบคุมมอเตอร์คู่หลัง: M3=ซ้ายหลัง (D14), M4=ขวาหลัง (D23). Range -100 to +100 %.',

  // ── Blocks: Functions (LotusNanoBot — blocks_functions.js) ────────────────
  'func.define_void.tooltip':         'ฟังก์ชันที่ไม่รับค่า และไม่ส่งค่ากลับ  →  void myFunction() { }',
  'func.call_void.tooltip':           'เรียกใช้ฟังก์ชันที่ไม่รับค่า ไม่ส่งค่ากลับ',
  'func.define_param.tooltip':        'ฟังก์ชันที่รับค่า แต่ไม่ส่งค่ากลับ  →  void myFunction(int x) { }',
  'func.call_param.tooltip':          'เรียกใช้ฟังก์ชันที่รับค่า แต่ไม่ส่งค่ากลับ',
  'func.define_return.tooltip':       'ฟังก์ชันที่ไม่รับค่า แต่ส่งค่ากลับ  →  int myFunction() { return val; }',
  'func.call_return.tooltip':         'เรียกใช้ฟังก์ชันที่ส่งค่ากลับ (ไม่รับ parameter)',
  'func.define_param_return.tooltip': 'ฟังก์ชันที่รับค่า และส่งค่ากลับ  →  int myFunction(int x) { return val; }',
  'func.call_param_return.tooltip':   'เรียกใช้ฟังก์ชันที่รับค่า และส่งค่ากลับ',
  'func.return_statement.tooltip':    'ส่งค่ากลับออกจากฟังก์ชัน (ใช้ได้เฉพาะภายในฟังก์ชัน)',
  'func.get_param.tooltip':           'ดึงค่า parameter ที่ส่งเข้ามาในฟังก์ชัน ชื่อต้องตรงกับที่กำหนดไว้',

  // ── UI: MenuBar ──────────────────────────────────────────────────────────
  'menu.about.license_para1':  'License: ฟรีสำหรับใช้งานทุกกรณี รวมการศึกษา',
  'menu.about.license_para2':  'อนุญาตให้แจกจ่ายตัวติดตั้งทางการได้ตามไม่ดัดแปลง',
  'menu.about.license_para3':  'และพัฒนา Plugin / Board ของตนเองได้เสรี',
  'menu.about.license_para4':  'ห้ามดัดแปลงตัว IDE หรือใช้เครื่องหมายการค้า "Lotus" เป็นแบรนด์อื่น',
  'menu.about.third_party':    'ดูรายการลิขสิทธิ์ครบถ้วนได้ที่ "Third-Party Notices"',
  'menu.diagnose_esp32':       'ตรวจสุขภาพ ESP32...',

  // ── UI: DiagnoseEsp32Dialog ──────────────────────────────────────────────
  'diag.title':                'ตรวจสุขภาพ ESP32',
  'diag.intro':                'ใช้เมื่อ compile บอร์ดตระกูล ESP32 แล้ว error (เช่น "cannot find the path specified", "header not found", หรือ compile ช้าผิดปกติ) — รายการด้านล่างเช็คให้ครบทุกจุดที่เคยพบปัญหา',
  'diag.start':                'เริ่มตรวจ',
  'diag.running':              'กำลังตรวจระบบ…',
  'diag.summary_ok':           'ทุกอย่างปกติ',
  'diag.summary_problems':     (n) => 'พบปัญหา ' + n + ' จุด',
  'diag.checked_at':           (when) => 'ตรวจเมื่อ ' + when,
  'diag.copy_report':          'คัดลอกรายงาน',
  'diag.clear_cache_btn':      'ล้าง build cache',
  'diag.reinstall_core_btn':   'ลบ ESP32 core เพื่อติดตั้งใหม่',
  'diag.defender_btn':         'เพิ่มข้อยกเว้น Defender (ต้องอนุญาต UAC)',
  'diag.recheck':              'ตรวจอีกครั้ง',
  'diag.close':                'ปิด',
  'diag.cleared_ok':           'ล้าง build cache เรียบร้อย — ลอง compile อีกครั้ง',
  'diag.cleared_fail':         'ลบ cache ไม่สำเร็จ (อาจมีไฟล์กำลังถูกใช้)',
  'diag.defender_ok':          'เพิ่มข้อยกเว้นเรียบร้อย — Defender จะข้าม folder LotusIDE แล้ว ลอง compile ใหม่จะเร็วขึ้น',
  'diag.defender_cancel':      'คุณยกเลิก UAC — ยังไม่ได้เพิ่ม exclusion',
  'diag.defender_fail':        (err) => 'เพิ่มข้อยกเว้นไม่สำเร็จ: ' + err,
  'diag.confirm_remove_core':  'ลบ ESP32 core ปัจจุบันออก (~600 MB) แล้วต้องดาวน์โหลดใหม่ ดำเนินการต่อไหม?',
  'diag.removed_core_ok':      'ลบ ESP32 core แล้ว — เปิด Lotus → Manage Boards → Cores แล้วกด Download ESP32',
  'diag.removed_core_fail':    'ลบไม่สำเร็จ (อาจมีไฟล์กำลังถูกใช้) — ปิด LotusIDE แล้วลบโฟลเดอร์ manual',
  'diag.copy_success':         'คัดลอกรายงานแล้ว',
  'diag.copy_fail':            'คัดลอกไม่สำเร็จ',

  // ── UI: Sidebar ──────────────────────────────────────────────────────────
  'sidebar.help_tooltip':      'ช่วยเหลือ',
}

export default { en, th }
