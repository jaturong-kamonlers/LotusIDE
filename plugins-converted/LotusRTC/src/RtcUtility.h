#ifndef __RTCUTILITY_H__
#define __RTCUTILITY_H__

#include <Arduino.h>

// ฟังก์ชัน inline ไม่ต้องมี .cpp
static inline uint8_t BcdToUint8(uint8_t val) {
    return val - 6 * (val >> 4);
}

static inline uint8_t Uint8ToBcd(uint8_t val) {
    return val + 6 * (val / 10);
}

static inline uint8_t BcdToBin24Hour(uint8_t bcdHour) {
    uint8_t hour;
    if (bcdHour & 0x40) {
        bool isPm = ((bcdHour & 0x20) != 0);
        hour = BcdToUint8(bcdHour & 0x1f);
        if (isPm) hour += 12;
    } else {
        hour = BcdToUint8(bcdHour);
    }
    return hour;
}

#endif