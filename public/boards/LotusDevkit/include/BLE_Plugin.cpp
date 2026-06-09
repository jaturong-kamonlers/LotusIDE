#include "BLE_Plugin.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <esp_wifi.h>
#include <WiFi.h>
#include "esp32-hal-bt.h"   // btStart() / btStop()

static uint8_t NUS_SVC_UUID[16] = {0x9E,0xCA,0xDC,0x24,0x0E,0xE5,0xA9,0xE0,0x93,0xF3,0xA3,0xB5,0x01,0x00,0x40,0x6E};
static uint8_t NUS_RX_UUID[16]  = {0x9E,0xCA,0xDC,0x24,0x0E,0xE5,0xA9,0xE0,0x93,0xF3,0xA3,0xB5,0x02,0x00,0x40,0x6E};
static uint8_t NUS_TX_UUID[16]  = {0x9E,0xCA,0xDC,0x24,0x0E,0xE5,0xA9,0xE0,0x93,0xF3,0xA3,0xB5,0x03,0x00,0x40,0x6E};

BLE_Plugin* _ble_plugin_instance = nullptr;
#define GATTS_APP_ID   0
#define GATTS_HANDLES  8
#define BLE_MTU        20

static uint16_t _svc_hdl=0,_rx_hdl=0,_tx_hdl=0,_cccd_hdl=0;
static bool _notify_en=false,_adv_data_set=false,_scan_rsp_data_set=false;

static void gap_cb(esp_gap_ble_cb_event_t ev, esp_ble_gap_cb_param_t* p) {
    switch(ev) {
    case ESP_GAP_BLE_ADV_DATA_SET_COMPLETE_EVT:
        _adv_data_set=true; Serial.println("[BLE] adv_data OK");
        if(_adv_data_set&&_scan_rsp_data_set&&_ble_plugin_instance) _ble_plugin_instance->_startAdvertisingNow();
        break;
    case ESP_GAP_BLE_SCAN_RSP_DATA_SET_COMPLETE_EVT:
        _scan_rsp_data_set=true; Serial.println("[BLE] scan_rsp OK");
        if(_adv_data_set&&_scan_rsp_data_set&&_ble_plugin_instance) _ble_plugin_instance->_startAdvertisingNow();
        break;
    case ESP_GAP_BLE_ADV_START_COMPLETE_EVT:
        if(p->adv_start_cmpl.status==ESP_BT_STATUS_SUCCESS) Serial.println("[BLE] Advertising started!");
        else Serial.printf("[BLE] Adv FAILED: %d\n",p->adv_start_cmpl.status);
        break;
    default: break;
    }
}

static void gatts_cb(esp_gatts_cb_event_t ev, esp_gatt_if_t gif, esp_ble_gatts_cb_param_t* p) {
    if(!_ble_plugin_instance) return;
    switch(ev) {
    case ESP_GATTS_REG_EVT:
        _ble_plugin_instance->_setGattsIf(gif);
        { esp_gatt_srvc_id_t sid={}; sid.is_primary=true; sid.id.inst_id=0;
          sid.id.uuid.len=ESP_UUID_LEN_128; memcpy(sid.id.uuid.uuid.uuid128,NUS_SVC_UUID,16);
          esp_ble_gatts_create_service(gif,&sid,GATTS_HANDLES); }
        break;
    case ESP_GATTS_CREATE_EVT:
        _svc_hdl=p->create.service_handle; esp_ble_gatts_start_service(_svc_hdl);
        { esp_bt_uuid_t u={}; u.len=ESP_UUID_LEN_128; memcpy(u.uuid.uuid128,NUS_RX_UUID,16);
          esp_ble_gatts_add_char(_svc_hdl,&u,ESP_GATT_PERM_WRITE,
              ESP_GATT_CHAR_PROP_BIT_WRITE|ESP_GATT_CHAR_PROP_BIT_WRITE_NR,nullptr,nullptr); }
        break;
    case ESP_GATTS_ADD_CHAR_EVT:
        if(_rx_hdl==0){
            _rx_hdl=p->add_char.attr_handle;
            esp_bt_uuid_t u={}; u.len=ESP_UUID_LEN_128; memcpy(u.uuid.uuid128,NUS_TX_UUID,16);
            esp_ble_gatts_add_char(_svc_hdl,&u,ESP_GATT_PERM_READ,ESP_GATT_CHAR_PROP_BIT_NOTIFY,nullptr,nullptr);
        } else {
            _tx_hdl=p->add_char.attr_handle; _ble_plugin_instance->_setTxHandle(_tx_hdl);
            esp_bt_uuid_t u={}; u.len=ESP_UUID_LEN_16; u.uuid.uuid16=ESP_GATT_UUID_CHAR_CLIENT_CONFIG;
            esp_ble_gatts_add_char_descr(_svc_hdl,&u,ESP_GATT_PERM_READ|ESP_GATT_PERM_WRITE,nullptr,nullptr);
        }
        break;
    case ESP_GATTS_ADD_CHAR_DESCR_EVT:
        _cccd_hdl=p->add_char_descr.attr_handle;
        Serial.println("[BLE] GATT ready -> config adv..."); _ble_plugin_instance->_configureAdv();
        break;
    case ESP_GATTS_CONNECT_EVT:
        _ble_plugin_instance->_setConnId(p->connect.conn_id); _ble_plugin_instance->_onConnect(); break;
    case ESP_GATTS_DISCONNECT_EVT:
        _notify_en=false; _ble_plugin_instance->_onDisconnect(); break;
    case ESP_GATTS_WRITE_EVT:
        if(p->write.handle==_cccd_hdl&&p->write.len==2) _notify_en=(p->write.value[0]==0x01);
        else if(p->write.handle==_rx_hdl) _ble_plugin_instance->_onWrite(p->write.value,p->write.len);
        if(p->write.need_rsp) esp_ble_gatts_send_response(gif,p->write.conn_id,p->write.trans_id,ESP_GATT_OK,nullptr);
        break;
    default: break;
    }
}

BLE_Plugin::BLE_Plugin()
    : _gatts_if(ESP_GATT_IF_NONE),_conn_id(0),_tx_handle(0),_connected(false) {
    _ble_plugin_instance=this;
}

bool BLE_Plugin::begin(const char* deviceName) {
    _devName=deviceName;
    Serial.println("[BLE] Starting...");
    delay(500);

    // ★ วิธีที่ถูกต้อง: ใช้ btStop() ปิด BT stack เดิม
    // btStop() จัดการ state ทั้งหมดถูกต้องเสมอ
    Serial.println("[BLE] btStop...");
    btStop();
    delay(200);
    Serial.printf("[BLE] after btStop: ctrl=%d bd=%d\n",
        esp_bt_controller_get_status(), esp_bluedroid_get_status());

    // WiFi OFF
    WiFi.disconnect(true);
    WiFi.mode(WIFI_OFF);
    delay(200);
    Serial.println("[BLE] WiFi OFF");

    // release Classic BT memory
    esp_bt_controller_mem_release(ESP_BT_MODE_CLASSIC_BT);

    // ★ init BT stack ใหม่ผ่าน btStart() ก่อน
    // แล้วค่อย register callbacks ทับ
    Serial.println("[BLE] btStart...");
    if(!btStart()) {
        Serial.println("[BLE] btStart FAILED!");
        return false;
    }
    Serial.printf("[BLE] after btStart: ctrl=%d\n", esp_bt_controller_get_status());
    delay(100);

    // init bluedroid
    esp_err_t ret = esp_bluedroid_init();
    Serial.printf("[BLE] bd_init: %s\n", esp_err_to_name(ret));
    if(ret!=ESP_OK && ret!=ESP_ERR_INVALID_STATE) return false;

    ret = esp_bluedroid_enable();
    Serial.printf("[BLE] bd_enable: %s\n", esp_err_to_name(ret));
    if(ret!=ESP_OK && ret!=ESP_ERR_INVALID_STATE) return false;

    // poll จน ENABLED
    for(int i=0;i<100;i++){
        if(esp_bluedroid_get_status()==ESP_BLUEDROID_STATUS_ENABLED) break;
        vTaskDelay(pdMS_TO_TICKS(50));
    }
    Serial.printf("[BLE] bd_status: %d\n", esp_bluedroid_get_status());
    if(esp_bluedroid_get_status()!=ESP_BLUEDROID_STATUS_ENABLED){
        Serial.println("[BLE] Bluedroid FAILED"); return false;
    }
    Serial.println("[BLE] Bluedroid ENABLED!");

    esp_ble_gatt_set_local_mtu(BLE_MTU);
    esp_ble_gap_set_device_name(_devName);
    esp_ble_gap_register_callback(gap_cb);
    esp_ble_gatts_register_callback(gatts_cb);
    delay(200);

    ret = esp_ble_gatts_app_register(GATTS_APP_ID);
    Serial.printf("[BLE] app_register: %s\n", esp_err_to_name(ret));
    return (ret==ESP_OK);
}

void BLE_Plugin::_configureAdv() {
    _adv_data_set=false; _scan_rsp_data_set=false;
    esp_ble_adv_data_t adv={}; adv.set_scan_rsp=false; adv.include_name=true;
    adv.flag=ESP_BLE_ADV_FLAG_GEN_DISC|ESP_BLE_ADV_FLAG_BREDR_NOT_SPT;
    esp_ble_gap_config_adv_data(&adv);
    esp_ble_adv_data_t rsp={}; rsp.set_scan_rsp=true; rsp.include_txpower=true;
    rsp.service_uuid_len=16; rsp.p_service_uuid=NUS_SVC_UUID;
    esp_ble_gap_config_adv_data(&rsp);
}
void BLE_Plugin::_startAdvertisingNow() {
    esp_ble_adv_params_t par={}; par.adv_int_min=0x20; par.adv_int_max=0x40;
    par.adv_type=ADV_TYPE_IND; par.own_addr_type=BLE_ADDR_TYPE_PUBLIC;
    par.channel_map=ADV_CHNL_ALL; par.adv_filter_policy=ADV_FILTER_ALLOW_SCAN_ANY_CON_ANY;
    esp_ble_gap_start_advertising(&par);
}
void BLE_Plugin::_startAdvertising() { Serial.println("[BLE] Restart adv..."); _configureAdv(); }
void BLE_Plugin::_onConnect()    { _connected=true;  Serial.println("[BLE] Connected!"); }
void BLE_Plugin::_onDisconnect() { _connected=false; Serial.println("[BLE] Disconnected"); delay(200); _startAdvertising(); }
void BLE_Plugin::_onWrite(uint8_t* d, uint16_t len) { for(uint16_t i=0;i<len;i++) _rxBuffer+=(char)d[i]; }
void BLE_Plugin::_setGattsIf(esp_gatt_if_t g){ _gatts_if=g; }
void BLE_Plugin::_setConnId(uint16_t c)       { _conn_id=c; }
void BLE_Plugin::_setTxHandle(uint16_t h)     { _tx_handle=h; }
bool BLE_Plugin::isConnected()                { return _connected; }

void BLE_Plugin::send(const String& msg) {
    if(!_connected||!_notify_en||_gatts_if==ESP_GATT_IF_NONE) return;
    uint16_t total=msg.length(),offset=0;
    while(offset<total){
        uint16_t chunk=min((uint16_t)(total-offset),(uint16_t)BLE_MTU);
        esp_ble_gatts_send_indicate(_gatts_if,_conn_id,_tx_handle,chunk,(uint8_t*)(msg.c_str()+offset),false);
        offset+=chunk; delay(10);
    }
}
void BLE_Plugin::sendLine(const String& msg)       { send(msg+"\n"); }
void BLE_Plugin::sendInt(int val)                  { send(String(val)); }
void BLE_Plugin::sendFloat(float val, uint8_t dec) {
    // arduino-esp32 3.x removed String(float, ...); format via dtostrf instead.
    char buf[20];
    dtostrf(val, 0, dec, buf);
    send(String(buf));
}
bool   BLE_Plugin::available() { return _rxBuffer.length()>0; }
char   BLE_Plugin::readChar()  {
    if(!_rxBuffer.length()) return '\0';
    char c=_rxBuffer.charAt(0); _rxBuffer.remove(0,1); return c;
}
String BLE_Plugin::_readLineInternal() {
    int idx=_rxBuffer.indexOf('\n'); String r;
    if(idx>=0){ r=_rxBuffer.substring(0,idx); _rxBuffer.remove(0,idx+1); }
    else      { r=_rxBuffer; _rxBuffer=""; }
    r.trim(); return r;
}
String BLE_Plugin::readString() { return _readLineInternal(); }
int    BLE_Plugin::readInt()    { return _readLineInternal().toInt(); }
float  BLE_Plugin::readFloat()  { return _readLineInternal().toFloat(); }
