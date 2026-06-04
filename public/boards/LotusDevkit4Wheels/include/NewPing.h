#ifndef NEWPING_H
#define NEWPING_H

#include <Arduino.h>

#define MAX_SENSOR_DISTANCE 500  // cm
#define US_ROUNDTRIP_CM     57   // microseconds per cm (round-trip)
#define US_ROUNDTRIP_IN     146  // microseconds per inch (round-trip)

class NewPing {
public:
    NewPing(uint8_t trigPin, uint8_t echoPin, uint16_t maxDist=MAX_SENSOR_DISTANCE)
        : _trig(trigPin), _echo(echoPin), _maxDist(maxDist) {
        pinMode(_trig, OUTPUT);
        pinMode(_echo, INPUT);
        digitalWrite(_trig, LOW);
    }

    // ส่ง ping กลับ duration (microseconds) — 0 = timeout
    uint32_t ping() {
        digitalWrite(_trig, LOW);
        delayMicroseconds(2);
        digitalWrite(_trig, HIGH);
        delayMicroseconds(10);
        digitalWrite(_trig, LOW);
        uint32_t maxUs = _maxDist * US_ROUNDTRIP_CM * 2UL;
        return pulseIn(_echo, HIGH, maxUs);
    }

    float ping_cm()   { uint32_t t=ping(); return t ? t/US_ROUNDTRIP_CM : 0; }
    float ping_in()   { uint32_t t=ping(); return t ? t/US_ROUNDTRIP_IN : 0; }
    uint32_t ping_median(uint8_t it=5) {
        uint32_t uS[it]; uint8_t cnt=0;
        for(uint8_t i=0; i<it; i++){
            delay(30);
            uint32_t v=ping();
            if(v>0) uS[cnt++]=v;
        }
        if(!cnt) return 0;
        // sort
        for(uint8_t i=0; i<cnt-1; i++)
            for(uint8_t j=i+1; j<cnt; j++)
                if(uS[i]>uS[j]){ uint32_t tmp=uS[i]; uS[i]=uS[j]; uS[j]=tmp; }
        return uS[cnt/2];
    }

private:
    uint8_t  _trig, _echo;
    uint16_t _maxDist;
};

#endif // NEWPING_H
