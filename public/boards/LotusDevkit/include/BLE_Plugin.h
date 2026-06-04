#ifndef BLE_PLUGIN_H
#define BLE_PLUGIN_H

#if !defined(ESP32)
  #error "BLE_Plugin supports ESP32 only"
#endif

#include <Arduino.h>
#include "esp_bt.h"
#include "esp_gap_ble_api.h"
#include "esp_gatts_api.h"
#include "esp_bt_main.h"
#include "esp_bt_defs.h"
#include "esp_gatt_common_api.h"
#include "esp_wifi.h"

class BLE_Plugin {
public:
    BLE_Plugin();
    bool    begin(const char* deviceName = "LotusDevkit");
    void    send(const String& msg);
    void    sendLine(const String& msg);
    void    sendInt(int val);
    void    sendFloat(float val, uint8_t dec = 2);
    bool    available();
    char    readChar();
    String  readString();
    int     readInt();
    float   readFloat();
    bool    isConnected();

    // internal — เรียกจาก ESP-IDF callback
    void    _onConnect();
    void    _onDisconnect();
    void    _onWrite(uint8_t* data, uint16_t len);
    void    _setGattsIf(esp_gatt_if_t gatts_if);
    void    _setConnId(uint16_t conn_id);
    void    _setTxHandle(uint16_t handle);
    void    _configureAdv();
    void    _startAdvertising();
    void    _startAdvertisingNow();

public:
    const char*    _devName;  // public for FreeRTOS task access
private:
    esp_gatt_if_t  _gatts_if;
    uint16_t       _conn_id;
    uint16_t       _tx_handle;
    volatile bool  _connected;
    String         _rxBuffer;
    String         _readLineInternal();
};

extern BLE_Plugin* _ble_plugin_instance;
#endif
