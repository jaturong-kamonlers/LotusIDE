#ifndef LOTUS_TELEGRAM_H
#define LOTUS_TELEGRAM_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define TELEGRAM_HOST "api.telegram.org"
#define TELEGRAM_PORT 443

class LotusBot {
public:
    LotusBot(const String& token) : _token(token), _lastUpdateId(0) {}

    // ส่งข้อความ
    bool sendMessage(const String& chatId, const String& text) {
        String url = "https://" + String(TELEGRAM_HOST) + "/bot" + _token +
                     "/sendMessage?chat_id=" + chatId +
                     "&text=" + urlEncode(text);
        return httpGet(url).length() > 0;
    }

    // ส่งข้อความพร้อม reply keyboard
    bool sendKeyboard(const String& chatId, const String& text, const String& keyboard) {
        String url = "https://" + String(TELEGRAM_HOST) + "/bot" + _token +
                     "/sendMessage?chat_id=" + chatId +
                     "&text=" + urlEncode(text) +
                     "&reply_markup=" + urlEncode(keyboard);
        return httpGet(url).length() > 0;
    }

    // ดึงข้อความใหม่ (polling) — return true ถ้ามีข้อความใหม่
    bool getNewMessage(String& chatId, String& text) {
        String url = "https://" + String(TELEGRAM_HOST) + "/bot" + _token +
                     "/getUpdates?offset=" + String(_lastUpdateId + 1) +
                     "&limit=1&timeout=0";
        String response = httpGet(url);
        if (response.length() == 0) return false;

        DynamicJsonDocument doc(2048);
        if (deserializeJson(doc, response) != DeserializationError::Ok) return false;
        if (!doc["ok"] || doc["result"].size() == 0) return false;

        JsonObject update = doc["result"][0];
        _lastUpdateId = update["update_id"].as<long>();
        if (!update.containsKey("message")) return false;

        chatId = update["message"]["chat"]["id"].as<String>();
        text   = update["message"]["text"].as<String>();
        text.trim();
        return true;
    }

    // ดึง ChatID จากข้อความล่าสุด
    String getLastChatId() { return _lastChatId; }

    // ส่งภาพจาก URL
    bool sendPhoto(const String& chatId, const String& photoUrl) {
        String url = "https://" + String(TELEGRAM_HOST) + "/bot" + _token +
                     "/sendPhoto?chat_id=" + chatId +
                     "&photo=" + urlEncode(photoUrl);
        return httpGet(url).length() > 0;
    }

private:
    String _token;
    long   _lastUpdateId;
    String _lastChatId;

    String httpGet(const String& url) {
        if (WiFi.status() != WL_CONNECTED) return "";
        WiFiClientSecure client;
        client.setInsecure(); // ไม่ verify SSL cert (ง่ายกว่า)
        HTTPClient https;
        https.begin(client, url);
        https.setTimeout(8000);
        int code = https.GET();
        String payload = "";
        if (code > 0) payload = https.getString();
        https.end();
        return payload;
    }

    String urlEncode(const String& s) {
        String encoded = "";
        for (int i = 0; i < s.length(); i++) {
            char c = s[i];
            if (isAlphaNumeric(c) || c == '-' || c == '_' || c == '.' || c == '~') {
                encoded += c;
            } else if (c == ' ') {
                encoded += '+';
            } else {
                encoded += '%';
                if ((uint8_t)c < 0x10) encoded += '0';
                encoded += String((uint8_t)c, HEX);
            }
        }
        return encoded;
    }
};

#endif
