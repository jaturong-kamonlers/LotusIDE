#ifndef MLX90614_PLUGIN_H
#define MLX90614_PLUGIN_H

#include <Arduino.h>
#include <Wire.h>

#define MLX90614_ADDR_DEFAULT  0x5A

// RAM Registers
#define MLX90614_REG_TA        0x06   // Ambient temperature
#define MLX90614_REG_TOBJ1     0x07   // Object temperature 1

class MLX90614_Plugin {
private:
    uint8_t  _address;
    float    _obj_temp;
    float    _amb_temp;
    bool     _found;
    unsigned long _last_update;
    bool     _updated;

    uint16_t readRaw(uint8_t reg);
    float    rawToTemp(uint16_t raw);

public:
    MLX90614_Plugin(uint8_t address = MLX90614_ADDR_DEFAULT);

    bool  begin();
    bool  isConnected();

    void  update(uint16_t interval_ms = 100);
    bool  isUpdated();

    float getObjectTemp()  { return _obj_temp; }
    float getAmbientTemp() { return _amb_temp; }
};

#endif
