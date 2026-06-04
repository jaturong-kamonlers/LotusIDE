// ============================================================
// Quadrature encoder helpers for LotusMegaBot++
// Encoder 1: A=D2 (INT0), B=D3 (INT1)
// Encoder 2: A=D18 (INT5), B=D19 (INT4)  -- conflicts with Serial1
// ============================================================
#ifndef _LMBP_NANO_ENCODER_H_
#define _LMBP_NANO_ENCODER_H_

volatile long _enc1_count = 0;
volatile long _enc2_count = 0;

void _enc1_isr() {
    // Read direction from B pin at rising edge of A
    if (digitalRead(_ENC1_B) == LOW) _enc1_count++;
    else                              _enc1_count--;
}

void _enc2_isr() {
    if (digitalRead(_ENC2_B) == LOW) _enc2_count++;
    else                              _enc2_count--;
}

// Initialize one or both encoders.
// mask: bit0 = enable enc1, bit1 = enable enc2  (use 1, 2, or 3)
void encoder_init(uint8_t mask) {
    if (mask & 0x01) {
        pinMode(_ENC1_A, INPUT_PULLUP);
        pinMode(_ENC1_B, INPUT_PULLUP);
        _enc1_count = 0;
        attachInterrupt(digitalPinToInterrupt(_ENC1_A), _enc1_isr, RISING);
    }
    if (mask & 0x02) {
        pinMode(_ENC2_A, INPUT_PULLUP);
        pinMode(_ENC2_B, INPUT_PULLUP);
        _enc2_count = 0;
        attachInterrupt(digitalPinToInterrupt(_ENC2_A), _enc2_isr, RISING);
    }
}

long encoder_read(uint8_t which) {
    if (which == 1) {
        noInterrupts(); long v = _enc1_count; interrupts();
        return v;
    }
    if (which == 2) {
        noInterrupts(); long v = _enc2_count; interrupts();
        return v;
    }
    return 0;
}

void encoder_reset(uint8_t which) {
    noInterrupts();
    if (which == 1) _enc1_count = 0;
    if (which == 2) _enc2_count = 0;
    interrupts();
}

// ============================================================
// Closed-loop motion using both encoders (M1 = enc1, M2 = enc2).
//   encoder_drive  : both wheels same direction, equal distance
//   encoder_spin   : wheels opposite direction (spin in place)
// dir : +1 = forward / spin right, -1 = backward / spin left
// Simple proportional sync — slow the leader, speed the follower.
// Each wheel stops individually when its own tick target is reached.
// 30-second safety timeout to prevent infinite loops if a wheel stalls.
// ============================================================
inline long _abs_long(long v) { return v < 0 ? -v : v; }

void encoder_drive(int dir, long target_ticks, int base_speed) {
    if (target_ticks < 0) target_ticks = -target_ticks;
    if (base_speed   < 0) base_speed   = -base_speed;
    if (base_speed > 100) base_speed = 100;
    if (dir == 0) return;
    dir = (dir > 0) ? 1 : -1;

    encoder_init(3);
    encoder_reset(1);
    encoder_reset(2);

    unsigned long t0 = millis();
    while (true) {
        long c1 = encoder_read(1) * dir;   // signed in commanded direction
        long c2 = encoder_read(2) * dir;
        long abs1 = _abs_long(c1);
        long abs2 = _abs_long(c2);
        if (abs1 >= target_ticks && abs2 >= target_ticks) break;

        long diff = c1 - c2;                  // + = left leading, - = right leading
        int  cap  = base_speed / 2;
        int  adj  = (int)diff;
        if (adj >  cap) adj =  cap;
        if (adj < -cap) adj = -cap;

        int spL = (base_speed - adj) * dir;
        int spR = (base_speed + adj) * dir;
        if (spL >  100) spL =  100;  if (spL < -100) spL = -100;
        if (spR >  100) spR =  100;  if (spR < -100) spR = -100;

        if (abs1 >= target_ticks) spL = 0;
        if (abs2 >= target_ticks) spR = 0;

        motor_single(1, spL);
        motor_single(2, spR);

        if (millis() - t0 > 30000UL) break;   // safety timeout
        delay(5);
    }
    motor_single(1, 0);
    motor_single(2, 0);
}

void encoder_spin(int dir, long target_ticks, int base_speed) {
    if (target_ticks < 0) target_ticks = -target_ticks;
    if (base_speed   < 0) base_speed   = -base_speed;
    if (base_speed > 100) base_speed = 100;
    if (dir == 0) return;
    dir = (dir > 0) ? 1 : -1;

    encoder_init(3);
    encoder_reset(1);
    encoder_reset(2);

    unsigned long t0 = millis();
    while (true) {
        long abs1 = _abs_long(encoder_read(1));
        long abs2 = _abs_long(encoder_read(2));
        if (abs1 >= target_ticks && abs2 >= target_ticks) break;

        // spin right (dir=+1): left forward, right backward
        // spin left  (dir=-1): left backward, right forward
        int spL = (abs1 < target_ticks) ? ( base_speed * dir) : 0;
        int spR = (abs2 < target_ticks) ? (-base_speed * dir) : 0;

        motor_single(1, spL);
        motor_single(2, spR);

        if (millis() - t0 > 30000UL) break;
        delay(5);
    }
    motor_single(1, 0);
    motor_single(2, 0);
}

#endif // _LMBP_NANO_ENCODER_H_
