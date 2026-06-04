module.exports = function(Blockly) {
  'use strict';
  var C = 160;  // teal — distinct from Module (230) and TFT (200)

  // ---- Init / Calibrate ----

  Blockly.Blocks['move4ch_init'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Move4ch init')
        .appendField(new Blockly.FieldDropdown([
          ['Encoder only',  '1'],
          ['IMU only',      '2'],
          ['Encoder + IMU', '3'],
        ]), 'MODE');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Initialize 4-wheel Mecanum drive. Choose sensor mode: encoder closed-loop, IMU heading, or both.');
    }
  };

  Blockly.Blocks['move4ch_calibrate_imu'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Move4ch calibrate IMU (keep still)');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Measure gyro zero-rate offset. Robot must be completely still. Call once in setup().');
    }
  };

  // ---- Tuning ----

  Blockly.Blocks['move4ch_set_kp'] = {
    init: function() {
      this.appendValueInput('KP')
        .setCheck('Number')
        .appendField('Move4ch set Kp');
      this.appendDummyInput()
        .appendField('(0.5=soft  1.0=default  2.0=aggressive)');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Set heading correction gain. If robot oscillates → lower Kp. If slow to straighten → raise Kp. Range 0.1–5.0.');
    }
  };

  Blockly.Blocks['move4ch_set_tpd'] = {
    init: function() {
      this.appendValueInput('TPD')
        .setCheck('Number')
        .appendField('Move4ch set ticks/degree');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Set encoder ticks per degree for encoder-only spin. Measure: spin 360° → read total ticks → divide by 360. Only needed without IMU.');
    }
  };

  // ---- Basic Motion ----

  Blockly.Blocks['move4ch_forward'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch forward');
      this.appendValueInput('TICKS').setCheck('Number').appendField('ticks');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Move forward. Encoder syncs all 4 wheels; IMU corrects heading drift if enabled.');
    }
  };

  Blockly.Blocks['move4ch_backward'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch backward');
      this.appendValueInput('TICKS').setCheck('Number').appendField('ticks');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Move backward with encoder sync on all 4 wheels.');
    }
  };

  Blockly.Blocks['move4ch_stop'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch stop');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Brake all 4 Mecanum wheels immediately.');
    }
  };

  // ---- Rotation ----

  Blockly.Blocks['move4ch_spin_left'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch spin left');
      this.appendValueInput('DEG').setCheck('Number').appendField('degrees');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Spin left (CCW) by the given degrees. Uses IMU gyro for precise angle when enabled.');
    }
  };

  Blockly.Blocks['move4ch_spin_right'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch spin right');
      this.appendValueInput('DEG').setCheck('Number').appendField('degrees');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Spin right (CW) by the given degrees. Uses IMU gyro for precise angle when enabled.');
    }
  };

  Blockly.Blocks['move4ch_set_heading'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch go to heading');
      this.appendValueInput('HDG').setCheck('Number').appendField('degrees');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Rotate to an absolute heading. 0°=initial direction, +90°=right (CW), -90°=left (CCW).');
    }
  };

  // ---- Strafe (Mecanum) ----

  Blockly.Blocks['move4ch_strafe_left'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch strafe left');
      this.appendValueInput('TICKS').setCheck('Number').appendField('ticks');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Slide left 90° without rotating the robot body. IMU holds heading if enabled.');
    }
  };

  Blockly.Blocks['move4ch_strafe_right'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch strafe right');
      this.appendValueInput('TICKS').setCheck('Number').appendField('ticks');
      this.appendDummyInput().appendField('at');
      this.appendValueInput('SPEED').setCheck('Number');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Slide right 90° without rotating the robot body. IMU holds heading if enabled.');
    }
  };

  // ---- Read / Status ----

  Blockly.Blocks['move4ch_heading'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch heading (°)');
      this.setOutput(true, 'Number');
      this.setColour(C);
      this.setTooltip('Current yaw angle from IMU in degrees. 0° = direction at init/reset.');
    }
  };

  Blockly.Blocks['move4ch_enc_read'] = {
    init: function() {
      this.appendDummyInput()
        .appendField('Move4ch encoder')
        .appendField(new Blockly.FieldDropdown([
          ['FL (ซ้ายหน้า)', '1'],
          ['FR (ขวาหน้า)',  '2'],
          ['RL (ซ้ายหลัง)', '3'],
          ['RR (ขวาหลัง)', '4'],
        ]), 'WHEEL');
      this.setOutput(true, 'Number');
      this.setColour(C);
      this.setTooltip('Read raw encoder tick count for a specific wheel.');
    }
  };

  Blockly.Blocks['move4ch_enc_reset'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch reset encoders');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Reset all 4 encoder tick counts to 0.');
    }
  };

  Blockly.Blocks['move4ch_reset_heading'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch reset heading');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Set current facing direction as 0°.');
    }
  };

  // ---- Raw control ----

  Blockly.Blocks['move4ch_set_wheels'] = {
    init: function() {
      this.appendDummyInput().appendField('Move4ch wheels');
      this.appendValueInput('FL').setCheck('Number').appendField('FL');
      this.appendValueInput('FR').setCheck('Number').appendField('FR');
      this.appendValueInput('RL').setCheck('Number').appendField('RL');
      this.appendValueInput('RR').setCheck('Number').appendField('RR');
      this.appendDummyInput().appendField('%');
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(C);
      this.setTooltip('Set each wheel speed individually (-100 to +100%). FL=Front-Left, FR=Front-Right, RL=Rear-Left, RR=Rear-Right.');
    }
  };
};
