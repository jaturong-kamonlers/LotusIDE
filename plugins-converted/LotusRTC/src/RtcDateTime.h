#ifndef __RTCDATETIME_H__
#define __RTCDATETIME_H__

#include <Arduino.h>

class RtcDateTime {
public:
    // Constructor ปกติ
    RtcDateTime(uint16_t year = 2000, uint8_t month = 1, uint8_t day = 1, 
                uint8_t hour = 0, uint8_t minute = 0, uint8_t second = 0) :
        _year(year >= 2000 ? year - 2000 : year), 
        _month(month), _day(day), _hour(hour), _min(minute), _sec(second) {}

    // Constructor จาก __DATE__ และ __TIME__
    RtcDateTime(const char* date, const char* time) {
        _year = atoi(date + 9) - 2000;
        _month = MonthToUint8(date);
        _day = atoi(date + 4);
        _hour = atoi(time);
        _min = atoi(time + 3);
        _sec = atoi(time + 6);
    }

    uint16_t Year() const { return _year + 2000; }
    uint8_t Month() const { return _month; }
    uint8_t Day() const { return _day; }
    uint8_t Hour() const { return _hour; }
    uint8_t Minute() const { return _min; }
    uint8_t Second() const { return _sec; }

    bool operator==(const RtcDateTime& other) const {
        return (_year == other._year && _month == other._month && _day == other._day &&
                _hour == other._hour && _min == other._min && _sec == other._sec);
    }
    
    bool operator<(const RtcDateTime& other) const {
        if (_year != other._year) return _year < other._year;
        if (_month != other._month) return _month < other._month;
        if (_day != other._day) return _day < other._day;
        if (_hour != other._hour) return _hour < other._hour;
        if (_min != other._min) return _min < other._min;
        return _sec < other._sec;
    }

    bool operator>(const RtcDateTime& other) const { return other < *this; }
    bool operator!=(const RtcDateTime& other) const { return !(*this == other); }

    static uint8_t ConvertDowToRtc(uint8_t dow) { return (dow == 0) ? 7 : dow; }

private:
    uint8_t _year, _month, _day, _hour, _min, _sec;
    
    // Helper function แปลงชื่อเดือน
    static uint8_t MonthToUint8(const char* month) {
        if (month[0] == 'J') {
            if (month[1] == 'a') return 1;  // Jan
            if (month[2] == 'n') return 6;  // Jun
            return 7;  // Jul
        }
        if (month[0] == 'F') return 2;  // Feb
        if (month[0] == 'M') {
            if (month[2] == 'r') return 3;  // Mar
            return 5;  // May
        }
        if (month[0] == 'A') {
            if (month[1] == 'p') return 4;  // Apr
            return 8;  // Aug
        }
        if (month[0] == 'S') return 9;   // Sep
        if (month[0] == 'O') return 10;  // Oct
        if (month[0] == 'N') return 11;  // Nov
        if (month[0] == 'D') return 12;  // Dec
        return 1;
    }
};

#endif