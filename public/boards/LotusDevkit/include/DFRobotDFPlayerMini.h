#ifndef DFROBOTDFPLAYERMINI_H
#define DFROBOTDFPLAYERMINI_H

#include <Arduino.h>

#define DFPLAYER_RECEIVED_LENGTH  10
#define DFPLAYER_SEND_LENGTH      10

// Commands
#define CMD_NEXT          0x01
#define CMD_PREV          0x02
#define CMD_PLAY_INDEX    0x03
#define CMD_VOL_UP        0x04
#define CMD_VOL_DOWN      0x05
#define CMD_SET_VOL       0x06
#define CMD_SET_EQ        0x07
#define CMD_PLAY_FOLDER   0x0F
#define CMD_PLAY          0x0F
#define CMD_STOP          0x16
#define CMD_PAUSE         0x0E
#define CMD_RESUME        0x0D
#define CMD_RESET         0x0C
#define CMD_POWER_DOWN    0x02

class DFRobotDFPlayerMini {
public:
    bool begin(Stream &stream, bool ack=true) {
        _serial = &stream;
        delay(1000);  // รอ DFPlayer boot
        reset();
        delay(1500);
        setVolume(20);
        return true;
    }

    void play(int fileNum=1)  { sendCmd(CMD_PLAY_INDEX, 0, fileNum); }
    void next()               { sendCmd(CMD_NEXT,       0, 0); }
    void previous()           { sendCmd(CMD_PREV,       0, 0); }
    void pause()              { sendCmd(CMD_PAUSE,      0, 0); }
    void resume()             { sendCmd(CMD_RESUME,     0, 0); }
    void stop()               { sendCmd(CMD_STOP,       0, 0); }
    void reset()              { sendCmd(CMD_RESET,      0, 0); }
    void volumeUp()           { sendCmd(CMD_VOL_UP,     0, 0); }
    void volumeDown()         { sendCmd(CMD_VOL_DOWN,   0, 0); }

    void volume(int vol) {
        if(vol < 0)  vol = 0;
        if(vol > 30) vol = 30;
        setVolume(vol);
    }

    void playFolder(int folder, int file) {
        sendCmd(CMD_PLAY_FOLDER, folder, file);
    }

private:
    Stream* _serial = nullptr;

    void setVolume(int vol) { sendCmd(CMD_SET_VOL, 0, vol); }

    void sendCmd(uint8_t cmd, uint8_t paramHi, uint8_t paramLo) {
        if(!_serial) return;
        uint8_t buf[DFPLAYER_SEND_LENGTH];
        buf[0] = 0x7E;  // START
        buf[1] = 0xFF;  // version
        buf[2] = 0x06;  // length
        buf[3] = cmd;
        buf[4] = 0x00;  // no feedback
        buf[5] = paramHi;
        buf[6] = paramLo;
        // checksum
        uint16_t cs = 0 - (buf[1]+buf[2]+buf[3]+buf[4]+buf[5]+buf[6]);
        buf[7] = (cs >> 8) & 0xFF;
        buf[8] = cs & 0xFF;
        buf[9] = 0xEF;  // END
        _serial->write(buf, DFPLAYER_SEND_LENGTH);
        delay(30);
    }
};

#endif // DFROBOTDFPLAYERMINI_H
