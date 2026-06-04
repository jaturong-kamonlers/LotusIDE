module.exports = function(Blockly) {
  "use strict";
	
  Blockly.JavaScript["blynk_iot_setup_code"] = function(block) {
    var server = block.getFieldValue('server');
	var port = block.getFieldValue('port');
	var token = block.getFieldValue('token');
	var ssid = block.getFieldValue('ssid');
	var pass = block.getFieldValue('pass') || 'password';
  
    let code = `#EXTINC
	#include "WiFiManager.h"
	#include "ArduinoJson.h"
	#include "BlynkSimpleEsp32.h"
	#END
	
	#VARIABLE 
	#define BLYNK_DEBUG
	#define BLYNK_PRINT Serial
	
	int blynkIsDownCount = 0;
	BlynkTimer timer;
	char blynk_token[34] = "${token}";
	bool shouldSaveConfig = false;
	char server[] = "${server}";
	int port = ${port};
	int i_count;
	#END
	
	#FUNCTION
	void saveConfigCallback() {
	  Serial.println("Should save config");
	  shouldSaveConfig = true;
	  return;
	}
	void reconnecting() {
	  if (!Blynk.connected()) {
		blynkIsDownCount++;
		BLYNK_LOG("blynk server is down! %d  times", blynkIsDownCount);
		Serial.println("Reconnect to Blynk server.");
		Blynk.connect(5000);
	  }
	  return;
	}
	#END
	
	Serial.begin(115200);
	display.setFont(ArialMT_Plain_10);
	display.drawString(0, 0, String(String("Reading config.")));
	display.display();
	Serial.println("mounting FS...");
	if (SPIFFS.begin(true)) {
		Serial.println("mounted file system");
		if (SPIFFS.exists("/config.json")) {
		  Serial.println("reading config file");
		  File configFile = SPIFFS.open("/config.json", "r");
		  if (configFile) {
			Serial.println("opened config file");
			size_t size = configFile.size();
			std::unique_ptr<char[]> buf(new char[size]);
			configFile.readBytes(buf.get(), size);
			DynamicJsonBuffer jsonBuffer;
			JsonObject& json = jsonBuffer.parseObject(buf.get());
			json.printTo(Serial);
			if (json.success()) {
			  Serial.println("\\nparsed json");
			  strcpy(blynk_token, json["blynk_token"]);
			} else {
			  Serial.println("failed to load json config");
			}
		  }
		}
	  } else {
		Serial.println("failed to mount FS");
	  }
	  Serial.println(blynk_token);
	  WiFiManagerParameter custom_blynk_token("blynk", "blynk token", blynk_token,34);
	  WiFiManager wifiManager;
	  wifiManager.setSaveConfigCallback(saveConfigCallback);
	  wifiManager.addParameter(&custom_blynk_token);
	  
	  display.drawString(0, 12, String(String("Wait reset (Left Button).")));
	  display.display();
	  for (i_count = 1; i_count <= 5; i_count++) {
		delay(1000);
		Serial.println("Wait " + String(i_count) + " ");
	  }
	  if ((botton.digitalRead(P2)) == 1) {
		Serial.println("Reset Button Pressed");
		wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
		esp_wifi_init(&cfg);
		delay(2000);
		if (esp_wifi_restore() != ESP_OK) {
		  Serial.println("WiFi is not initialized by esp_wifi_init ");
		} else {
		  Serial.println("WiFi Configurations Cleared!");
		}
	  }

	  
	  display.drawString(0, 24, String(String("Config http://192.168.4.1")));
	
	  
	  display.drawString(0, 36, String(String("Connecting ...")));
	  display.display();
	  wifiManager.setTimeout(180);
	  if (!wifiManager.autoConnect("${ssid}@192.168.4.1")) {
		Serial.println("failed to connect, timeout");
		delay(3000);
		ESP.restart();
		delay(5000);
	  }
	  Serial.println("Connected ... OK!)");
	  
	  display.drawString(0, 48, String(String("Connected ... Online!")));
	  display.display();
	  strcpy(blynk_token, custom_blynk_token.getValue());
	  if (shouldSaveConfig) {
		Serial.println("saving config");
		DynamicJsonBuffer jsonBuffer;
		JsonObject& json = jsonBuffer.createObject();
		json["blynk_token"] = blynk_token;
		File configFile = SPIFFS.open("/config.json", "w");
		if (!configFile) {
		  Serial.println("failed to open config file for writing");
		}
		json.printTo(Serial);
		json.printTo(configFile);
		configFile.close();
	  }
	  Serial.println("Local ip");
	  delay(100);
	  Serial.println(WiFi.localIP());
	  Serial.println(WiFi.gatewayIP());
	  Serial.println(WiFi.subnetMask());
	  Blynk.config(blynk_token, server, port);
	  timer.setInterval(30000L, reconnecting);
	`;
    return code;
  };
  
  Blockly.JavaScript["blynk_iot_run"] = function(block) {
    let code = `
	  if (Blynk.connected()) {
		Blynk.run();
	  }
	  timer.run();`;
    return code;
  };
  
  Blockly.JavaScript["usb_out_on"] = function(block) {
    let code = `digitalWrite(USB_OUT,HIGH);`;
    return code;
  };
  
  Blockly.JavaScript["usb_out_off"] = function(block) {
    let code = `digitalWrite(USB_OUT,LOW);`;
    return code;
  };
  
  Blockly.JavaScript["http_post_data"] = function(block) {
	var url = block.getFieldValue('http_url');
	var data = block.getFieldValue('data');
	
    let code = `
	  #EXTINC
	  #include <HTTPClient.h>
	  #END
	  #FUNCTION
	  void http_post_data(String post_url, String post_data) {
		HTTPClient http;
		
		Serial.println("[HTTP] begin...");
		http.begin(post_url);
		
		Serial.println("[HTTP] POST...");
		Serial.println("POST URL: " + post_url);
		Serial.println("POST DATA: " + post_data);
		
		http.addHeader("Content-Type", "application/x-www-form-urlencoded");
		int httpCode = http.POST(post_data);
		
		
		if (httpCode > 0) {
			Serial.printf("[HTTP] POST... code: %d\\n", httpCode);
			Serial.println("");
			if (httpCode == HTTP_CODE_OK) {
			  String payload = http.getString();
			  Serial.println(payload);
			}
		} else {
			Serial.printf("[HTTP] POST... failed, error: %s\\n", http.errorToString(httpCode).c_str());
		}

		 http.end(); 
	  }
	  #END
	  http_post_data("${url}","${data}");
	  `;
    return code;
  };
  
    Blockly.JavaScript["http_get_data"] = function(block) {
	var url = block.getFieldValue('http_url');
	
    let code = `
	  #EXTINC
	  #include <HTTPClient.h>
	  #END
	  #FUNCTION
	  void http_get_data(String get_url) {
		HTTPClient http;
		
		Serial.println("[HTTP] begin...");
		http.begin(get_url);
		
		Serial.println("[HTTP] GET...");
		Serial.println("GET URL: " + get_url);
		
		int httpCode = http.GET();
		
		
		if (httpCode > 0) {
			Serial.printf("[HTTP] GET... code: %d\\n", httpCode);
			Serial.println("");
			if (httpCode == HTTP_CODE_OK) {
			  String payload = http.getString();
			  Serial.println(payload);
			}
		} else {
			Serial.printf("[HTTP] GET... failed, error: %s\\n", http.errorToString(httpCode).c_str());
		}

		 http.end(); 
	  }
	  #END
	  http_get_data("${url}");
	  `;
    return code;
  };
  
  Blockly.JavaScript["pms_dust_setup"] = function(block) {
    var rx = block.getFieldValue('rx');
	var tx = block.getFieldValue('tx');
  
    let code = `
		#EXTINC
		#include "PMS.h"
		#END
		#VARIABLE 
		HardwareSerial SerialPMS(1);
		PMS pms(SerialPMS);
		PMS::DATA data;
		
		int pm10,pm25,pm100;
		
		#define RXD2 ${rx}
		#define TXD2 ${tx}

		#END
		SerialPMS.begin(9600, SERIAL_8N1, RXD2, TXD2);
	  `;
    return code;
  };
  
  Blockly.JavaScript["pms_dust_read"] = function(block) {
  
    let code = `
		if(pms.read(data)){
			pm10 = data.PM_AE_UG_1_0;
			pm25 = data.PM_AE_UG_2_5;
			pm100 = data.PM_AE_UG_10_0;
		}
	  `;
    return code;
  };
  
  Blockly.JavaScript["pms_dust_read_pm10"] = function(block) {
    let code = `pm10`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };
  
  Blockly.JavaScript["pms_dust_read_pm25"] = function(block) {
    let code = `pm25`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };
  
  Blockly.JavaScript["pms_dust_read_pm100"] = function(block) {
    let code = `pm100`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };
  
  Blockly.JavaScript["arduino_include_file"] = function(block) {
    var myFile = block.getFieldValue('INC');
  
    let code = `#EXTINC#include "${myFile}"#END`;
    return code;
  };
  
  Blockly.JavaScript["arduino_default_include_file"] = function(block) {
    var myFile = block.getFieldValue('DINC');
  
    let code = `#EXTINC#include <${myFile}>#END`;
    return code;
  };
  
  Blockly.JavaScript["arduino_global_var"] = function(block) {
    var myVar = block.getFieldValue('VAR');
  
    let code = `#VARIABLE ${myVar}#END`;
    return code;
  };
  
  Blockly.JavaScript["arduino_custom_code"] = function(block) {
    var myCode = block.getFieldValue('CUSTOM_CODE');
  
    let code = `${myCode}`;
    return code;
  };
  Blockly.JavaScript["arduino_custom_return_float"] = function(block) {
    var myCode = block.getFieldValue('CUSTOM_CODE_VALUE');
  
    let code = `${myCode}`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };
  
  Blockly.JavaScript["arduino_custom_return_int"] = function(block) {
    var myCode = block.getFieldValue('CUSTOM_CODE_VALUE');
  
    let code = `${myCode}`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };
  
  Blockly.JavaScript["io_map_value"] = function(block) {
    var map_value = Blockly.JavaScript.valueToCode(block, 'number', Blockly.JavaScript.ORDER_ATOMIC);
	var value_x1 = Blockly.JavaScript.valueToCode(block, 'x1', Blockly.JavaScript.ORDER_ATOMIC);
	var value_y1 = Blockly.JavaScript.valueToCode(block, 'y1', Blockly.JavaScript.ORDER_ATOMIC);
	var value_x2 = Blockly.JavaScript.valueToCode(block, 'x2', Blockly.JavaScript.ORDER_ATOMIC);
	var value_y2 = Blockly.JavaScript.valueToCode(block, 'y2', Blockly.JavaScript.ORDER_ATOMIC);
  
    let code = `map(${map_value},${value_x1},${value_y1},${value_x1},${value_y2})`;
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  };
  
};
