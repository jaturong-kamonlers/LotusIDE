#ifndef RTCLIB_H
#define RTCLIB_H

#include <Arduino.h>
#include <Wire.h>

// ── DateTime class ────────────────────────────────────────────────────────
class DateTime {
public:
    DateTime(uint16_t y=2025, uint8_t mo=1, uint8_t d=1,
             uint8_t h=0,    uint8_t mi=0,  uint8_t s=0)
        : _year(y), _month(mo), _day(d),
          _hour(h),  _minute(mi), _second(s) {}

    uint16_t year()      const { return _year;   }
    uint8_t  month()     const { return _month;  }
    uint8_t  day()       const { return _day;    }
    uint8_t  hour()      const { return _hour;   }
    uint8_t  minute()    const { return _minute; }
    uint8_t  second()    const { return _second; }
    uint8_t  dayOfWeek() const {
        // Zeller's congruence
        uint16_t y = _year; uint8_t m = _month, d = _day;
        if(m < 3){ m+=12; y--; }
        int k=y%100, j=y/100;
        int h2=(d+(13*(m+1))/5+k+k/4+j/4+5*j)%7;
        return ((h2+5)%7); // 0=Sun
    }
    uint32_t unixtime() const {
        // approximate unix timestamp
        uint32_t t = 0;
        uint16_t y = _year;
        for(uint16_t i=1970; i<y; i++) t += (i%4==0&&(i%100!=0||i%400==0))?366:365;
        static const uint8_t dom[] = {31,28,31,30,31,30,31,31,30,31,30,31};
        for(uint8_t i=0; i<_month-1; i++){
            t += dom[i];
            if(i==1 && (y%4==0&&(y%100!=0||y%400==0))) t++;
        }
        t += _day-1;
        return (t*86400UL) + _hour*3600UL + _minute*60UL + _second;
    }

private:
    uint16_t _year;
    uint8_t  _month, _day, _hour, _minute, _second;
};

// ── Helper ────────────────────────────────────────────────────────────────
static uint8_t bcd2bin(uint8_t v) { return v - 6*(v>>4); }
static uint8_t bin2bcd(uint8_t v) { return v + 6*(v/10);  }

// ── RTC_DS1307 ────────────────────────────────────────────────────────────
class RTC_DS1307 {
public:
    bool begin(TwoWire &wire = Wire) {
        _wire = &wire;
        _wire->beginTransmission(0x68);
        return (_wire->endTransmission() == 0);
    }

    DateTime now() {
        _wire->beginTransmission(0x68);
        _wire->write(0x00);
        _wire->endTransmission(false);
        _wire->requestFrom(0x68, 7);
        uint8_t s  = bcd2bin(_wire->read() & 0x7F);
        uint8_t mi = bcd2bin(_wire->read());
        uint8_t h  = bcd2bin(_wire->read() & 0x3F);
        _wire->read(); // day of week
        uint8_t d  = bcd2bin(_wire->read());
        uint8_t mo = bcd2bin(_wire->read());
        uint16_t y = bcd2bin(_wire->read()) + 2000;
        return DateTime(y, mo, d, h, mi, s);
    }

    void adjust(const DateTime &dt) {
        _wire->beginTransmission(0x68);
        _wire->write(0x00);
        _wire->write(bin2bcd(dt.second()));
        _wire->write(bin2bcd(dt.minute()));
        _wire->write(bin2bcd(dt.hour()));
        _wire->write(bin2bcd(dt.dayOfWeek()));
        _wire->write(bin2bcd(dt.day()));
        _wire->write(bin2bcd(dt.month()));
        _wire->write(bin2bcd(dt.year()-2000));
        _wire->endTransmission();
    }

    bool isrunning() {
        _wire->beginTransmission(0x68);
        _wire->write(0x00);
        _wire->endTransmission(false);
        _wire->requestFrom(0x68, 1);
        return !(_wire->read() >> 7);
    }

private:
    TwoWire* _wire = &Wire;
};

// ── RTC_DS3231 ────────────────────────────────────────────────────────────
class RTC_DS3231 {
public:
    bool begin(TwoWire &wire = Wire) {
        _wire = &wire;
        _wire->beginTransmission(0x68);
        return (_wire->endTransmission() == 0);
    }

    DateTime now() {
        _wire->beginTransmission(0x68);
        _wire->write(0x00);
        _wire->endTransmission(false);
        _wire->requestFrom(0x68, 7);
        uint8_t s  = bcd2bin(_wire->read() & 0x7F);
        uint8_t mi = bcd2bin(_wire->read());
        uint8_t h  = bcd2bin(_wire->read() & 0x3F);
        _wire->read(); // day of week
        uint8_t d  = bcd2bin(_wire->read());
        uint8_t mo = bcd2bin(_wire->read() & 0x1F);
        uint16_t y = bcd2bin(_wire->read()) + 2000;
        return DateTime(y, mo, d, h, mi, s);
    }

    void adjust(const DateTime &dt) {
        _wire->beginTransmission(0x68);
        _wire->write(0x00);
        _wire->write(bin2bcd(dt.second()));
        _wire->write(bin2bcd(dt.minute()));
        _wire->write(bin2bcd(dt.hour()));
        _wire->write(bin2bcd(dt.dayOfWeek()));
        _wire->write(bin2bcd(dt.day()));
        _wire->write(bin2bcd(dt.month()));
        _wire->write(bin2bcd(dt.year()-2000));
        _wire->endTransmission();
    }

    float getTemperature() {
        _wire->beginTransmission(0x68);
        _wire->write(0x11);
        _wire->endTransmission(false);
        _wire->requestFrom(0x68, 2);
        int8_t msb = _wire->read();
        uint8_t lsb = _wire->read();
        return msb + (lsb >> 6) * 0.25f;
    }

    bool lostPower() {
        _wire->beginTransmission(0x68);
        _wire->write(0x0F);
        _wire->endTransmission(false);
        _wire->requestFrom(0x68, 1);
        return (_wire->read() >> 7) & 0x01;
    }

private:
    TwoWire* _wire = &Wire;
};

#endif // RTCLIB_H
