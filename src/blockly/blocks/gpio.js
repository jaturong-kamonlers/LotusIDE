import * as Blockly from 'blockly'

Blockly.Blocks['lotus_gpio_level'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['HIGH', 'HIGH'],
        ['LOW', 'LOW'],
      ]), 'LEVEL')
    this.setOutput(true, ['Number', 'Boolean'])
    this.setColour('#F57F17')
    this.setTooltip('HIGH (1) or LOW (0) signal level')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_set_mode'] = {
  init() {
    this.appendValueInput('pin')
      .setCheck('Number')
      .appendField('set pin')
    this.appendDummyInput()
      .appendField('as')
      .appendField(new Blockly.FieldDropdown([
        ['OUTPUT', 'OUTPUT'],
        ['INPUT', 'INPUT'],
        ['INPUT_PULLUP', 'INPUT_PULLUP'],
      ]), 'mode')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#F57F17')
    this.setTooltip('Set GPIO pin mode (pinMode)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_digital_read'] = {
  init() {
    this.appendValueInput('pin')
      .setCheck('Number')
      .appendField('digital read pin')
    this.setInputsInline(true)
    this.setOutput(true, 'Number')
    this.setColour('#F57F17')
    this.setTooltip('Read digital value from pin (HIGH=1 / LOW=0)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_digital_write'] = {
  init() {
    this.appendValueInput('pin')
      .setCheck('Number')
      .appendField('digital write pin')
    this.appendValueInput('value')
      .setCheck(['Number', 'Boolean'])
      .appendField('value')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#F57F17')
    this.setTooltip('Write digital value (HIGH/LOW) to pin')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_analog_read'] = {
  init() {
    this.appendValueInput('pin')
      .setCheck('Number')
      .appendField('analog read pin')
    this.setInputsInline(true)
    this.setOutput(true, 'Number')
    this.setColour('#F57F17')
    this.setTooltip('Read analog value from pin (0–1023 Arduino / 0–4095 ESP32)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_dac_write'] = {
  init() {
    this.appendDummyInput()
      .appendField('DAC write pin')
      .appendField(new Blockly.FieldDropdown([
        ['DAC1 (GPIO25)', '25'],
        ['DAC2 (GPIO26)', '26'],
      ]), 'pin')
    this.appendValueInput('value')
      .setCheck('Number')
      .appendField('value (0-255)')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#F57F17')
    this.setTooltip('True analog output via DAC — ESP32 only (GPIO25/GPIO26)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_pwm_write'] = {
  init() {
    this.appendValueInput('pin')
      .setCheck('Number')
      .appendField('PWM write pin')
    this.appendValueInput('value')
      .setCheck('Number')
      .appendField('value (0-255)')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#F57F17')
    this.setTooltip('Write PWM value 0-255 to pin (analogWrite)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_pulse_in'] = {
  init() {
    this.appendValueInput('pin')
      .setCheck('Number')
      .appendField('pulse in pin')
    this.appendDummyInput()
      .appendField('state')
      .appendField(new Blockly.FieldDropdown([
        ['HIGH', '1'],
        ['LOW', '0'],
      ]), 'state')
      .appendField('timeout (ms)')
      .appendField(new Blockly.FieldNumber(1000, 1, 60000), 'timeout')
    this.setInputsInline(true)
    this.setOutput(true, 'Number')
    this.setColour('#F57F17')
    this.setTooltip('Measure pulse width in microseconds (pulseIn)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_shift_in'] = {
  init() {
    this.appendDummyInput()
      .appendField('shift in  data pin')
      .appendField(new Blockly.FieldNumber(12, 0, 50), 'data_pin')
      .appendField('clock pin')
      .appendField(new Blockly.FieldNumber(13, 0, 50), 'clock_pin')
      .appendField('bit order')
      .appendField(new Blockly.FieldDropdown([
        ['MSB first', 'MSBFIRST'],
        ['LSB first', 'LSBFIRST'],
      ]), 'bit_order')
    this.setOutput(true, 'Number')
    this.setColour('#F57F17')
    this.setTooltip('Read 8-bit data using shift-in (shiftIn)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_gpio_shift_out'] = {
  init() {
    this.appendValueInput('data')
      .setCheck('Number')
      .appendField('shift out data')
    this.appendDummyInput()
      .appendField('data pin')
      .appendField(new Blockly.FieldNumber(12, 0, 50), 'data_pin')
      .appendField('clock pin')
      .appendField(new Blockly.FieldNumber(13, 0, 50), 'clock_pin')
      .appendField('bit order')
      .appendField(new Blockly.FieldDropdown([
        ['MSB first', 'MSBFIRST'],
        ['LSB first', 'LSBFIRST'],
      ]), 'bit_order')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#F57F17')
    this.setTooltip('Write 8-bit data using shift-out (shiftOut)')
    this.setHelpUrl('')
  }
}
