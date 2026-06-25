#ifndef ADAFRUIT_MLX90614_H
#define ADAFRUIT_MLX90614_H

#include <Arduino.h>
#include <Wire.h>

#define MLX90614_I2CADDR  0x5A
#define MLX90614_TA       0x06
#define MLX90614_TOBJ1    0x07

class Adafruit_MLX90614 {
public:
    Adafruit_MLX90614(uint8_t addr = MLX90614_I2CADDR)
        : _addr(addr), _wire(&Wire), _working(false) {}

    bool begin(TwoWire &wirePort = Wire) {
        _wire = &wirePort;
        
        // เพิ่ม timeout ป้องกันการค้าง
        unsigned long startTime = millis();
        
        for (int i = 0; i < 3; i++) {
            // เช็ค timeout ทุกครั้ง
            if (millis() - startTime > 500) {  // timeout 500ms
                Serial.println("MLX90614 begin timeout!");
                _working = false;
                return false;
            }
            
            uint16_t val = read16(MLX90614_TA);
            if (val != 0xFFFF && val != 0 && val < 20000) {
                Serial.printf("MLX90614 found at 0x%02X\n", _addr);
                _working = true;
                return true;
            }
            delay(10);
        }
        
        Serial.println("MLX90614 not found - continuing without sensor");
        _working = false;
        return false;  // return false แต่ไม่ค้าง
    }

    float readAmbientTempC() { 
        if (!_working) return -999.0f;
        
        unsigned long startTime = millis();
        uint16_t raw = read16WithTimeout(MLX90614_TA, 100);  // timeout 100ms
        if (raw == 0xFFFF || raw == 0) return -999.0f;
        
        float temp = (float)raw * 0.02f - 273.15f;
        return (temp < -40 || temp > 125) ? -999.0f : temp;
    }
    
    float readObjectTempC() { 
        if (!_working) return -999.0f;
        
        unsigned long startTime = millis();
        uint16_t raw = read16WithTimeout(MLX90614_TOBJ1, 100);  // timeout 100ms
        if (raw == 0xFFFF || raw == 0) return -999.0f;
        
        float temp = (float)raw * 0.02f - 273.15f;
        return (temp < -70 || temp > 380) ? -999.0f : temp;
    }
    
    // Fahrenheit variants — convert °C and propagate the -999 sentinel so
    // legacy mlx90614_read_object_f / _ambient_f blocks compile and stay
    // consistent with the Celsius versions on read failure.
    float readObjectTempF()  {
        float c = readObjectTempC();
        return (c == -999.0f) ? -999.0f : (c * 1.8f + 32.0f);
    }
    float readAmbientTempF() {
        float c = readAmbientTempC();
        return (c == -999.0f) ? -999.0f : (c * 1.8f + 32.0f);
    }

    bool isWorking() { return _working; }

private:
    uint8_t  _addr;
    TwoWire* _wire;
    bool _working;

    uint16_t read16WithTimeout(uint8_t reg, unsigned long timeout) {
        unsigned long startTime = millis();
        
        _wire->beginTransmission(_addr);
        _wire->write(reg);
        if (_wire->endTransmission(false) != 0) return 0xFFFF;
        
        while (millis() - startTime < timeout) {
            if (_wire->requestFrom(_addr, (uint8_t)3) >= 3) {
                uint16_t lo = _wire->read();
                uint16_t hi = _wire->read();
                _wire->read(); // PEC
                return (hi << 8) | lo;
            }
            delay(1);
        }
        return 0xFFFF;
    }

    uint16_t read16(uint8_t reg) {
        return read16WithTimeout(reg, 50);
    }
};

#endif