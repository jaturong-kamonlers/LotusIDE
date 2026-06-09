#ifndef LOTUS_ARM_IK_H
#define LOTUS_ARM_IK_H

#include <Arduino.h>
#include <math.h>

// ─── DOF Modes ───────────────────────────────────────────────────
typedef enum {
    ARM_2DOF = 2,   // 2D planar: shoulder + elbow  → target (x,y)
    ARM_3DOF = 3,   // 2D planar: shoulder + elbow + wrist → (x,y) + wrist angle
    ARM_4DOF = 4    // 3D: base(yaw) + shoulder + elbow + wrist → (x,y,z)
} ArmDOF;

// ─── Driver type ─────────────────────────────────────────────────
typedef enum {
    DRIVER_SERVO   = 0,   // Arduino Servo.h
    DRIVER_PCA9685 = 1    // I2C PCA9685
} ArmDriver;

// ─── Max joints ──────────────────────────────────────────────────
#define ARM_MAX_JOINTS 4

// Forward declare
class LotusPCA9685;
class Servo;

// ─── Per-joint config ────────────────────────────────────────────
struct ArmJoint {
    float  angle;        // current angle (degrees)
    float  minAngle;     // hardware limit min
    float  maxAngle;     // hardware limit max
    float  homeAngle;    // home position
    float  offset;       // mechanical offset (added to output)
    bool   reversed;     // reverse direction
    // driver binding
    ArmDriver driver;
    uint8_t   pin;       // for Servo.h: pin number, for PCA9685: channel
};

class LotusArmIK {
private:
    ArmDOF    _dof;
    ArmJoint  _joints[ARM_MAX_JOINTS];
    float     _links[ARM_MAX_JOINTS];  // link lengths (mm): L1, L2, L3, L4

    // PCA9685 pointer (optional)
    LotusPCA9685* _pca;
    // Servo objects (only for DRIVER_SERVO joints)
    // Using void* to avoid forward declaration issues with template
    void*     _servoObj[ARM_MAX_JOINTS];

    // ── IK solvers ───────────────────────────────────────────────
    bool solveIK2DOF(float x, float y, float* q1, float* q2);
    bool solveIK3DOF(float x, float y, float phi, float* q1, float* q2, float* q3);
    bool solveIK4DOF(float x, float y, float z, float phi, float* q0, float* q1, float* q2, float* q3);

    // ── Output angle to servo ────────────────────────────────────
    void outputJoint(uint8_t idx, float angleDeg);

public:
    LotusArmIK();

    // ── Setup ────────────────────────────────────────────────────
    void begin(ArmDOF dof, float l1, float l2, float l3 = 0, float l4 = 0);

    // ── Attach servo driver ──────────────────────────────────────
    void attachPCA9685(LotusPCA9685* pca);

    // Attach joint to PCA9685 channel
    void attachJointPCA(uint8_t jointIdx, uint8_t channel,
                        float minAngle=0, float maxAngle=180,
                        float homeAngle=90, float offset=0, bool reversed=false);

    // Attach joint to Arduino Servo pin
    void attachJointServo(uint8_t jointIdx, uint8_t pin,
                          float minAngle=0, float maxAngle=180,
                          float homeAngle=90, float offset=0, bool reversed=false);

    // ── Move commands ────────────────────────────────────────────

    // 2DOF: move to (x, y) mm from base
    bool moveTo(float x, float y);

    // 3DOF: move to (x, y) with wrist angle phi (degrees, 0=horizontal)
    bool moveTo(float x, float y, float phi);

    // 4DOF: move to (x, y, z) with wrist angle phi
    bool moveTo(float x, float y, float z, float phi);

    // Set joint angle directly
    void setJointAngle(uint8_t idx, float angle);

    // Get current joint angle
    float getJointAngle(uint8_t idx);

    // Move to home position
    void moveHome();

    // Check if target is reachable
    bool isReachable(float x, float y);
    bool isReachable(float x, float y, float z);

    // Get reach limits
    float maxReach()  { return _links[0] + _links[1] + _links[2] + _links[3]; }
    float minReach()  { return fabsf(_links[0] - _links[1]); }
};

#endif
