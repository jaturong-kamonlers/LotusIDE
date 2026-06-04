/**
 * DHT.h - DHT Sensor Library for LotusDevkit / ESP32
 * Compatible with DHT11, DHT22, DHT21
 * Uses micros() timing — compatible with old ESP32 Arduino core
 */
#ifndef DHT_H
#define DHT_H

#include <Arduino.h>
#include <string.h>

// Sensor type constants
#define DHT11  11
#define DHT22  22
#define DHT21  21
#define AM2301 21

class DHT {
public:
  DHT(uint8_t pin, uint8_t type, uint8_t count = 6);
  void  begin(uint8_t usec = 55);
  float readTemperature(bool S = false, bool force = false);
  float readHumidity(bool force = false);
  bool  read(bool force = false);
  float convertCtoF(float c);
  float convertFtoC(float f);
  float computeHeatIndex(float temperature, float percentHumidity,
                          bool isFahrenheit = true);

private:
  uint8_t  _pin;
  uint8_t  _type;
  uint32_t _lastreadtime;
  bool     _lastresult;
  uint8_t  data[5];
};

#endif // DHT_H
