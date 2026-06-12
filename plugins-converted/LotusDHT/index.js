// DHT family temperature + humidity sensor plugin.
// Reads once every 2 seconds (sensor minimum sample period). The cached
// values stay valid between reads so user blocks can pull them freely.

lotus.register({
  toolbox: { name: 'DHT', color: '#4DD0E1' },
  blocks: [
    {
      type: 'dhtesp_setup',
      message0: '%1 Setup %2 pin %3',
      args0: [
        { type: 'field_variable', name: 'instance', variable: 'DhtSensor1' },
        { type: 'field_dropdown', name: 'dht_type', options: [['DHT11','DHTesp::DHT11'],['DHT22','DHTesp::DHT22'],['AM2302','DHTesp::AM2302'],['RHT03','DHTesp::RHT03']] },
        { type: 'field_number', name: 'pin', value: 4, min: 0, max: 50, precision: 1 },
      ],
      inputsInline: true,
      previousStatement: null, nextStatement: null,
      colour: '#4DD0E1',
      tooltip: 'Setup DHT sensor (place in Setup)',
    },
    {
      type: 'dhtesp_update',
      message0: '%1 Read DHT (once per loop)',
      args0: [{ type: 'field_variable', name: 'instance', variable: 'DhtSensor1' }],
      inputsInline: true,
      previousStatement: null, nextStatement: null,
      colour: '#4DD0E1',
      tooltip: 'Sample sensor - call at the top of loop()',
    },
    { type: 'dhtesp_read_temp',  message0: '%1 Temperature Â°C', args0: [{ type: 'field_variable', name: 'instance', variable: 'DhtSensor1' }], output: 'Number', colour: '#4DD0E1' },
    { type: 'dhtesp_read_humid', message0: '%1 Humidity %',     args0: [{ type: 'field_variable', name: 'instance', variable: 'DhtSensor1' }], output: 'Number', colour: '#4DD0E1' },
  ],
  generators: {
    dhtesp_setup: `
      var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE');
      var dhtType = block.getFieldValue('dht_type');
      var pin = block.getFieldValue('pin');
      return (
        '#EXTINC\\n#include <Wire.h>\\n#include "DHTesp.h"\\n#END\\n' +
        '#VARIABLE\\nDHTesp ' + v + ';\\n' +
        'float _' + v + '_temp = 0;\\nfloat _' + v + '_humi = 0;\\n' +
        'unsigned long _' + v + '_t = 0;\\n#END\\n' +
        '#SETUP\\npinMode(' + pin + ', INPUT_PULLUP);\\n' +
        v + '.setup(' + pin + ', ' + dhtType + ');\\n#END\\n'
      );
    `,
    dhtesp_update: `
      var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE');
      return 'if ((unsigned long)(millis() - _' + v + '_t) >= 2000UL) {\\n' +
        '  _' + v + '_t = millis();\\n' +
        '  TempAndHumidity _r = ' + v + '.getTempAndHumidity();\\n' +
        '  _' + v + '_temp = _r.temperature;\\n' +
        '  _' + v + '_humi = _r.humidity;\\n}\\n';
    `,
    dhtesp_read_temp:  "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return ['_' + v + '_temp', 0];",
    dhtesp_read_humid: "var v = generator.nameDB_.getName(block.getFieldValue('instance'), 'VARIABLE'); return ['_' + v + '_humi', 0];",
  },
})
