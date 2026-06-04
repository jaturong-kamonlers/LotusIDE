// LotusDueBot toolbox
const dirIcon = Vue.prototype.$global.board.board_info.dir;
const _toolbox = {
    blocks : [
        {
            name : 'TFT LCD',
            color : '200',
            icon: `file:///${dirIcon}/static/icons/tft.png`,
            blocks : [
                {
                    xml :
                    `<block type="tft_clear">
                        <value name="C">
                            <shadow type="tft_color"><field name="C">COLOR_BLACK</field></shadow>
                        </value>
                    </block>`
                },
                'tft_color',
                'tft_set_rotation',
                {
                    xml :
                    `<block type="tft_print_at">
                        <field name="TXT">Hello world!</field>
                        <value name="X"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="Y"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="C"><shadow type="tft_color"><field name="C">COLOR_WHITE</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="tft_print_number_at">
                        <value name="N"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="X"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="Y"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="C"><shadow type="tft_color"><field name="C">COLOR_WHITE</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="tft_draw_pixel">
                        <value name="X"><shadow type="math_number"><field name="NUM">64</field></shadow></value>
                        <value name="Y"><shadow type="math_number"><field name="NUM">80</field></shadow></value>
                        <value name="C"><shadow type="tft_color"><field name="C">COLOR_WHITE</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="tft_draw_line">
                        <value name="X0"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="Y0"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="X1"><shadow type="math_number"><field name="NUM">127</field></shadow></value>
                        <value name="Y1"><shadow type="math_number"><field name="NUM">159</field></shadow></value>
                        <value name="C"><shadow type="tft_color"><field name="C">COLOR_WHITE</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="tft_draw_rect">
                        <value name="X"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="Y"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="W"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                        <value name="H"><shadow type="math_number"><field name="NUM">30</field></shadow></value>
                        <value name="C"><shadow type="tft_color"><field name="C">COLOR_WHITE</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="tft_draw_circle">
                        <value name="X"><shadow type="math_number"><field name="NUM">64</field></shadow></value>
                        <value name="Y"><shadow type="math_number"><field name="NUM">80</field></shadow></value>
                        <value name="R"><shadow type="math_number"><field name="NUM">20</field></shadow></value>
                        <value name="C"><shadow type="tft_color"><field name="C">COLOR_WHITE</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="tft_draw_image">
                        <value name="X"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                        <value name="Y"><shadow type="math_number"><field name="NUM">10</field></shadow></value>
                    </block>`
                },
            ]
        },
        {
            name : 'Module',
            color : '230',
            icon: `file:///${dirIcon}/static/icons/module.png`,
            blocks : [
                'sw1_press',
                'Lotus_servo',
                'Lotus_motor',
                'Lotus_motor_4ch',
                'Lotus_motor_2ch',
                'Lotus_motor_single',
                'Lotus_all_motor',
                'Lotus_motor_stop',
                'nano_beep',
                {
                    xml :
                    `<block type="nano_beep_custom">
                        <value name="FREQUENCY">
                            <shadow type="math_number"><field name="NUM">1000</field></shadow>
                        </value>
                        <value name="DURATION">
                            <shadow type="math_number"><field name="NUM">1000</field></shadow>
                        </value>
                    </block>`
                },
                'knob_read',
                'encoder_init',
                'encoder_read',
                'encoder_reset',
                {
                    xml :
                    `<block type="encoder_drive">
                        <value name="TICKS"><shadow type="math_number"><field name="NUM">400</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="encoder_spin">
                        <value name="TICKS"><shadow type="math_number"><field name="NUM">200</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">40</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="map_func">
                        <value name="V1">
                            <shadow type="math_number"><field name="NUM">0</field></shadow>
                        </value>
                    </block>`
                },
            ]
        },
        {
            name : 'Move4ch',
            color : '160',
            icon: `file:///${dirIcon}/static/icons/move.png`,
            blocks : [
                // --- Setup ---
                {
                    xml :
                    `<block type="move4ch_init">
                        <field name="MODE">3</field>
                    </block>`
                },
                'move4ch_calibrate_imu',
                {
                    xml :
                    `<block type="move4ch_set_kp">
                        <value name="KP"><shadow type="math_number"><field name="NUM">1.0</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="move4ch_set_tpd">
                        <value name="TPD"><shadow type="math_number"><field name="NUM">5.0</field></shadow></value>
                    </block>`
                },
                // --- Basic motion ---
                {
                    xml :
                    `<block type="move4ch_forward">
                        <value name="TICKS"><shadow type="math_number"><field name="NUM">400</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="move4ch_backward">
                        <value name="TICKS"><shadow type="math_number"><field name="NUM">400</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                    </block>`
                },
                'move4ch_stop',
                // --- Rotation ---
                {
                    xml :
                    `<block type="move4ch_spin_left">
                        <value name="DEG"><shadow type="math_number"><field name="NUM">90</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">40</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="move4ch_spin_right">
                        <value name="DEG"><shadow type="math_number"><field name="NUM">90</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">40</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="move4ch_set_heading">
                        <value name="HDG"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">40</field></shadow></value>
                    </block>`
                },
                // --- Strafe ---
                {
                    xml :
                    `<block type="move4ch_strafe_left">
                        <value name="TICKS"><shadow type="math_number"><field name="NUM">300</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                    </block>`
                },
                {
                    xml :
                    `<block type="move4ch_strafe_right">
                        <value name="TICKS"><shadow type="math_number"><field name="NUM">300</field></shadow></value>
                        <value name="SPEED"><shadow type="math_number"><field name="NUM">50</field></shadow></value>
                    </block>`
                },
                // --- Read / Status ---
                'move4ch_heading',
                'move4ch_enc_read',
                'move4ch_enc_reset',
                'move4ch_reset_heading',
                // --- Raw control ---
                {
                    xml :
                    `<block type="move4ch_set_wheels">
                        <value name="FL"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="FR"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="RL"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                        <value name="RR"><shadow type="math_number"><field name="NUM">0</field></shadow></value>
                    </block>`
                },
            ]
        },
    ],
};
module.exports = _toolbox;
