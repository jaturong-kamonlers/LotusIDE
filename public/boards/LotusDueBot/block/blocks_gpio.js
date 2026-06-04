module.exports = function(Blockly){
  'use strict';

// NOTE: io_analog_read / io_digital_read / io_digital_write / io_pwm_write are
// already defined at platform level (arduino-sam/block/blocks_gpio.js) with
// value-input "pin" so shadow math_number works. We do NOT redefine them
// here -- use the platform's GPIO category for those.
//
// All board-specific analog-with-named-pin and PWM-with-named-pin remain in
// blocks_sensor.js (analog_sensor / nano_beep_custom / knob_read).

};
