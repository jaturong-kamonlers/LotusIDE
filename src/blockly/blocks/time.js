import * as Blockly from 'blockly'

Blockly.Blocks['lotus_time_delay'] = {
  init() {
    this.appendValueInput('delay')
      .setCheck('Number')
      .appendField('delay')
    this.appendDummyInput()
      .appendField('milliseconds')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#039BE5')
    this.setTooltip('Pause for given milliseconds (delay)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_time_delay_us'] = {
  init() {
    this.appendValueInput('delay')
      .setCheck('Number')
      .appendField('delay')
    this.appendDummyInput()
      .appendField('microseconds')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#039BE5')
    this.setTooltip('Pause for given microseconds (delayMicroseconds)')
    this.setHelpUrl('')
  }
}

const TIMER_SLOTS = [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]
const TIMER_UNITS = [['ms', 'ms'], ['s', 's'], ['µs', 'us']]

Blockly.Blocks['lotus_timer_start'] = {
  init() {
    this.appendDummyInput()
      .appendField('start timer')
      .appendField(new Blockly.FieldDropdown(TIMER_SLOTS), 'SLOT')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#039BE5')
    this.setTooltip('Start or reset a timer slot (1–4)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_timer_within'] = {
  init() {
    this.appendDummyInput()
      .appendField('within')
      .appendField(new Blockly.FieldNumber(30000, 1, Infinity, 1), 'DURATION')
      .appendField(new Blockly.FieldDropdown(TIMER_UNITS), 'UNIT')
      .appendField('timer')
      .appendField(new Blockly.FieldDropdown(TIMER_SLOTS), 'SLOT')
    this.setOutput(true, 'Boolean')
    this.setColour('#039BE5')
    this.setTooltip('Returns true while elapsed time since timer start is within the duration')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_time_millis'] = {
  init() {
    this.appendDummyInput()
      .appendField('timestamp (ms)')
    this.setOutput(true, 'Number')
    this.setColour('#039BE5')
    this.setTooltip('Returns milliseconds since program started (millis())')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_time_micros'] = {
  init() {
    this.appendDummyInput()
      .appendField('timestamp (µs)')
    this.setOutput(true, 'Number')
    this.setColour('#039BE5')
    this.setTooltip('Returns microseconds since program started (micros())')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_time_loop_for'] = {
  init() {
    this.appendValueInput('DURATION')
      .setCheck('Number')
      .appendField('repeat for')
    this.appendDummyInput()
      .appendField('milliseconds, do')
    this.appendStatementInput('DO')
      .setCheck(null)
    this.setInputsInline(false)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour('#039BE5')
    this.setTooltip('Repeat code for the given duration in milliseconds')
    this.setHelpUrl('')
  }
}
