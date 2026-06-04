// LotusMegaBot++ toolbox
const dirIcon = Vue.prototype.$global.board.board_info.dir;
module.exports = {
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
                // Wait for Start Button (SW1=D35 / SW2=D37 dropdown)
                'sw1_press',
                // 9 servos at D26..D34
                'Lotus_servo',
                // 6Ch (Left/Right)
                'Lotus_motor',
                'Lotus_motor_4ch',
                'Lotus_motor_2ch',
                'Lotus_motor_single',
                'Lotus_all_motor',
                'Lotus_motor_stop',
                // Buzzer
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
                // Knob (potentiometer)
                'knob_read',
                // Encoder
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
                // Map Lotus helper
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
    ],
};
