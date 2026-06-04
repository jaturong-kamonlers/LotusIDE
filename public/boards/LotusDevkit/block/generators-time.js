module.exports = function(Blockly){
'use strict';

Blockly.JavaScript['mcp7941_rtc_set_datetime'] = function (block) {
	var dropdown_dayofweek= block.getFieldValue('DOW');
	var dropdown_year = block.getFieldValue('YEAR');
	var dropdown_month = block.getFieldValue('MONTH');
	var dropdown_day = block.getFieldValue('DAY');
	var dropdown_hour = block.getFieldValue('HOUR');
	var dropdown_minute = block.getFieldValue('MINUTE');
	var dropdown_secound = block.getFieldValue('SECOND');
	var code = `rtc.setDateTime(${dropdown_secound}, ${dropdown_minute}, ${dropdown_hour}, ${dropdown_dayofweek}, ${dropdown_day}, ${dropdown_month}, ${dropdown_year});\n`;
	return code;
};

Blockly.JavaScript['mcp7941_rtc_get_dayOfWeek'] = function (block) {
	var code = `rtc.getDayofWeek()`;
	return [code, Blockly.JavaScript.ORDER_NONE];
};


Blockly.JavaScript['mcp7941_rtc_get_hour'] = function (block) {
	var code = `rtc.getHour()`;
	return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['mcp7941_rtc_get_minute'] = function (block) {
	var code = `rtc.getMinute()`;
	return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['mcp7941_rtc_get_second'] = function (block) {
	var code = `rtc.getSecond()`;
	return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['mcp7941_rtc_get_day'] = function (block) {
	var code = `rtc.getDay()`;
	return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript['mcp7941_rtc_get_month'] = function (block) {
	var code = `rtc.getMonth()`;		
	return [code, Blockly.JavaScript.ORDER_NONE];
};
Blockly.JavaScript['mcp7941_rtc_get_year'] = function (block) {
	var code = `rtc.getYear()`;	
	return [code, Blockly.JavaScript.ORDER_NONE];
};

// RTC blocks are handled by lt_ds1307_* (active in blocks_sensors_new.js /
// generators_sensors_new.js). The legacy mcp7940n_* generators that used to
// live here were commented out and removed 2026-05-29.
};