/******************************************************************************
 * The MIT License
 *
 * Copyright (c) 2010, LeafLabs, LLC.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *****************************************************************************/

 /*
 * Arduino srl - www.arduino.org
 * Base on lib for stm32f4 (d2a4a47): https://github.com/arduino-libraries/Servo/blob/master/src/stm32f4/ServoTimers.h
 * 2017 Jul 5: Edited by Jaroslav Páral (jarekparal) - paral@robotikabrno.cz
 */

#include "Lotus_Servo.h"

int Servo::channel_next_free = 2; // ข้าม ch0,ch1 (tone)

Servo::Servo() {
    _resetFields();
};

Servo::~Servo() {
    detach();
}

// ── shared implementation ────────────────────────────────────────────────────
bool Servo::_attachImpl(int pin, int channel,
                        int minAngle, int maxAngle,
                        int minPulseWidth, int maxPulseWidth)
{
    if(channel == CHANNEL_NOT_ATTACHED) {
        if(channel_next_free >= CHANNEL_MAX_NUM) return false;
        _channel = channel_next_free++;
        // ข้าม ch4 (Motor A) และ ch13 (Motor B)
        while(channel_next_free == 4 || channel_next_free == 13)
            channel_next_free++;
    } else {
        _channel = channel;
    }
    _pin          = pin;
    _minAngle     = minAngle;
    _maxAngle     = maxAngle;
    _minPulseWidth = minPulseWidth;
    _maxPulseWidth = maxPulseWidth;
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcAttach(_pin, 50, 16);
#else
    ledcSetup(_channel, 50, 16);
    ledcAttachPin(_pin, _channel);
#endif
    return true;
}

// pin only
bool Servo::attach(int pin) {
    return _attachImpl(pin, CHANNEL_NOT_ATTACHED,
                       MIN_ANGLE, MAX_ANGLE,
                       MIN_PULSE_WIDTH, MAX_PULSE_WIDTH);
}

// ESP32Servo API: attach(pin, minUs, maxUs)
bool Servo::attach(int pin, int minUs, int maxUs) {
    return _attachImpl(pin, CHANNEL_NOT_ATTACHED,
                       0, 180, minUs, maxUs);
}

// full: attach(pin, channel, minAngle, maxAngle, minPulseWidth, maxPulseWidth)
bool Servo::attach(int pin, int channel,
                   int minAngle, int maxAngle,
                   int minPulseWidth, int maxPulseWidth)
{
    return _attachImpl(pin, channel, minAngle, maxAngle, minPulseWidth, maxPulseWidth);
}


bool Servo::detach() {
    if (!this->attached()) {
        return false;
    }

    if(_channel == (channel_next_free - 1))
        channel_next_free--;

#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcDetach(_pin);
#else
    ledcDetachPin(_pin);
#endif
    return true;
}

void Servo::write(int degrees) {
    degrees = constrain(degrees, _minAngle, _maxAngle);
    writeMicroseconds(_angleToUs(degrees));
}

void Servo::writeMicroseconds(int pulseUs) {
    if (!attached()) {
        return;
    }
    pulseUs = constrain(pulseUs, _minPulseWidth, _maxPulseWidth);
    _pulseWidthDuty = _usToDuty(pulseUs);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    ledcWrite(_pin, _pulseWidthDuty);
#else
    ledcWrite(_channel, _pulseWidthDuty);
#endif
}

int Servo::read() {
    return _usToAngle(readMicroseconds());
}

int Servo::readMicroseconds() {
    if (!this->attached()) {
        return 0;
    }
#if ESP_ARDUINO_VERSION_MAJOR >= 3
    int duty = ledcRead(_pin);
#else
    int duty = ledcRead(_channel);
#endif
    return _dutyToUs(duty);
}

bool Servo::attached() const { return _pin != PIN_NOT_ATTACHED; }

int Servo::attachedPin() const { return _pin; }

void Servo::_resetFields(void) {
    _pin = PIN_NOT_ATTACHED;
    _pulseWidthDuty = 0;
    _channel = CHANNEL_NOT_ATTACHED;
    _minAngle = MIN_ANGLE;
    _maxAngle = MAX_ANGLE;
    _minPulseWidth = MIN_PULSE_WIDTH;
    _maxPulseWidth = MAX_PULSE_WIDTH;
}
