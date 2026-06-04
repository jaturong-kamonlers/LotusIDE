import * as Blockly from 'blockly'

// Compatibility block — originally from kidbright, referenced by board OLED configs
Blockly.Blocks['basic_string'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldTextInput('Hello World!'), 'VALUE')
    this.setOutput(true, 'String')
    this.setColour(160)
    this.setTooltip('Text string value')
    this.setHelpUrl('')
  }
}

const BAUD_RATES = [
  ['9600', '9600'],
  ['115200', '115200'],
  ['4800', '4800'],
  ['19200', '19200'],
  ['38400', '38400'],
  ['57600', '57600'],
  ['250000', '250000'],
]

const SERIAL_PORTS = [
  ['Serial (USB)', 'Serial'],
  ['Serial1', 'Serial1'],
  ['Serial2', 'Serial2'],
  ['Serial3', 'Serial3'],
]

// ── Serial blocks (port-selectable) ───────────────────────────────────────────

Blockly.Blocks['lotus_serial_begin'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('begin')
      .appendField(new Blockly.FieldDropdown(BAUD_RATES), 'baudrate')
      .appendField('baud')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#43A047')
    this.setTooltip('Initialize serial port — put this in setup block')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_serial_println'] = {
  init() {
    this.appendValueInput('value')
      .setCheck(null)
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('println')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#43A047')
    this.setTooltip('Print value and newline')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_serial_print'] = {
  init() {
    this.appendValueInput('value')
      .setCheck(null)
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('print')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#43A047')
    this.setTooltip('Print value without newline')
    this.setHelpUrl('')
  }
}

// ── Serial Read ────────────────────────────────────────────────────────────────

Blockly.Blocks['lotus_serial_available'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('available')
    this.setOutput(true, 'Boolean')
    this.setColour('#43A047')
    this.setTooltip('Returns true if data is waiting in the serial buffer')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_serial_read_line'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('read line')
    this.setOutput(true, 'String')
    this.setColour('#43A047')
    this.setTooltip('Read a full line of text (readStringUntil newline)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_serial_read_int'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('read int')
    this.setOutput(true, 'Number')
    this.setColour('#43A047')
    this.setTooltip('Read an integer number from serial (parseInt)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_serial_read_byte'] = {
  init() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown(SERIAL_PORTS), 'port')
      .appendField('read byte')
    this.setOutput(true, 'Number')
    this.setColour('#43A047')
    this.setTooltip('Read one raw byte — returns -1 if no data (read())')
    this.setHelpUrl('')
  }
}
