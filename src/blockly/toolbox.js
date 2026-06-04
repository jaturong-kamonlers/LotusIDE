// Helper: shadow number block
const num = (n) => ({ shadow: { type: 'math_number', fields: { NUM: n } } })
// Helper: shadow text block
const txt = (s) => ({ shadow: { type: 'text', fields: { TEXT: s } } })
// Helper: shadow boolean block
const bool = (v = 'TRUE') => ({ shadow: { type: 'logic_boolean', fields: { BOOL: v } } })
// Helper: shadow level block
const level = (v = 'HIGH') => ({ shadow: { type: 'lotus_gpio_level', fields: { LEVEL: v } } })

export const toolbox = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category', name: 'Variables', colour: '330',
      toolboxitemid: 'cat-variables',
      custom: 'VARIABLE',
    },
    {
      kind: 'category', name: 'GPIO', colour: '#F57F17',
      toolboxitemid: 'cat-gpio',
      contents: [
        { kind: 'block', type: 'lotus_gpio_set_mode',
          inputs: { pin: num(13) } },
        { kind: 'block', type: 'lotus_gpio_digital_write',
          inputs: { pin: num(13), value: level('HIGH') } },
        { kind: 'block', type: 'lotus_gpio_digital_read',
          inputs: { pin: num(2) } },
        { kind: 'block', type: 'lotus_gpio_analog_read',
          inputs: { pin: num(0) } },
        { kind: 'block', type: 'lotus_gpio_pwm_write',
          inputs: { pin: num(9), value: num(128) } },
        { kind: 'block', type: 'lotus_gpio_dac_write',
          inputs: { value: num(128) } },
        { kind: 'block', type: 'lotus_gpio_pulse_in',
          inputs: { pin: num(7) } },
        { kind: 'block', type: 'lotus_gpio_shift_in' },
        { kind: 'block', type: 'lotus_gpio_shift_out',
          inputs: { data: num(0) } },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_gpio_level' },
      ],
    },
    {
      kind: 'category', name: 'Time', colour: '#039BE5',
      toolboxitemid: 'cat-time',
      contents: [
        { kind: 'block', type: 'lotus_time_delay',    inputs: { delay: num(1000) } },
        { kind: 'block', type: 'lotus_time_delay_us', inputs: { delay: num(100) } },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_timer_start' },
        { kind: 'block', type: 'lotus_timer_within' },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_time_millis' },
        { kind: 'block', type: 'lotus_time_micros' },
        { kind: 'block', type: 'lotus_time_loop_for', inputs: { DURATION: num(1000) } },
      ],
    },
    {
      kind: 'category', name: 'Serial', colour: '#43A047',
      toolboxitemid: 'cat-serial',
      contents: [
        { kind: 'block', type: 'lotus_serial_begin' },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_serial_println', inputs: { value: txt('Hello') } },
        { kind: 'block', type: 'lotus_serial_print',   inputs: { value: txt('Hello') } },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_serial_available' },
        { kind: 'block', type: 'lotus_serial_read_line' },
        { kind: 'block', type: 'lotus_serial_read_int' },
        { kind: 'block', type: 'lotus_serial_read_byte' },
      ],
    },
    {
      kind: 'category', name: 'Math', colour: '230',
      toolboxitemid: 'cat-math',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic',
          inputs: { A: num(1), B: num(1) } },
        { kind: 'block', type: 'math_modulo',
          inputs: { DIVIDEND: num(10), DIVISOR: num(3) } },
        { kind: 'block', type: 'math_constrain',
          inputs: { VALUE: num(50), LOW: num(0), HIGH: num(100) } },
        { kind: 'block', type: 'math_random_int',
          inputs: { FROM: num(1), TO: num(100) } },
        { kind: 'block', type: 'math_single',
          inputs: { NUM: num(9) } },
        { kind: 'block', type: 'math_round',
          inputs: { NUM: num(3.14) } },
        { kind: 'sep' },
        { kind: 'block', type: 'math_trig',   inputs: { NUM: num(45) } },
        { kind: 'block', type: 'math_atan2',  inputs: { X: num(1), Y: num(1) } },
        { kind: 'block', type: 'math_constant' },
      ],
    },
    {
      kind: 'category', name: 'Logic', colour: '210',
      toolboxitemid: 'cat-logic',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate',
          inputs: { BOOL: bool('TRUE') } },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category', name: 'Loops', colour: '120',
      toolboxitemid: 'cat-loops',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext',
          inputs: { TIMES: num(10) } },
        { kind: 'block', type: 'controls_whileUntil',
          inputs: { BOOL: bool('TRUE') } },
        { kind: 'block', type: 'controls_for',
          fields: { VAR: 'i' },
          inputs: { FROM: num(0), TO: num(10), BY: num(1) } },
        { kind: 'block', type: 'controls_flow_statements' },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_forever' },
      ],
    },
    {
      kind: 'category', name: 'Text', colour: '160',
      toolboxitemid: 'cat-text',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length',
          inputs: { VALUE: txt('Hello') } },
      ],
    },
    {
      kind: 'category', name: 'Functions', colour: '290',
      toolboxitemid: 'cat-functions',
      custom: 'PROCEDURE',
    },
    // FreeRTOS multitasking — hidden by default, revealed by BlocklyEditor for
    // ESP32-platform boards (LotusDevkit / LotusDevkit4Wheels) only.
    {
      kind: 'category', name: 'Task', colour: '#7E57C2',
      toolboxitemid: 'cat-task',
      contents: [
        { kind: 'block', type: 'lotus_task_create',
          fields: { NAME: 'task1', CORE: '1' } },
        { kind: 'block', type: 'lotus_task_delay', inputs: { MS: num(100) } },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_task_suspend', fields: { NAME: 'task1' } },
        { kind: 'block', type: 'lotus_task_resume',  fields: { NAME: 'task1' } },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_task_delete',      fields: { NAME: 'task1' } },
        { kind: 'block', type: 'lotus_task_delete_self' },
        { kind: 'sep' },
        { kind: 'block', type: 'lotus_task_current_core' },
      ],
    },
  ],
}
