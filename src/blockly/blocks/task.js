import * as Blockly from 'blockly'

// FreeRTOS-based multitasking blocks. ESP32 only (LotusDevkit / LotusDevkit4Wheels).
// Toolbox category is filtered out of non-ESP32 boards in BlocklyEditor.loadBoardBlocks.
const TASK_COLOUR = '#7E57C2'

Blockly.Blocks['lotus_task_create'] = {
  init() {
    this.appendDummyInput()
      .appendField('Create Task')
      .appendField(new Blockly.FieldTextInput('task1'), 'NAME')
      .appendField('on')
      .appendField(new Blockly.FieldDropdown([
        ['Core 0', '0'],
        ['Core 1', '1'],
      ]), 'CORE')
    this.appendStatementInput('BODY').setCheck(null).appendField('do')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour(TASK_COLOUR)
    this.setTooltip('Create a FreeRTOS task that runs forever in parallel on the chosen ESP32 core')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_task_delay'] = {
  init() {
    this.appendValueInput('MS').setCheck('Number').appendField('Task Delay')
    this.appendDummyInput().appendField('ms')
    this.setInputsInline(true)
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour(TASK_COLOUR)
    this.setTooltip('Yield to other tasks for the given milliseconds (vTaskDelay)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_task_suspend'] = {
  init() {
    this.appendDummyInput()
      .appendField('Suspend Task')
      .appendField(new Blockly.FieldTextInput('task1'), 'NAME')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour(TASK_COLOUR)
    this.setTooltip('Pause the named task (resume with Resume Task)')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_task_resume'] = {
  init() {
    this.appendDummyInput()
      .appendField('Resume Task')
      .appendField(new Blockly.FieldTextInput('task1'), 'NAME')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour(TASK_COLOUR)
    this.setTooltip('Resume a previously suspended task')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_task_delete'] = {
  init() {
    this.appendDummyInput()
      .appendField('Delete Task')
      .appendField(new Blockly.FieldTextInput('task1'), 'NAME')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour(TASK_COLOUR)
    this.setTooltip('Permanently stop and free the named task')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_task_delete_self'] = {
  init() {
    this.appendDummyInput().appendField('Delete This Task')
    this.setPreviousStatement(true, null)
    this.setNextStatement(true, null)
    this.setColour(TASK_COLOUR)
    this.setTooltip('Delete the currently running task — call from inside a task body')
    this.setHelpUrl('')
  }
}

Blockly.Blocks['lotus_task_current_core'] = {
  init() {
    this.appendDummyInput().appendField('Current Core')
    this.setOutput(true, 'Number')
    this.setColour(TASK_COLOUR)
    this.setTooltip('Returns 0 or 1 — the ESP32 core currently executing this code')
    this.setHelpUrl('')
  }
}
