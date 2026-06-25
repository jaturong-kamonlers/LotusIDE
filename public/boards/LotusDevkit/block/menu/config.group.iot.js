module.exports = {
  name: 'IoT',
  index: 15,
  color: '230',
  icon: '/icons/iot.svg',
  blocks: [

    // ── WiFi (Station + HTTP + AP) ────────────────────────────────
    { xml: '<label text="WiFi" web-class="headline"></label>' },
    'lt_wifi_begin',
    'lt_wifi_is_connected',
    'lt_wifi_local_ip',
    'lt_wifi_rssi',
    { xml: '<block type="lt_http_get"><value name="URL"><shadow type="text"><field name="TEXT">https://api.kls.ac.th/time</field></shadow></value></block>' },
    { xml: '<block type="lt_http_post"><value name="URL"><shadow type="text"><field name="TEXT">https://api.kls.ac.th/log</field></shadow></value><value name="BODY"><shadow type="text"><field name="TEXT">value=42</field></shadow></value></block>' },
    'lt_wifi_ap_begin',
    'lt_wifi_ap_ip',
    'lt_wifi_ap_clients',

    // ── MQTT ──────────────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="MQTT" web-class="headline"></label>' },
    'lt_mqtt_begin',
    'lt_mqtt_loop',
    { xml: '<block type="lt_mqtt_publish"><value name="TOPIC"><shadow type="text"><field name="TEXT">lotus/data</field></shadow></value><value name="VALUE"><shadow type="text"><field name="TEXT">hello</field></shadow></value></block>' },
    { xml: '<block type="lt_mqtt_subscribe"><value name="TOPIC"><shadow type="text"><field name="TEXT">lotus/command</field></shadow></value></block>' },
    'lt_mqtt_on_message',
    'lt_mqtt_msg_topic',
    'lt_mqtt_msg_payload',
    { xml: '<block type="lt_mqtt_payload_of"><value name="TOPIC"><shadow type="text"><field name="TEXT">lotus/data</field></shadow></value></block>' },
    'lt_mqtt_connected',

    // ── Blynk 1.0 (Legacy) ────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="Blynk 1.0 (Legacy)" web-class="headline"></label>' },
    'blynk_iot_setup_code',
    { xml: '<block type="blynk_iot_virtual_write"><value name="VALUE"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block>' },
    'blynk_iot_virtual_read',
    'blynk_iot_on_virtual_write',
    'blynk_iot_sync_all',
    'blynk_iot_sync_virtual',
    'blynk_iot_push',
    'blynk_iot_notify',
    'blynk_iot_tweet',
    'blynk_iot_run',
    'blynk_iot_connected',

    // ── Blynk 2.0 ─────────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="Blynk 2.0" web-class="headline"></label>' },
    'lt_blynk2_begin',
    'lt_blynk2_run',
    { xml: '<block type="lt_blynk2_set_virtual"><value name="PIN"><shadow type="math_number"><field name="NUM">0</field></shadow></value><value name="VALUE"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block>' },
    'lt_blynk2_get_virtual',
    'lt_blynk2_on_write',
    'lt_blynk2_connected',

    // ── NETPIE 2020 ───────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="NETPIE 2020" web-class="headline"></label>' },
    'lt_netpie_begin',
    'lt_netpie_loop',
    { xml: '<block type="lt_netpie_publish"><value name="TOPIC"><shadow type="text"><field name="TEXT">@shadow/data/update</field></shadow></value><value name="VALUE"><shadow type="text"><field name="TEXT">{"temp":25}</field></shadow></value></block>' },
    'lt_netpie_on_message',
    'lt_netpie_msg_topic',
    'lt_netpie_msg_payload',
    'lt_netpie_connected',

    // ── UDP ───────────────────────────────────────────────────────
    { xml: '<sep gap="32"></sep><label text="UDP" web-class="headline"></label>' },
    'lt_udp_begin',
    { xml: '<block type="lt_udp_send"><value name="IP"><shadow type="text"><field name="TEXT">192.168.1.255</field></shadow></value><value name="PORT"><shadow type="math_number"><field name="NUM">4210</field></shadow></value><value name="DATA"><shadow type="text"><field name="TEXT">hello</field></shadow></value></block>' },
    'lt_udp_receive',
    'lt_udp_remote_ip',
    'lt_udp_packet_size',
  ]
};