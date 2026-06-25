#ifndef ADAFRUIT_SHT31_H
#define ADAFRUIT_SHT31_H

#include <Arduino.h>
#include <Wire.h>

#define SHT31_DEFAULT_ADDR 0x44
#define SHT31_MEAS_HIGHREP 0x2C06
#define SHT31_SOFTRESET    0x30A2

// Minimal Adafruit_SHT31 stub for Lotus IDE board headers. Supports the
// subset of the API the LotusDevkit / LotusDevkit4Wheels Blockly blocks
// actually emit: begin(addr), readTemperature(), readHumidity(). Returns
// -999.0f sentinel on failure (matches the Adafruit_MLX90614 stub).
//
// Skipped vs upstream: CRC validation, status register, heater control,
// alert mode, serial number readback. Add back if a future block needs them.
class Adafruit_SHT31 {
public:
    Adafruit_SHT31() : _wire(&Wire), _addr(SHT31_DEFAULT_ADDR), _working(false) {}

    bool begin(uint8_t addr = SHT31_DEFAULT_ADDR, TwoWire &wirePort = Wire) {
        _addr  = addr;
        _wire  = &wirePort;
        // Soft reset and probe — if sensor ACKs, mark working
        if (!_writeCmd(SHT31_SOFTRESET)) { _working = false; return false; }
        delay(2);  // datasheet: soft reset takes <1.5ms
        // Probe with a measurement to confirm sensor really responds
        float t = _readMeasurement(true);
        _working = (t > -100.0f);
        return _working;
    }

    float readTemperature() {
        if (!_working) return -999.0f;
        return _readMeasurement(true);
    }

    float readHumidity() {
        if (!_working) return -999.0f;
        return _readMeasurement(false);
    }

    bool isWorking() { return _working; }

private:
    TwoWire* _wire;
    uint8_t  _addr;
    bool     _working;

    bool _writeCmd(uint16_t cmd) {
        _wire->beginTransmission(_addr);
        _wire->write((uint8_t)(cmd >> 8));
        _wire->write((uint8_t)(cmd & 0xFF));
        return _wire->endTransmission() == 0;
    }

    // Issue a high-repeatability measurement, read 6 bytes (T_msb, T_lsb,
    // T_crc, RH_msb, RH_lsb, RH_crc), and return either T (returnTemp=true)
    // or RH. -999.0f on any I2C failure. CRC bytes are read and discarded.
    float _readMeasurement(bool returnTemp) {
        if (!_writeCmd(SHT31_MEAS_HIGHREP)) return -999.0f;
        delay(16);  // high-repeatability conversion: max 15.5ms per datasheet

        if (_wire->requestFrom(_addr, (uint8_t)6) < 6) return -999.0f;
        uint16_t rawT = ((uint16_t)_wire->read() << 8) | _wire->read();
        _wire->read();  // T CRC — skipped
        uint16_t rawH = ((uint16_t)_wire->read() << 8) | _wire->read();
        _wire->read();  // H CRC — skipped

        if (returnTemp) {
            float t = -45.0f + 175.0f * ((float)rawT / 65535.0f);
            return (t < -40 || t > 125) ? -999.0f : t;
        } else {
            float h = 100.0f * ((float)rawH / 65535.0f);
            return (h < 0 || h > 100) ? -999.0f : h;
        }
    }
};

#endif
