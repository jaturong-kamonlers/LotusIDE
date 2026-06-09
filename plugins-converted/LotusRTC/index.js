// DS1307 Real-Time Clock plugin. Adds a single-instance RTC backed by Wire,
// caches the read date so OLED loops don't thrash the I2C bus, and offers
// printf-free formatted time strings via inline character emission.

lotus.register({
  toolbox: { name: 'RTC', color: '#4FC3F7' },
  blocks: [
    { type: 'rtc_begin',  message0: '%1 Initialize RTC',         args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], previousStatement: null, nextStatement: null, colour: '#4FC3F7' },
    { type: 'rtc_update', message0: '%1 Read RTC (once per loop)', args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], previousStatement: null, nextStatement: null, colour: '#4FC3F7' },
    {
      type: 'rtc_format_time',
      message0: '%1 Time format %2',
      args0: [
        { type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' },
        { type: 'field_dropdown', name: 'FORMAT', options: [['HH:MM:SS','HH:MM:SS'],['HH:MM','HH:MM'],['MM:SS','MM:SS'],['DD/MM/YYYY','DD/MM/YYYY'],['DD/MM/YY','DD/MM/YY'],['YYYY-MM-DD','YYYY-MM-DD'],['DD/MM/YYYY HH:MM:SS','DD/MM/YYYY HH:MM:SS']] },
      ],
      inputsInline: true, output: 'String', colour: '#4FC3F7',
    },
    { type: 'rtc_get_year',   message0: '%1 Get YEAR',   args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'rtc_get_month',  message0: '%1 Get MONTH',  args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'rtc_get_day',    message0: '%1 Get DAY',    args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'rtc_get_hour',   message0: '%1 Get HOUR',   args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'rtc_get_minute', message0: '%1 Get MINUTE', args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'rtc_get_second', message0: '%1 Get SECOND', args0: [{ type: 'field_variable', name: 'RTC_INSTANCE', variable: 'RTC1' }], output: 'Number', colour: '#4FC3F7' },
    {
      type: 'rtc_zero_pad',
      message0: 'zero pad %1',
      args0: [{ type: 'input_value', name: 'VALUE', check: 'Number' }],
      inputsInline: true, output: 'String', colour: '#4FC3F7',
    },
  ],
  generators: {
    rtc_begin: `
      var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "RtcDS1307.h"\\n#include "RtcDateTime.h"\\n#include "RtcUtility.h"\\n#END\\n' +
        '#VARIABLE\\nRtcDS1307<TwoWire> ' + v + '(Wire);\\nstatic char _rtcBuf_' + v + '[20];\\n' +
        'static uint16_t _' + v + '_Y = 2000;\\nstatic uint8_t _' + v + '_Mo = 1;\\nstatic uint8_t _' + v + '_D = 1;\\n' +
        'static uint8_t _' + v + '_H = 0;\\nstatic uint8_t _' + v + '_Mi = 0;\\nstatic uint8_t _' + v + '_S = 0;\\n' +
        'static unsigned long _' + v + '_t = 0;\\n#END\\n' +
        '#FUNCTION\\n' +
        'void _rtcUpdate_' + v + '() {\\n' +
        '  RtcDateTime _dt = ' + v + '.GetDateTime();\\n' +
        '  _' + v + '_Y = _dt.Year(); _' + v + '_Mo = _dt.Month(); _' + v + '_D = _dt.Day();\\n' +
        '  _' + v + '_H = _dt.Hour(); _' + v + '_Mi = _dt.Minute(); _' + v + '_S = _dt.Second();\\n' +
        '}\\n' +
        'static void _p2_' + v + '(char* &p, uint8_t v) { *p++ = \\'0\\' + v/10; *p++ = \\'0\\' + v%10; }\\n' +
        'static void _p4_' + v + '(char* &p, uint16_t v) { *p++=\\'0\\'+v/1000; *p++=\\'0\\'+(v/100)%10; *p++=\\'0\\'+(v/10)%10; *p++=\\'0\\'+v%10; }\\n' +
        'const char* _rtcFmt_' + v + '(uint8_t f) {\\n' +
        '  char* p = _rtcBuf_' + v + ';\\n' +
        '  switch(f){case 0:_p2_' + v + '(p,_' + v + '_H);*p++=\\':\\';_p2_' + v + '(p,_' + v + '_Mi);*p++=\\':\\';_p2_' + v + '(p,_' + v + '_S);*p=0;break;\\n' +
        '    case 1:_p2_' + v + '(p,_' + v + '_H);*p++=\\':\\';_p2_' + v + '(p,_' + v + '_Mi);*p=0;break;\\n' +
        '    case 2:_p2_' + v + '(p,_' + v + '_Mi);*p++=\\':\\';_p2_' + v + '(p,_' + v + '_S);*p=0;break;\\n' +
        '    case 3:_p2_' + v + '(p,_' + v + '_D);*p++=\\'/\\';_p2_' + v + '(p,_' + v + '_Mo);*p++=\\'/\\';_p4_' + v + '(p,_' + v + '_Y);*p=0;break;\\n' +
        '    case 4:_p2_' + v + '(p,_' + v + '_D);*p++=\\'/\\';_p2_' + v + '(p,_' + v + '_Mo);*p++=\\'/\\';_p2_' + v + '(p,_' + v + '_Y%100);*p=0;break;\\n' +
        '    case 5:_p4_' + v + '(p,_' + v + '_Y);*p++=\\'-\\';_p2_' + v + '(p,_' + v + '_Mo);*p++=\\'-\\';_p2_' + v + '(p,_' + v + '_D);*p=0;break;\\n' +
        '    case 6:_p2_' + v + '(p,_' + v + '_D);*p++=\\'/\\';_p2_' + v + '(p,_' + v + '_Mo);*p++=\\'/\\';_p4_' + v + '(p,_' + v + '_Y);*p++=\\' \\';_p2_' + v + '(p,_' + v + '_H);*p++=\\':\\';_p2_' + v + '(p,_' + v + '_Mi);*p++=\\':\\';_p2_' + v + '(p,_' + v + '_S);*p=0;break;\\n' +
        '    default:_rtcBuf_' + v + '[0]=\\'?\\';_rtcBuf_' + v + '[1]=0;break;}\\n' +
        '  return _rtcBuf_' + v + ';\\n}\\n#END\\n' +
        '#SETUP\\n' + v + '.Begin();\\nif (!' + v + '.GetIsRunning()) ' + v + '.SetIsRunning(true);\\n' +
        'if (!' + v + '.IsDateTimeValid()) ' + v + '.SetDateTime(RtcDateTime(__DATE__, __TIME__));\\n' +
        '_rtcUpdate_' + v + '();\\n#END\\n'
      );
    `,
    rtc_update: `
      var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE');
      return 'if ((unsigned long)(millis() - _' + v + '_t) >= 1000UL) { _' + v + '_t = millis(); _rtcUpdate_' + v + '(); }\\n';
    `,
    rtc_format_time: `
      var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE');
      var map = { 'HH:MM:SS':'0','HH:MM':'1','MM:SS':'2','DD/MM/YYYY':'3','DD/MM/YY':'4','YYYY-MM-DD':'5','DD/MM/YYYY HH:MM:SS':'6' };
      var idx = map[block.getFieldValue('FORMAT')] || '0';
      return ['_rtcFmt_' + v + '(' + idx + ')', 0];
    `,
    rtc_get_year:   "var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE'); return ['_' + v + '_Y',  0];",
    rtc_get_month:  "var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE'); return ['_' + v + '_Mo', 0];",
    rtc_get_day:    "var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE'); return ['_' + v + '_D',  0];",
    rtc_get_hour:   "var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE'); return ['_' + v + '_H',  0];",
    rtc_get_minute: "var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE'); return ['_' + v + '_Mi', 0];",
    rtc_get_second: "var v = generator.nameDB_.getName(block.getFieldValue('RTC_INSTANCE'), 'VARIABLE'); return ['_' + v + '_S',  0];",
    rtc_zero_pad: `
      var val = generator.valueToCode(block, 'VALUE', 0) || '0';
      return ['((_rtcBuf_RTC1[0]=\\'0\\'+((int)(' + val + '))/10, _rtcBuf_RTC1[1]=\\'0\\'+((int)(' + val + '))%10, _rtcBuf_RTC1[2]=0), _rtcBuf_RTC1)', 0];
    `,
  },
})
