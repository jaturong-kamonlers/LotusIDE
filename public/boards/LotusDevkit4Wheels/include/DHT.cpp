/**
 * DHT.cpp - DHT Sensor implementation for LotusDevkit ESP32
 * Compatible with old ESP32 Arduino core (KBIDE_Lotus)
 * Uses direct micros() timing - no microsecondsToClockCycles needed
 */
#include "DHT.h"

#define MIN_INTERVAL  2000UL   // minimum ms between reads
#define MAX_WAIT_US   1000UL   // max microseconds to wait for pulse

DHT::DHT(uint8_t pin, uint8_t type, uint8_t count) {
  _pin         = pin;
  _type        = type;
  _lastresult  = false;
  _lastreadtime = 0;
  memset(data, 0, sizeof(data));
}

void DHT::begin(uint8_t usec) {
  pinMode(_pin, INPUT_PULLUP);
  _lastreadtime = millis() - MIN_INTERVAL;
}

float DHT::convertCtoF(float c) { return c * 1.8f + 32.0f; }
float DHT::convertFtoC(float f) { return (f - 32.0f) / 1.8f; }

float DHT::readTemperature(bool S, bool force) {
  float f = NAN;
  if (!read(force)) return f;

  switch (_type) {
    case DHT11:
      f = (float)data[2];
      if (data[3] & 0x80) f = -1.0f - f;
      f += (float)(data[3] & 0x0f) * 0.1f;
      break;
    case DHT22:
    case DHT21:
      f = (float)(((uint16_t)(data[2] & 0x7F) << 8) | data[3]) * 0.1f;
      if (data[2] & 0x80) f = -f;
      break;
    default:
      return f;
  }
  return S ? convertCtoF(f) : f;
}

float DHT::readHumidity(bool force) {
  float f = NAN;
  if (!read(force)) return f;

  switch (_type) {
    case DHT11:
      f = (float)data[0] + (float)data[1] * 0.1f;
      break;
    case DHT22:
    case DHT21:
      f = (float)(((uint16_t)data[0] << 8) | data[1]) * 0.1f;
      break;
  }
  return f;
}

float DHT::computeHeatIndex(float temperature, float percentHumidity, bool isFahrenheit) {
  if (!isFahrenheit) temperature = convertCtoF(temperature);
  float hi = 0.5f * (temperature + 61.0f +
             ((temperature - 68.0f) * 1.2f) +
             (percentHumidity * 0.094f));
  if (!isFahrenheit) hi = convertFtoC(hi);
  return hi;
}

// ── อ่านข้อมูลจาก DHT ด้วย micros() timing ──────────────────────────
bool DHT::read(bool force) {
  uint32_t now = millis();
  if (!force && (now - _lastreadtime) < MIN_INTERVAL) {
    return _lastresult;
  }
  _lastreadtime = now;
  memset(data, 0, sizeof(data));

  // ── START: ดึง line ลง > 18ms (DHT22) หรือ > 20ms (DHT11)
  pinMode(_pin, OUTPUT);
  digitalWrite(_pin, LOW);
  switch (_type) {
    case DHT22:
    case DHT21:
      delayMicroseconds(1100);
      break;
    default: // DHT11
      delay(20);
      break;
  }
  // ปล่อยให้ DHT response
  digitalWrite(_pin, HIGH);
  delayMicroseconds(40);
  pinMode(_pin, INPUT_PULLUP);
  delayMicroseconds(10);

  // ── รอ DHT ดึง line ลง (response low ~80µs)
  uint32_t t = micros();
  while (digitalRead(_pin) == LOW) {
    if ((micros() - t) > 200) { _lastresult = false; return false; }
  }
  // ── รอ DHT ปล่อย line ขึ้น (response high ~80µs)
  t = micros();
  while (digitalRead(_pin) == HIGH) {
    if ((micros() - t) > 200) { _lastresult = false; return false; }
  }

  // ── อ่าน 40 bits
  for (uint8_t i = 0; i < 40; i++) {
    // รอ low pulse เริ่ม bit (~50µs)
    t = micros();
    while (digitalRead(_pin) == LOW) {
      if ((micros() - t) > 100) { _lastresult = false; return false; }
    }
    // วัดความยาว high pulse: > 40µs = '1', <= 40µs = '0'
    uint32_t high_start = micros();
    while (digitalRead(_pin) == HIGH) {
      if ((micros() - high_start) > 100) { _lastresult = false; return false; }
    }
    uint32_t high_dur = micros() - high_start;
    data[i / 8] <<= 1;
    if (high_dur > 40) data[i / 8] |= 1;
  }

  // ── ตรวจ checksum
  uint8_t sum = data[0] + data[1] + data[2] + data[3];
  if (data[4] != (sum & 0xFF)) {
    _lastresult = false;
    return false;
  }
  _lastresult = true;
  return true;
}
