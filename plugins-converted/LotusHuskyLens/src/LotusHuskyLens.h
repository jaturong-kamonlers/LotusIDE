#ifndef LOTUS_HUSKYLENS_H
#define LOTUS_HUSKYLENS_H

#include <Arduino.h>
#include <Wire.h>

// ─── Protocol ────────────────────────────────────────────────────
#define HUSKYLENS_I2C_ADDR        0x32
#define HUSKYLENS_HEADER1         0x55
#define HUSKYLENS_HEADER2         0xAA
#define HUSKYLENS_ADDR            0x11
#define HUSKYLENS_TIMEOUT_MS      100

// ─── Commands ────────────────────────────────────────────────────
#define HUSKYLENS_CMD_REQUEST           0x20
#define HUSKYLENS_CMD_REQUEST_BLOCKS    0x21
#define HUSKYLENS_CMD_REQUEST_ARROWS    0x22
#define HUSKYLENS_CMD_REQUEST_LEARNED   0x23
#define HUSKYLENS_CMD_REQUEST_BY_ID     0x26
#define HUSKYLENS_CMD_SWITCH_ALGO       0x2D
#define HUSKYLENS_CMD_KNOCK             0x2C

// ─── Algorithms ──────────────────────────────────────────────────
typedef enum {
    ALGO_FACE_RECOGNITION   = 0x01,
    ALGO_OBJECT_TRACKING    = 0x02,
    ALGO_OBJECT_RECOGNITION = 0x03,
    ALGO_LINE_TRACKING      = 0x04,
    ALGO_COLOR_RECOGNITION  = 0x05,
    ALGO_TAG_RECOGNITION    = 0x06
} HuskyAlgorithm;

// ─── Communication mode ──────────────────────────────────────────
typedef enum {
    HUSKY_I2C  = 0,
    HUSKY_UART = 1
} HuskyMode;

// ─── Data structures ─────────────────────────────────────────────
struct HuskyBlock {
    int16_t x, y, w, h;
    int16_t id;
};

struct HuskyArrow {
    int16_t xTail, yTail;
    int16_t xHead, yHead;
    int16_t id;
};

// ─── Max results per frame ───────────────────────────────────────
#define HUSKY_MAX_RESULTS  16

class LotusHuskyLens {
private:
    HuskyMode  _mode;
    Stream*    _serial;   // UART
    uint8_t    _i2cAddr;

    HuskyBlock  _blocks[HUSKY_MAX_RESULTS];
    HuskyArrow  _arrows[HUSKY_MAX_RESULTS];
    uint8_t     _blockCount;
    uint8_t     _arrowCount;

    // ── Protocol helpers ─────────────────────────────────────────
    void     sendCmd(uint8_t cmd, uint8_t* data = nullptr, uint8_t len = 0);
    bool     readResponse(uint8_t* buf, uint8_t len);
    uint8_t  checksum(uint8_t* buf, uint8_t len);
    bool     parseFrame();
    void     clearResults();

    // ── I2C / UART low-level ─────────────────────────────────────
    void    writeBytes(uint8_t* buf, uint8_t len);
    int16_t readByte();
    bool    available(uint8_t needed);

public:
    LotusHuskyLens();

    // ── Setup ────────────────────────────────────────────────────
    bool begin(TwoWire& wire = Wire);              // I2C
    bool begin(Stream& serial);                    // UART

    // ── Knock / ping ─────────────────────────────────────────────
    bool knock();

    // ── Switch Algorithm ─────────────────────────────────────────
    bool switchAlgorithm(HuskyAlgorithm algo);

    // ── Request frame ────────────────────────────────────────────
    bool request();               // all results
    bool requestBlocks();         // blocks only
    bool requestArrows();         // arrows only
    bool requestLearned();        // learned objects only
    bool requestByID(int16_t id); // by specific ID

    // ── Data accessors ───────────────────────────────────────────
    uint8_t    blockCount()  { return _blockCount; }
    uint8_t    arrowCount()  { return _arrowCount; }

    HuskyBlock  getBlock(uint8_t idx);
    HuskyArrow  getArrow(uint8_t idx);
    bool        isLearned(int16_t id);
};

#endif
