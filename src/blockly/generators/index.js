import { javascriptGenerator, Order } from 'blockly/javascript'

// Extract legacy preprocessing markers from a code string.
// Mutates the four collector sets/arrays and returns the cleaned string.
// Markers supported (from old LotusIDE board generators):
//   #EXTINC ... #END   → #include directives (deduplicated)
//   #VARIABLE ... #END → global variable/define declarations (deduplicated)
//   #SETUP ... #END    → statements injected at the top of setup()
//   #FUNCTION ... #END → free function definitions placed before setup()
function _extractMarkers(text, includes, globals, setupInits, functions) {
  text = text.replace(/#EXTINC([\s\S]*?)#END/g, (_, c) => { const t = c.trim(); if (t) includes.add(t); return '' })
  text = text.replace(/#VARIABLE([\s\S]*?)#END/g, (_, c) => { const t = c.trim(); if (t) globals.add(t); return '' })
  text = text.replace(/#SETUP([\s\S]*?)#END/g,    (_, c) => { const t = c.trim(); if (t) setupInits.push(t); return '' })
  text = text.replace(/#FUNCTION([\s\S]*?)#END/g, (_, c) => { const t = c.trim(); if (t) functions.push(t); return '' })
  return text
}

// Override finish() to produce Arduino C++ structure
javascriptGenerator.finish = function(code) {
  // ── Collect legacy markers ────────────────────────────────────────────────
  const includes   = new Set()   // #include directives (deduplicated)
  const globals    = new Set()   // global var/define declarations (deduplicated)
  const setupInits = []          // statements to prepend to setup()
  const functions  = []          // free function definitions

  let setupBody = _extractMarkers(this.definitions_?.['__lotus_setup__'] || '', includes, globals, setupInits, functions)
  let loopBody  = _extractMarkers(this.definitions_?.['__lotus_loop__']  || '', includes, globals, setupInits, functions)
  code = _extractMarkers(code, includes, globals, setupInits, functions)

  const hasSetup = '__lotus_setup__' in (this.definitions_ || {})
  const hasLoop  = '__lotus_loop__'  in (this.definitions_ || {})

  if (this.definitions_) {
    delete this.definitions_['__lotus_setup__']
    delete this.definitions_['__lotus_loop__']
    // Strip Blockly's default JavaScript "var X, Y;" declaration — variables_set
    // emits a typed C++ declaration on first assignment instead.
    delete this.definitions_['variables']
  }

  const defs = this.definitions_
    ? Object.values(this.definitions_).map(d => _extractMarkers(d, includes, globals, setupInits, functions))
    : []

  if (this.nameDB_) this.nameDB_.reset()
  this.definitions_   = Object.create(null)
  this.functionNames_ = Object.create(null)

  // ── Assemble output ───────────────────────────────────────────────────────
  let result = ''
  if (includes.size)  result += [...includes].join('\n')  + '\n\n'
  if (globals.size)   result += [...globals].join('\n')   + '\n\n'
  if (defs.length)    result += defs.join('\n')           + '\n\n'
  if (functions.length) result += functions.join('\n\n')  + '\n\n'

  if (!hasSetup && !hasLoop && !setupInits.length) {
    return result + code
  }

  const fullSetup = setupInits.join('\n') + (setupInits.length && setupBody.trim() ? '\n' : '') + setupBody
  result += 'void setup() {\n' + fullSetup + '}\n\n'
  result += 'void loop() {\n'  + loopBody  + '}\n'
  if (code.trim()) result += '\n// (orphaned blocks)\n' + code
  return result
}

const fb = javascriptGenerator.forBlock

// ── Arduino structure ──────────────────────────────────────────────────────────

fb['lotus_setup'] = function(block) {
  javascriptGenerator.definitions_['__lotus_setup__'] =
    javascriptGenerator.statementToCode(block, 'code')
  return ''
}

fb['lotus_loop'] = function(block) {
  javascriptGenerator.definitions_['__lotus_loop__'] =
    javascriptGenerator.statementToCode(block, 'code')
  return ''
}

fb['lotus_forever'] = function(block) {
  const body = javascriptGenerator.statementToCode(block, 'HANDLER')
  return 'while (true) {\n' + body + '}\n'
}

// ── GPIO ───────────────────────────────────────────────────────────────────────

fb['lotus_gpio_level'] = function(block) {
  return [block.getFieldValue('LEVEL'), Order.ATOMIC]
}

fb['lotus_gpio_set_mode'] = function(block) {
  const pin  = javascriptGenerator.valueToCode(block, 'pin', Order.ATOMIC) || '0'
  const mode = block.getFieldValue('mode')
  return `pinMode(${pin}, ${mode});\n`
}

fb['lotus_gpio_digital_read'] = function(block) {
  const pin = javascriptGenerator.valueToCode(block, 'pin', Order.ATOMIC) || '0'
  return [`digitalRead(${pin})`, Order.ATOMIC]
}

fb['lotus_gpio_digital_write'] = function(block) {
  const pin   = javascriptGenerator.valueToCode(block, 'pin',   Order.ATOMIC) || '0'
  const value = javascriptGenerator.valueToCode(block, 'value', Order.ATOMIC) || 'LOW'
  return `digitalWrite(${pin}, ${value});\n`
}

fb['lotus_gpio_analog_read'] = function(block) {
  const pin = javascriptGenerator.valueToCode(block, 'pin', Order.ATOMIC) || '0'
  return [`analogRead(${pin})`, Order.ATOMIC]
}

fb['lotus_gpio_dac_write'] = function(block) {
  const pin   = block.getFieldValue('pin')
  const value = javascriptGenerator.valueToCode(block, 'value', Order.ATOMIC) || '0'
  return `dacWrite(${pin}, ${value});\n`
}

fb['lotus_gpio_pwm_write'] = function(block) {
  const pin   = javascriptGenerator.valueToCode(block, 'pin',   Order.ATOMIC) || '0'
  const value = javascriptGenerator.valueToCode(block, 'value', Order.ATOMIC) || '0'
  return `analogWrite(${pin}, ${value});\n`
}

fb['lotus_gpio_pulse_in'] = function(block) {
  const pin     = javascriptGenerator.valueToCode(block, 'pin', Order.ATOMIC) || '0'
  const state   = block.getFieldValue('state')
  const timeout = block.getFieldValue('timeout')
  return [`pulseIn(${pin}, ${state}, ${timeout})`, Order.ATOMIC]
}

fb['lotus_gpio_shift_in'] = function(block) {
  const data     = block.getFieldValue('data_pin')
  const clock    = block.getFieldValue('clock_pin')
  const bitOrder = block.getFieldValue('bit_order')
  return [`shiftIn(${data}, ${clock}, ${bitOrder})`, Order.ATOMIC]
}

fb['lotus_gpio_shift_out'] = function(block) {
  const data     = javascriptGenerator.valueToCode(block, 'data', Order.ATOMIC) || '0'
  const dataPin  = block.getFieldValue('data_pin')
  const clockPin = block.getFieldValue('clock_pin')
  const bitOrder = block.getFieldValue('bit_order')
  return `shiftOut(${dataPin}, ${clockPin}, ${bitOrder}, ${data});\n`
}

// ── Time ───────────────────────────────────────────────────────────────────────

fb['lotus_timer_start'] = function(block) {
  const slot    = block.getFieldValue('SLOT') || '1'
  const varName = `_lotus_timer_${slot}`
  javascriptGenerator.definitions_[varName] = `unsigned long ${varName} = 0;`
  return `${varName} = millis();\n`
}

fb['lotus_timer_within'] = function(block) {
  const duration = block.getFieldValue('DURATION') || '30000'
  const unit     = block.getFieldValue('UNIT')     || 'ms'
  const slot     = block.getFieldValue('SLOT')     || '1'
  const varName  = `_lotus_timer_${slot}`

  let timeFn, threshold
  if (unit === 'us') {
    timeFn    = 'micros()'
    threshold = `${duration}UL`
  } else if (unit === 's') {
    timeFn    = 'millis()'
    threshold = `${Number(duration) * 1000}UL`
  } else {
    timeFn    = 'millis()'
    threshold = `${duration}UL`
  }

  javascriptGenerator.definitions_[varName] = `unsigned long ${varName} = 0;`
  return [`(${timeFn} - ${varName} < ${threshold})`, Order.ATOMIC]
}

fb['lotus_time_delay'] = function(block) {
  const ms = javascriptGenerator.valueToCode(block, 'delay', Order.ATOMIC) || '1000'
  return `delay(${ms});\n`
}

fb['lotus_time_delay_us'] = function(block) {
  const us = javascriptGenerator.valueToCode(block, 'delay', Order.ATOMIC) || '100'
  return `delayMicroseconds(${us});\n`
}

fb['lotus_time_millis'] = function() { return ['millis()', Order.ATOMIC] }
fb['lotus_time_micros'] = function() { return ['micros()', Order.ATOMIC] }


fb['lotus_time_loop_for'] = function(block) {
  const duration = javascriptGenerator.valueToCode(block, 'DURATION', Order.ATOMIC) || '1000'
  const body     = javascriptGenerator.statementToCode(block, 'DO')
  return (
    '{\n' +
    '  unsigned long _loopT = millis();\n' +
    `  while (millis() - _loopT < (unsigned long)(${duration})) {\n` +
    body +
    '  }\n' +
    '}\n'
  )
}

// ── Compatibility ──────────────────────────────────────────────────────────────

fb['basic_string'] = function(block) {
  return [JSON.stringify(block.getFieldValue('VALUE') || ''), Order.ATOMIC]
}

// ── Variables (Arduino C++ flavor) ─────────────────────────────────────────────
// Blockly's default JavaScript generator emits "var X, Y;" globally plus
// "name = value;" per set, which fails C++ parsing. We replace that with a
// typed declaration on first assignment, inferred from the source block.

function _inferCppType(srcBlock) {
  if (!srcBlock) return null
  switch (srcBlock.type) {
    case 'i2c128x64_create_image': return 'const uint8_t*'
    case 'basic_string':
    case 'text':
    case 'text_join':              return 'String'
    case 'math_number':            return 'float'
    case 'logic_boolean':          return 'bool'
    default: {
      // Fall back to declared output check (Blockly type hint), if present.
      const checks = srcBlock.outputConnection && srcBlock.outputConnection.getCheck()
      if (Array.isArray(checks)) {
        if (checks.includes('Number'))      return 'float'
        if (checks.includes('String'))      return 'String'
        if (checks.includes('Boolean'))     return 'bool'
        if (checks.includes('BitmapData'))  return 'const uint8_t*'
      }
      return null
    }
  }
}

fb['variables_set'] = function(block) {
  const value   = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0'
  const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE')
  const key     = '__lotus_var_' + varName
  // Always emit a global typed declaration so the variable is visible across
  // setup() and loop(). Inferred type beats unknown — fall back to float.
  if (!javascriptGenerator.definitions_[key]) {
    const cppType = _inferCppType(block.getInputTargetBlock('VALUE')) || 'float'
    javascriptGenerator.definitions_[key] = `${cppType} ${varName};`
  }
  return `${varName} = ${value};\n`
}

fb['variables_get'] = function(block) {
  const varName = javascriptGenerator.nameDB_.getName(block.getFieldValue('VAR'), 'VARIABLE')
  return [varName, Order.ATOMIC]
}

// ── Serial ─────────────────────────────────────────────────────────────────────

// ── Text ───────────────────────────────────────────────────────────────────────

// Override Blockly's stock text generator — it emits single-quoted JS string
// literals ('foo'), which in C++ are multi-character constants (an int), not
// strings. Re-emit as a double-quoted literal via JSON.stringify so things
// like _mqClient.publish(String("lotus/data").c_str(), ...) work correctly.
fb['text'] = function(block) {
  return [JSON.stringify(block.getFieldValue('TEXT') || ''), Order.ATOMIC]
}

fb['text_join'] = function(block) {
  const count = block.itemCount_ || 0
  if (count === 0) return ['""', Order.ATOMIC]
  const parts = []
  for (let i = 0; i < count; i++) {
    const val = javascriptGenerator.valueToCode(block, 'ADD' + i, Order.NONE) || '""'
    parts.push(`String(${val})`)
  }
  return [parts.join(' + '), Order.ADDITION]
}

// ── Serial ─────────────────────────────────────────────────────────────────────

fb['lotus_serial_begin'] = function(block) {
  const port = block.getFieldValue('port') || 'Serial'
  return `${port}.begin(${block.getFieldValue('baudrate')});\n`
}

fb['lotus_serial_println'] = function(block) {
  const port  = block.getFieldValue('port') || 'Serial'
  const value = javascriptGenerator.valueToCode(block, 'value', Order.ATOMIC) || '""'
  return `${port}.println(${value});\n`
}

fb['lotus_serial_print'] = function(block) {
  const port  = block.getFieldValue('port') || 'Serial'
  const value = javascriptGenerator.valueToCode(block, 'value', Order.ATOMIC) || '""'
  return `${port}.print(${value});\n`
}

fb['lotus_serial_available'] = function(block) {
  const port = block.getFieldValue('port') || 'Serial'
  return [`${port}.available()`, Order.ATOMIC]
}

fb['lotus_serial_read_line'] = function(block) {
  const port = block.getFieldValue('port') || 'Serial'
  return [`${port}.readStringUntil('\\n')`, Order.NONE]
}

fb['lotus_serial_read_int'] = function(block) {
  const port = block.getFieldValue('port') || 'Serial'
  return [`${port}.parseInt()`, Order.ATOMIC]
}

fb['lotus_serial_read_byte'] = function(block) {
  const port = block.getFieldValue('port') || 'Serial'
  return [`${port}.read()`, Order.ATOMIC]
}

// ── Task (FreeRTOS — ESP32 only) ───────────────────────────────────────────────

function _sanitizeTaskName(raw) {
  return (raw || 'task').replace(/[^A-Za-z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
}

fb['lotus_task_create'] = function(block) {
  const name = _sanitizeTaskName(block.getFieldValue('NAME'))
  const core = block.getFieldValue('CORE') || '1'
  const body = javascriptGenerator.statementToCode(block, 'BODY')
  const handle = `_lotus_task_h_${name}`
  const fn     = `_lotus_task_fn_${name}`
  // Markers tell finish() to hoist the handle as a global and the function body
  // above setup(). Inline call kicks the task off when the surrounding block runs.
  return (
    `#VARIABLE\nTaskHandle_t ${handle} = NULL;\n#END\n` +
    `#FUNCTION\nvoid ${fn}(void *param) {\n  for(;;) {\n${body}  }\n}\n#END\n` +
    `xTaskCreatePinnedToCore(${fn}, "${name}", 4096, NULL, 1, &${handle}, ${core});\n`
  )
}

fb['lotus_task_delay'] = function(block) {
  const ms = javascriptGenerator.valueToCode(block, 'MS', Order.ATOMIC) || '100'
  return `vTaskDelay(pdMS_TO_TICKS(${ms}));\n`
}

fb['lotus_task_delete_self'] = function() {
  return `vTaskDelete(NULL);\n`
}

fb['lotus_task_delete'] = function(block) {
  const name = _sanitizeTaskName(block.getFieldValue('NAME'))
  const h    = `_lotus_task_h_${name}`
  return `if (${h}) { vTaskDelete(${h}); ${h} = NULL; }\n`
}

fb['lotus_task_suspend'] = function(block) {
  const name = _sanitizeTaskName(block.getFieldValue('NAME'))
  return `if (_lotus_task_h_${name}) vTaskSuspend(_lotus_task_h_${name});\n`
}

fb['lotus_task_resume'] = function(block) {
  const name = _sanitizeTaskName(block.getFieldValue('NAME'))
  return `if (_lotus_task_h_${name}) vTaskResume(_lotus_task_h_${name});\n`
}

fb['lotus_task_current_core'] = function() {
  return ['xPortGetCoreID()', Order.ATOMIC]
}
