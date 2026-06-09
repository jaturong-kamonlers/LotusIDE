lotus.register({
  toolbox: { name: 'DS18B20', color: '#4FC3F7' },
  blocks: [
    {
      type: 'ds18b20_setup',
      message0: '%1 Setup DS18B20 pin %2',
      args0: [
        { type: 'field_variable', name: 'instance', variable: 'DS18B201' },
        { type: 'field_number', name: 'pin', value: 2, min: 0, max: 50, precision: 1 },
      ],
      inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7',
    },
    { type: 'ds18b20_update', message0: '%1 Read DS18B20 (once per loop)', args0: [{ type: 'field_variable', name: 'instance', variable: 'DS18B201' }], inputsInline: true, previousStatement: null, nextStatement: null, colour: '#4FC3F7' },
    { type: 'ds18b20_read_temp',   message0: '%1 Temperature °C', args0: [{ type: 'field_variable', name: 'instance', variable: 'DS18B201' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'ds18b20_read_temp_f', message0: '%1 Temperature °F', args0: [{ type: 'field_variable', name: 'instance', variable: 'DS18B201' }], output: 'Number', colour: '#4FC3F7' },
    { type: 'ds18b20_get_device_count', message0: '%1 number of devices', args0: [{ type: 'field_variable', name: 'instance', variable: 'DS18B201' }], output: 'Number', colour: '#4FC3F7' },
  ],
  generators: {
    ds18b20_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE');
      var pin = block.getFieldValue('pin');
      return (
        '#EXTINC\\n#include <OneWire.h>\\n#include <DallasTemperature.h>\\n#END\\n' +
        '#VARIABLE\\nOneWire _oneWire_' + v + '(' + pin + ');\\n' +
        'DallasTemperature _ds_' + v + '(&_oneWire_' + v + ');\\n' +
        'float _' + v + '_temp = 0;\\n' +
        'uint8_t _' + v + '_count = 0;\\n' +
        'unsigned long _' + v + '_t = 0;\\n' +
        'bool _' + v + '_requested = false;\\n#END\\n' +
        '#SETUP\\n_ds_' + v + '.begin();\\n_ds_' + v + '.setWaitForConversion(false);\\n' +
        '_' + v + '_count = _ds_' + v + '.getDeviceCount();\\n' +
        '_ds_' + v + '.requestTemperatures();\\n' +
        '_' + v + '_requested = true;\\n_' + v + '_t = millis();\\n#END\\n'
      );
    `,
    ds18b20_update: `
      var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE');
      return 'if (_' + v + '_requested) {\\n' +
        '  if ((unsigned long)(millis() - _' + v + '_t) >= 800UL) {\\n' +
        '    _' + v + '_temp = _ds_' + v + '.getTempCByIndex(0);\\n' +
        '    _ds_' + v + '.requestTemperatures();\\n' +
        '    _' + v + '_t = millis();\\n' +
        '  }\\n} else {\\n' +
        '  _ds_' + v + '.requestTemperatures();\\n' +
        '  _' + v + '_requested = true;\\n' +
        '  _' + v + '_t = millis();\\n}\\n';
    `,
    ds18b20_read_temp:   "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return ['_' + v + '_temp', 0];",
    ds18b20_read_temp_f: "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return ['(_' + v + '_temp * 9.0 / 5.0 + 32.0)', 0];",
    ds18b20_get_device_count: "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return ['_' + v + '_count', 0];",
  },
})
