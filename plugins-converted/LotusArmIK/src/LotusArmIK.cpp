#include "LotusArmIK.h"
#include <Servo.h>
#include "../../../LotusPCA9685/src/LotusPCA9685.h"

#ifndef RAD2DEG
#define RAD2DEG (180.0f / M_PI)
#endif
#ifndef DEG2RAD
#define DEG2RAD (M_PI / 180.0f)
#endif

LotusArmIK::LotusArmIK() {
    _dof = ARM_3DOF;
    _pca = nullptr;
    for (uint8_t i = 0; i < ARM_MAX_JOINTS; i++) {
        _links[i]              = 100.0f;
        _joints[i].angle       = 90.0f;
        _joints[i].minAngle    = 0.0f;
        _joints[i].maxAngle    = 180.0f;
        _joints[i].homeAngle   = 90.0f;
        _joints[i].offset      = 0.0f;
        _joints[i].reversed    = false;
        _joints[i].driver      = DRIVER_SERVO;
        _joints[i].pin         = 0;
        _servoObj[i]           = nullptr;
    }
}

void LotusArmIK::begin(ArmDOF dof, float l1, float l2, float l3, float l4) {
    _dof      = dof;
    _links[0] = l1;
    _links[1] = l2;
    _links[2] = (l3 > 0) ? l3 : 0;
    _links[3] = (l4 > 0) ? l4 : 0;
}

void LotusArmIK::attachPCA9685(LotusPCA9685* pca) {
    _pca = pca;
}

void LotusArmIK::attachJointPCA(uint8_t idx, uint8_t channel,
                                  float minA, float maxA, float homeA,
                                  float offset, bool reversed) {
    if (idx >= ARM_MAX_JOINTS) return;
    _joints[idx].driver    = DRIVER_PCA9685;
    _joints[idx].pin       = channel;
    _joints[idx].minAngle  = minA;
    _joints[idx].maxAngle  = maxA;
    _joints[idx].homeAngle = homeA;
    _joints[idx].offset    = offset;
    _joints[idx].reversed  = reversed;
    _joints[idx].angle     = homeA;
}

void LotusArmIK::attachJointServo(uint8_t idx, uint8_t pin,
                                    float minA, float maxA, float homeA,
                                    float offset, bool reversed) {
    if (idx >= ARM_MAX_JOINTS) return;
    _joints[idx].driver    = DRIVER_SERVO;
    _joints[idx].pin       = pin;
    _joints[idx].minAngle  = minA;
    _joints[idx].maxAngle  = maxA;
    _joints[idx].homeAngle = homeA;
    _joints[idx].offset    = offset;
    _joints[idx].reversed  = reversed;
    _joints[idx].angle     = homeA;

    // Allocate Servo object
    Servo* s = new Servo();
    s->attach(pin);
    _servoObj[idx] = (void*)s;
}

// ════════════════════════════════════════════════════════════════
//  OUTPUT JOINT  (apply offset, reverse, clamp, then send)
// ════════════════════════════════════════════════════════════════
void LotusArmIK::outputJoint(uint8_t idx, float angleDeg) {
    if (idx >= ARM_MAX_JOINTS) return;
    ArmJoint& j = _joints[idx];

    // Apply offset
    float a = angleDeg + j.offset;

    // Apply reverse
    if (j.reversed) a = (j.minAngle + j.maxAngle) - a;

    // Clamp to hardware limits
    a = constrain(a, j.minAngle, j.maxAngle);
    j.angle = a;

    // Send to driver
    if (j.driver == DRIVER_PCA9685 && _pca) {
        _pca->setAngle(j.pin, a);
    } else if (j.driver == DRIVER_SERVO && _servoObj[idx]) {
        ((Servo*)_servoObj[idx])->write((int)a);
    }
}

// ════════════════════════════════════════════════════════════════
//  IK SOLVER 2DOF  — planar shoulder + elbow
//  Target: (x, y) from shoulder pivot
//  L1 = upper arm,  L2 = forearm
//  Returns q1 (shoulder), q2 (elbow) in degrees
// ════════════════════════════════════════════════════════════════
bool LotusArmIK::solveIK2DOF(float x, float y, float* q1, float* q2) {
    float L1 = _links[0], L2 = _links[1];
    float d  = sqrtf(x*x + y*y);

    // Check reachability
    if (d > L1 + L2 || d < fabsf(L1 - L2)) return false;

    // Elbow angle (cosine rule)
    float cosQ2 = (d*d - L1*L1 - L2*L2) / (2.0f * L1 * L2);
    cosQ2 = constrain(cosQ2, -1.0f, 1.0f);
    *q2 = acosf(cosQ2) * RAD2DEG;   // elbow-up solution

    // Shoulder angle
    float alpha = atan2f(y, x);
    float beta  = atan2f(L2 * sinf(*q2 * DEG2RAD), L1 + L2 * cosf(*q2 * DEG2RAD));
    *q1 = (alpha - beta) * RAD2DEG;

    return true;
}

// ════════════════════════════════════════════════════════════════
//  IK SOLVER 3DOF  — shoulder + elbow + wrist
//  phi = desired wrist angle (deg, 0=horizontal)
//  Subtract wrist contribution from target first, then solve 2DOF
// ════════════════════════════════════════════════════════════════
bool LotusArmIK::solveIK3DOF(float x, float y, float phi,
                               float* q1, float* q2, float* q3) {
    float L3    = _links[2];
    float phiR  = phi * DEG2RAD;

    // Position of wrist (remove L3 contribution)
    float wx = x - L3 * cosf(phiR);
    float wy = y - L3 * sinf(phiR);

    if (!solveIK2DOF(wx, wy, q1, q2)) return false;

    // Wrist angle = phi - q1 - q2
    *q3 = phi - *q1 - *q2;
    return true;
}

// ════════════════════════════════════════════════════════════════
//  IK SOLVER 4DOF  — base(yaw) + shoulder + elbow + wrist
//  Base rotates in horizontal plane (XY)
//  Arm operates in vertical plane (r, z) where r = sqrt(x^2+y^2)
// ════════════════════════════════════════════════════════════════
bool LotusArmIK::solveIK4DOF(float x, float y, float z, float phi,
                               float* q0, float* q1, float* q2, float* q3) {
    // Base yaw angle
    *q0 = atan2f(y, x) * RAD2DEG;

    // Radial distance in horizontal plane
    float r = sqrtf(x*x + y*y);

    return solveIK3DOF(r, z, phi, q1, q2, q3);
}

// ════════════════════════════════════════════════════════════════
//  PUBLIC MOVE COMMANDS
// ════════════════════════════════════════════════════════════════
bool LotusArmIK::moveTo(float x, float y) {
    float q1, q2;
    if (!solveIK2DOF(x, y, &q1, &q2)) return false;
    // Map IK angles to servo angles
    // q1: shoulder (IK: -90 to 90 → servo: 0 to 180)
    outputJoint(0, q1 + 90.0f);
    outputJoint(1, q2);  // elbow
    return true;
}

bool LotusArmIK::moveTo(float x, float y, float phi) {
    if (_dof == ARM_2DOF) return moveTo(x, y);
    float q1, q2, q3;
    if (!solveIK3DOF(x, y, phi, &q1, &q2, &q3)) return false;
    outputJoint(0, q1 + 90.0f);
    outputJoint(1, q2);
    outputJoint(2, q3 + 90.0f);
    return true;
}

bool LotusArmIK::moveTo(float x, float y, float z, float phi) {
    if (_dof < ARM_4DOF) return moveTo(x, y, phi);
    float q0, q1, q2, q3;
    if (!solveIK4DOF(x, y, z, phi, &q0, &q1, &q2, &q3)) return false;
    outputJoint(0, q0 + 90.0f);  // base yaw  (0° = right, 90° = forward, 180° = left)
    outputJoint(1, q1 + 90.0f);  // shoulder
    outputJoint(2, q2);           // elbow
    outputJoint(3, q3 + 90.0f);  // wrist
    return true;
}

void LotusArmIK::setJointAngle(uint8_t idx, float angle) {
    outputJoint(idx, angle);
}

float LotusArmIK::getJointAngle(uint8_t idx) {
    return (idx < ARM_MAX_JOINTS) ? _joints[idx].angle : 0.0f;
}

void LotusArmIK::moveHome() {
    for (uint8_t i = 0; i < (uint8_t)_dof; i++) {
        outputJoint(i, _joints[i].homeAngle);
        delay(20);
    }
}

bool LotusArmIK::isReachable(float x, float y) {
    float d  = sqrtf(x*x + y*y);
    float L1 = _links[0], L2 = _links[1];
    return (d <= L1 + L2) && (d >= fabsf(L1 - L2));
}

bool LotusArmIK::isReachable(float x, float y, float z) {
    float r = sqrtf(x*x + y*y);
    return isReachable(r, z);
}
