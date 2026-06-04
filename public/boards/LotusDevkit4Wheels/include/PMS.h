/**
 * PMS.h - PMS Dust Sensor header for LotusDevkit
 * Reverse-engineered from PMS.cpp errors (KBIDE version)
 * All members declared to match PMS.cpp exactly
 */
#ifndef PMS_H
#define PMS_H

#include <Arduino.h>

class PMS {
public:
  // ── Enums ──────────────────────────────────────────────────────────
  enum MODE   { MODE_ACTIVE = 0, MODE_PASSIVE = 1 };
  enum STATUS { STATUS_OK = 0, STATUS_ERROR = 1, STATUS_WAITING = 2 };

  // ── DATA struct ────────────────────────────────────────────────────
  struct DATA {
    uint16_t PM_SP_UG_1_0;
    uint16_t PM_SP_UG_2_5;
    uint16_t PM_SP_UG_10_0;
    uint16_t PM_AE_UG_1_0;
    uint16_t PM_AE_UG_2_5;
    uint16_t PM_AE_UG_10_0;
    uint16_t ATMOSPHERIC_PM_1_0;
    uint16_t ATMOSPHERIC_PM_2_5;
    uint16_t ATMOSPHERIC_PM_10_0;
  };

  // ── Public API ─────────────────────────────────────────────────────
  PMS(Stream& stream);
  void requestRead();
  bool read(DATA& data);
  bool readUntil(DATA& data, uint16_t timeout = 2000);
  void sleep();
  void wakeUp();
  void activeMode();
  void passiveMode();
  void loop();

private:
  // ── Private members (all needed by PMS.cpp loop()) ────────────────
  Stream*  _stream;
  DATA*    _data;
  MODE     _mode;
  STATUS   _status;

  // loop() state machine members
  uint8_t  _index;
  uint16_t _frameLen;
  uint16_t _checksum;
  uint16_t _calculatedChecksum;
  uint8_t  _payload[54];   // PMS max payload buffer

  void sendCmd(uint8_t cmd, uint8_t data);
};

#endif // PMS_H
