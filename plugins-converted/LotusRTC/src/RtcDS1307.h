#ifndef __RTCDS1307_H__
#define __RTCDS1307_H__

#include <Arduino.h>
#include <Wire.h>
#include "RtcDateTime.h"
#include "RtcUtility.h"

#define DS1307_ADDRESS 0x68

// Square Wave Pin Modes
enum DS1307SquareWaveOut {
    DS1307SquareWaveOut_Low = 0x00,
    DS1307SquareWaveOut_High = 0x80,
    DS1307SquareWaveOut_1Hz = 0x10,
    DS1307SquareWaveOut_4kHz = 0x11,
    DS1307SquareWaveOut_8kHz = 0x12,
    DS1307SquareWaveOut_32kHz = 0x13
};

template<class T_WIRE_METHOD> class RtcDS1307 {
public:
    RtcDS1307(T_WIRE_METHOD& wire) : _wire(wire), _lastError(0) {}

    void Begin() {
        _wire.begin();
    }

    bool IsDateTimeValid() {
        return true;
    }

    bool GetIsRunning() {
        uint8_t creg = getReg(0x00);
        return !(creg & 0x80);
    }

    void SetIsRunning(bool isRunning) {
        uint8_t creg = getReg(0x00);
        if (isRunning) {
            creg &= ~0x80;
        } else {
            creg |= 0x80;
        }
        setReg(0x00, creg);
    }

    RtcDateTime GetDateTime() {
        _wire.beginTransmission(DS1307_ADDRESS);
        _wire.write(0);
        _lastError = _wire.endTransmission();
        if (_lastError != 0) {
            return RtcDateTime(2000, 1, 1, 0, 0, 0);
        }

        _wire.requestFrom((uint8_t)DS1307_ADDRESS, (uint8_t)7);
        
        uint8_t second = BcdToUint8(_wire.read() & 0x7F);
        uint8_t minute = BcdToUint8(_wire.read());
        uint8_t hour = BcdToBin24Hour(_wire.read());
        _wire.read(); // skip day of week
        uint8_t day = BcdToUint8(_wire.read());
        uint8_t month = BcdToUint8(_wire.read());
        uint16_t year = BcdToUint8(_wire.read()) + 2000;

        return RtcDateTime(year, month, day, hour, minute, second);
    }

    void SetDateTime(const RtcDateTime& dt) {
        _wire.beginTransmission(DS1307_ADDRESS);
        _wire.write(0);
        
        _wire.write(Uint8ToBcd(dt.Second()));
        _wire.write(Uint8ToBcd(dt.Minute()));
        _wire.write(Uint8ToBcd(dt.Hour()));
        _wire.write(Uint8ToBcd(0)); // day of week
        _wire.write(Uint8ToBcd(dt.Day()));
        _wire.write(Uint8ToBcd(dt.Month()));
        _wire.write(Uint8ToBcd(dt.Year() - 2000));
        
        _lastError = _wire.endTransmission();
    }

    void SetSquareWavePin(DS1307SquareWaveOut mode) {
        setReg(0x07, mode);
    }

    uint8_t LastError() {
        return _lastError;
    }

private:
    T_WIRE_METHOD& _wire;
    uint8_t _lastError;

    uint8_t getReg(uint8_t regAddress) {
        _wire.beginTransmission(DS1307_ADDRESS);
        _wire.write(regAddress);
        _lastError = _wire.endTransmission();
        if (_lastError != 0) return 0;

        _wire.requestFrom((uint8_t)DS1307_ADDRESS, (uint8_t)1);
        return _wire.read();
    }

    void setReg(uint8_t regAddress, uint8_t regValue) {
        _wire.beginTransmission(DS1307_ADDRESS);
        _wire.write(regAddress);
        _wire.write(regValue);
        _lastError = _wire.endTransmission();
    }
};

#endif