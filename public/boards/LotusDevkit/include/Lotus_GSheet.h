#ifndef LOTUS_GSHEET_H
#define LOTUS_GSHEET_H

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

/*
  วิธีใช้ Google Sheet:
  1. เปิด Google Sheet → Extensions → Apps Script
  2. วางโค้ด doGet(e) และ doPost(e) ด้านล่าง deploy เป็น Web App
  3. copy Deployment URL มาใส่ใน begin()

  --- Apps Script ---
  function doGet(e) {
    var ss = SpreadsheetApp.openById("YOUR_SHEET_ID");
    var sh = ss.getSheetByName("Sheet1");
    var action = e.parameter.action;
    if(action=="append") {
      var values = e.parameter.values.split(",");
      sh.appendRow(values);
      return ContentService.createTextOutput("OK");
    }
    if(action=="read") {
      var row = parseInt(e.parameter.row)||sh.getLastRow();
      var col = parseInt(e.parameter.col)||1;
      var val = sh.getRange(row,col).getValue();
      return ContentService.createTextOutput(String(val));
    }
    return ContentService.createTextOutput("ERR");
  }
*/

class LotusGSheet {
public:
    LotusGSheet() {}

    void begin(const String& scriptUrl) {
        _url = scriptUrl;
    }

    // เพิ่มแถวใหม่ — ส่งค่าหลายตัวคั่นด้วย comma เช่น "25.5,60,1013"
    bool appendRow(const String& values) {
        String url = _url + "?action=append&values=" + urlEncode(values);
        return httpGet(url) == "OK";
    }

    // เพิ่มแถวแบบระบุชื่อ label และค่า
    bool appendLabeled(const String& label, float value, int decimals=2) {
        // arduino-esp32 3.x removed String(float, int); format via dtostrf.
        char buf[20];
        dtostrf(value, 0, decimals, buf);
        String v = label + "," + String(buf);
        return appendRow(v);
    }

    // อ่านค่าจากเซลล์ (row, col) — row=0 คือแถวสุดท้าย
    String readCell(int row=0, int col=1) {
        String url = _url + "?action=read&row=" + String(row) + "&col=" + String(col);
        return httpGet(url);
    }

    float readFloat(int row=0, int col=1) {
        return readCell(row, col).toFloat();
    }

    int readInt(int row=0, int col=1) {
        return readCell(row, col).toInt();
    }

private:
    String _url;

    String httpGet(const String& url) {
        if (WiFi.status() != WL_CONNECTED) return "";
        WiFiClientSecure client;
        client.setInsecure();
        HTTPClient https;
        https.begin(client, url);
        https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
        https.setTimeout(10000);
        int code = https.GET();
        String payload = "";
        if (code > 0) payload = https.getString();
        https.end();
        payload.trim();
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
