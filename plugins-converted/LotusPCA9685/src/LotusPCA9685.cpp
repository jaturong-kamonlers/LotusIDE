#include "LotusPCA9685.h"

LotusPCA9685::LotusPCA9685() {
    _addr = PCA9685_DEFAULT_ADDR;
    _freq = 50.0f;
    _wire = &Wire;
    for (uint8_t i = 0; i < PCA9685_MAX_CHANNELS; i++) {
        _calMin[i] = 544;
        _calMax[i] = 2400;
    }
}

void LotusPCA9685::writeReg(uint8_t reg, uint8_t val) {
    _wire->beginTransmission(_addr);
    _wire->write(reg);
    _wire->write(val);
    _wire->endTransmission(true);
}

uint8_t LotusPCA9685::readReg(uint8_t reg) {
    _wire->beginTransmission(_addr);
    _wire->write(reg);
    _wire->endTransmission(true);  // stop bit ป้องกัน AVR bus hang
    _wire->requestFrom((uint8_t)_addr, (uint8_t)1);
    return _wire->available() ? _wire->read() : 0;
}

void LotusPCA9685::begin(uint8_t addr, float freq, TwoWire& wire) {
    _addr = addr;
    _wire = &wire;
    _wire->begin();
    delay(10);
    // Wake up: clear SLEEP bit
    writeReg(PCA9685_MODE1, 0x00);
    delay(10);
    setFrequency(freq);
}

void LotusPCA9685::setFrequency(float freq) {
    _freq = freq;
    // prescale = round(25MHz / (4096 * freq)) - 1
    float prescalef = 25000000.0f / (4096.0f * freq) - 1.0f;
    uint8_t prescale = (uint8_t)(prescalef + 0.5f);

    uint8_t oldMode = readReg(PCA9685_MODE1);
    // Enter SLEEP mode to set prescale
    writeReg(PCA9685_MODE1, (oldMode & 0x7F) | 0x10);
    writeReg(PCA9685_PRESCALE, prescale);
    // Wake up
    writeReg(PCA9685_MODE1, oldMode);
    delay(5);
    // Enable auto-increment
    writeReg(PCA9685_MODE1, oldMode | 0xA0);
}

uint16_t LotusPCA9685::usToPwm(uint16_t us) {
    // PWM count = us / (1000000/freq) * 4096
    float period_us = 1000000.0f / _freq;
    return (uint16_t)((float)us / period_us * 4096.0f);
}

void LotusPCA9685::setPWM(uint8_t ch, uint16_t on, uint16_t off) {
    if (ch >= PCA9685_MAX_CHANNELS) return;
    uint8_t reg = PCA9685_LED0_ON_L + 4 * ch;
    _wire->beginTransmission(_addr);
    _wire->write(reg);
    _wire->write(on  & 0xFF);
    _wire->write(on  >> 8);
    _wire->write(off & 0xFF);
    _wire->write(off >> 8);
    _wire->endTransmission(true);
}

void LotusPCA9685::setMicroseconds(uint8_t ch, uint16_t us) {
    if (ch >= PCA9685_MAX_CHANNELS) return;
    uint16_t off = usToPwm(us);
    off = (off > 4095) ? 4095 : off;
    setPWM(ch, 0, off);
}

void LotusPCA9685::setAngle(uint8_t ch, float angle) {
    if (ch >= PCA9685_MAX_CHANNELS) return;
    angle = constrain(angle, 0.0f, 180.0f);
    uint16_t us = (uint16_t)(_calMin[ch] + (angle / 180.0f) * (_calMax[ch] - _calMin[ch]));
    setMicroseconds(ch, us);
}

void LotusPCA9685::setOff(uint8_t ch) {
    setPWM(ch, 0, 4096);  // full off
}

void LotusPCA9685::setAllOff() {
    // Write to ALL LED register
    _wire->beginTransmission(_addr);
    _wire->write(0xFA);  // ALL_LED_ON_L
    _wire->write(0x00);
    _wire->write(0x00);
    _wire->write(0x00);
    _wire->write(0x10);  // full OFF
    _wire->endTransmission(true);
}

void LotusPCA9685::calibrate(uint8_t ch, uint16_t minUs, uint16_t maxUs) {
    if (ch >= PCA9685_MAX_CHANNELS) return;
    _calMin[ch] = minUs;
    _calMax[ch] = maxUs;
}
