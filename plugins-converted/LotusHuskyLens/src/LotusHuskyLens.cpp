#include "LotusHuskyLens.h"

LotusHuskyLens::LotusHuskyLens() {
    _mode       = HUSKY_I2C;
    _serial     = nullptr;
    _i2cAddr    = HUSKYLENS_I2C_ADDR;
    _blockCount = 0;
    _arrowCount = 0;
    clearResults();
}

// ════════════════════════════════════════════════════════════════
//  SETUP
// ════════════════════════════════════════════════════════════════
bool LotusHuskyLens::begin(TwoWire& wire) {
    _mode = HUSKY_I2C;
    wire.begin();
    delay(100);
    return knock();
}

bool LotusHuskyLens::begin(Stream& serial) {
    _mode   = HUSKY_UART;
    _serial = &serial;
    delay(100);
    return knock();
}

// ════════════════════════════════════════════════════════════════
//  LOW-LEVEL I/O
// ════════════════════════════════════════════════════════════════
void LotusHuskyLens::writeBytes(uint8_t* buf, uint8_t len) {
    if (_mode == HUSKY_I2C) {
        Wire.beginTransmission(_i2cAddr);
        for (uint8_t i = 0; i < len; i++) Wire.write(buf[i]);
        Wire.endTransmission(true);
    } else {
        if (_serial) _serial->write(buf, len);
    }
}

int16_t LotusHuskyLens::readByte() {
    if (_mode == HUSKY_I2C) {
        if (Wire.available()) return Wire.read();
        return -1;
    } else {
        if (_serial && _serial->available()) return _serial->read();
        return -1;
    }
}

bool LotusHuskyLens::available(uint8_t needed) {
    unsigned long t = millis();
    if (_mode == HUSKY_I2C) {
        Wire.requestFrom((uint8_t)_i2cAddr, needed);
        while (Wire.available() < needed) {
            if ((unsigned long)(millis() - t) > HUSKYLENS_TIMEOUT_MS) return false;
        }
        return true;
    } else {
        while (_serial->available() < needed) {
            if ((unsigned long)(millis() - t) > HUSKYLENS_TIMEOUT_MS) return false;
        }
        return true;
    }
}

// ════════════════════════════════════════════════════════════════
//  CHECKSUM
// ════════════════════════════════════════════════════════════════
uint8_t LotusHuskyLens::checksum(uint8_t* buf, uint8_t len) {
    uint8_t sum = 0;
    for (uint8_t i = 0; i < len; i++) sum += buf[i];
    return sum;
}

// ════════════════════════════════════════════════════════════════
//  SEND COMMAND
//  Frame: 0x55 0xAA 0x11 LEN CMD [DATA...] CHECKSUM
// ════════════════════════════════════════════════════════════════
void LotusHuskyLens::sendCmd(uint8_t cmd, uint8_t* data, uint8_t len) {
    uint8_t buf[32];
    buf[0] = HUSKYLENS_HEADER1;
    buf[1] = HUSKYLENS_HEADER2;
    buf[2] = HUSKYLENS_ADDR;
    buf[3] = len;
    buf[4] = cmd;
    for (uint8_t i = 0; i < len; i++) buf[5 + i] = data[i];
    buf[5 + len] = checksum(buf, 5 + len);
    writeBytes(buf, 6 + len);
}

// ════════════════════════════════════════════════════════════════
//  PARSE FRAME  (reads response from HuskyLens)
// ════════════════════════════════════════════════════════════════
bool LotusHuskyLens::parseFrame() {
    clearResults();

    // อ่าน header (5 bytes): H1 H2 ADDR LEN CMD
    if (!available(5)) return false;
    uint8_t h[5];
    for (uint8_t i = 0; i < 5; i++) {
        int16_t b = readByte();
        if (b < 0) return false;
        h[i] = (uint8_t)b;
    }
    if (h[0] != HUSKYLENS_HEADER1 || h[1] != HUSKYLENS_HEADER2) return false;

    uint8_t dataLen = h[3];
    uint8_t cmd     = h[4];

    // อ่าน data + checksum
    if (dataLen > 0 && !available(dataLen + 1)) return false;

    uint8_t buf[64] = {0};
    for (uint8_t i = 0; i < dataLen; i++) {
        int16_t b = readByte();
        if (b < 0) return false;
        buf[i] = (uint8_t)b;
    }
    int16_t cs = readByte();
    if (cs < 0) return false;

    // verify checksum
    uint8_t expected = checksum(h, 5);
    expected += checksum(buf, dataLen);
    if ((uint8_t)cs != expected) return false;

    // ── Parse content ─────────────────────────────────────────────
    // CMD 0x2E = return block,  CMD 0x2F = return arrow
    // CMD 0x29 = return count frame (first response)
    if (cmd == 0x29) {
        // Count frame: [blockCnt LSB, blockCnt MSB, arrowCnt LSB, arrowCnt MSB]
        // ข้อมูลจริงจะตามมาในเฟรมถัดไป — อ่านต่อ
        uint8_t totalBlocks = buf[0] | ((uint8_t)buf[1] << 8);
        uint8_t totalArrows = buf[2] | ((uint8_t)buf[3] << 8);
        // อ่านแต่ละ result frame
        for (uint8_t b = 0; b < totalBlocks && _blockCount < HUSKY_MAX_RESULTS; b++) {
            if (!available(16)) break;
            uint8_t r[11]; // 5 header + 10 data + 1 cs = 16 total
            // อ่าน header ซ้ำ
            for (uint8_t i = 0; i < 5; i++) { int16_t x = readByte(); if(x>=0) r[i]=(uint8_t)x; }
            uint8_t dLen = r[3];
            uint8_t dat[10] = {0};
            for (uint8_t i = 0; i < dLen; i++) { int16_t x = readByte(); if(x>=0) dat[i]=(uint8_t)x; }
            readByte(); // checksum
            HuskyBlock blk;
            blk.x  = (int16_t)(dat[0] | ((uint16_t)dat[1] << 8));
            blk.y  = (int16_t)(dat[2] | ((uint16_t)dat[3] << 8));
            blk.w  = (int16_t)(dat[4] | ((uint16_t)dat[5] << 8));
            blk.h  = (int16_t)(dat[6] | ((uint16_t)dat[7] << 8));
            blk.id = (int16_t)(dat[8] | ((uint16_t)dat[9] << 8));
            _blocks[_blockCount++] = blk;
        }
        for (uint8_t a = 0; a < totalArrows && _arrowCount < HUSKY_MAX_RESULTS; a++) {
            if (!available(16)) break;
            uint8_t r[5];
            for (uint8_t i = 0; i < 5; i++) { int16_t x = readByte(); if(x>=0) r[i]=(uint8_t)x; }
            uint8_t dLen = r[3];
            uint8_t dat[10] = {0};
            for (uint8_t i = 0; i < dLen; i++) { int16_t x = readByte(); if(x>=0) dat[i]=(uint8_t)x; }
            readByte();
            HuskyArrow arr;
            arr.xTail = (int16_t)(dat[0] | ((uint16_t)dat[1] << 8));
            arr.yTail = (int16_t)(dat[2] | ((uint16_t)dat[3] << 8));
            arr.xHead = (int16_t)(dat[4] | ((uint16_t)dat[5] << 8));
            arr.yHead = (int16_t)(dat[6] | ((uint16_t)dat[7] << 8));
            arr.id    = (int16_t)(dat[8] | ((uint16_t)dat[9] << 8));
            _arrows[_arrowCount++] = arr;
        }
    }
    return true;
}

// ════════════════════════════════════════════════════════════════
//  PUBLIC API
// ════════════════════════════════════════════════════════════════
bool LotusHuskyLens::knock() {
    sendCmd(HUSKYLENS_CMD_KNOCK);
    delay(20);
    if (!available(5)) return false;
    uint8_t h[5];
    for (uint8_t i = 0; i < 5; i++) {
        int16_t b = readByte(); if (b < 0) return false;
        h[i] = (uint8_t)b;
    }
    return (h[4] == 0x2E || h[4] == 0x2C || h[4] == 0x11);
}

bool LotusHuskyLens::switchAlgorithm(HuskyAlgorithm algo) {
    uint8_t d[2] = { (uint8_t)algo, 0x00 };
    sendCmd(HUSKYLENS_CMD_SWITCH_ALGO, d, 2);
    delay(200);
    return true;
}

bool LotusHuskyLens::request() {
    sendCmd(HUSKYLENS_CMD_REQUEST);
    delay(5);
    return parseFrame();
}

bool LotusHuskyLens::requestBlocks() {
    sendCmd(HUSKYLENS_CMD_REQUEST_BLOCKS);
    delay(5);
    return parseFrame();
}

bool LotusHuskyLens::requestArrows() {
    sendCmd(HUSKYLENS_CMD_REQUEST_ARROWS);
    delay(5);
    return parseFrame();
}

bool LotusHuskyLens::requestLearned() {
    sendCmd(HUSKYLENS_CMD_REQUEST_LEARNED);
    delay(5);
    return parseFrame();
}

bool LotusHuskyLens::requestByID(int16_t id) {
    uint8_t d[2] = { (uint8_t)(id & 0xFF), (uint8_t)(id >> 8) };
    sendCmd(HUSKYLENS_CMD_REQUEST_BY_ID, d, 2);
    delay(5);
    return parseFrame();
}

HuskyBlock LotusHuskyLens::getBlock(uint8_t idx) {
    if (idx < _blockCount) return _blocks[idx];
    HuskyBlock empty = {0, 0, 0, 0, 0};
    return empty;
}

HuskyArrow LotusHuskyLens::getArrow(uint8_t idx) {
    if (idx < _arrowCount) return _arrows[idx];
    HuskyArrow empty = {0, 0, 0, 0, 0};
    return empty;
}

bool LotusHuskyLens::isLearned(int16_t id) {
    for (uint8_t i = 0; i < _blockCount; i++) {
        if (_blocks[i].id == id) return true;
    }
    for (uint8_t i = 0; i < _arrowCount; i++) {
        if (_arrows[i].id == id) return true;
    }
    return false;
}

void LotusHuskyLens::clearResults() {
    _blockCount = 0;
    _arrowCount = 0;
    for (uint8_t i = 0; i < HUSKY_MAX_RESULTS; i++) {
        _blocks[i] = {0,0,0,0,0};
        _arrows[i] = {0,0,0,0,0};
    }
}
