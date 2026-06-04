const dirIcon = Vue.prototype.$global.board.board_info.dir; 
module.exports = {
    blocks : [ // use "blocks : [ " in normally situation but this need to override base block from esp-idf platforms
		
		{
            name : 'OLED',
            color : '230',
 //           icon : '/static/icons/SVG/c1.svg',
			icon: `file:///${dirIcon}/static/icons/oled.png`,
            blocks : [
    
				
                'i2c128x64_display_clear',
                'i2c128x64_display_display',

                'i2c128x64_create_image',
                {
                    xml :
                    `<block type="i2c128x64_display_image">
                        <value name="x">
                            <shadow type="math_number"><field name="NUM">0</field></shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number"><field name="NUM">0</field></shadow>
                        </value>
                        <value name="width">
                            <shadow type="math_number"><field name="NUM">128</field></shadow>
                        </value>
                        <value name="height">
                            <shadow type="math_number"><field name="NUM">64</field></shadow>
                        </value>
                    </block>`
                },
                
			
				{ 
                    xml : 
                    `<block type="i2c128x64_display_print">
                        <value name="text">
                            <shadow type="basic_string">
                                <field name="VALUE">Hello world!</field>
                            </shadow>
                        </value>
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                    </block>`
                },
				
				
				
				{ 
                    xml : 
                    `<block type="i2c128x64_display_print_number">
                        <value name="number">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                    </block>`
                },
				
				{ 
                    xml : 
                    `<block type="i2c128x64_hilight_text">
                        <value name="text">
                            <shadow type="basic_string">
                                <field name="VALUE">Hello world!</field>
                            </shadow>
                        </value>
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                    </block>`
                },
				
				{ 
                    xml : 
                    `<block type="i2c128x64_display_print_scroll_left">
                        <value name="text">
                            <shadow type="basic_string">
                                <field name="VALUE">Hello world!</field>
                            </shadow>
                        </value>
                        <value name="step">
                            <shadow type="math_number">
                                <field name="NUM">5</field>
                            </shadow>
                        </value>
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                    </block>`
                },
				
				
                { 
                    xml : 
                    `<block type="i2c128x64_display_draw_line">
                        <value name="x0">
                            <shadow type="math_number">
                                <field name="NUM">10</field>
                            </shadow>
                        </value>
                        <value name="y0">
                            <shadow type="math_number">
                                <field name="NUM">10</field>
                            </shadow>
                        </value>
                        <value name="x1">
                            <shadow type="math_number">
                                <field name="NUM">100</field>
                            </shadow>
                        </value>
                        <value name="y1">
                            <shadow type="math_number">
                                <field name="NUM">50</field>
                            </shadow>
                        </value>
                    </block>`
                },
                { 
                    xml : 
                    `<block type="i2c128x64_display_draw_rect">
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">10</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">10</field>
                            </shadow>
                        </value>
                        <value name="width">
                            <shadow type="math_number">
                                <field name="NUM">50</field>
                            </shadow>
                        </value>
                        <value name="height">
                            <shadow type="math_number">
                                <field name="NUM">30</field>
                            </shadow>
                        </value>
                    </block>`
                },
                { 
                    xml : 
                    `<block type="i2c128x64_display_draw_circle">
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">64</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">32</field>
                            </shadow>
                        </value>
                        <value name="r">
                            <shadow type="math_number">
                                <field name="NUM">20</field>
                            </shadow>
                        </value>
                    </block>`
                },
                { 
                    xml : 
                    `<block type="i2c128x64_display_draw_progress_bar">
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">32</field>
                            </shadow>
                        </value>
                        <value name="width">
                            <shadow type="math_number">
                                <field name="NUM">120</field>
                            </shadow>
                        </value>
                        <value name="height">
                            <shadow type="math_number">
                                <field name="NUM">30</field>
                            </shadow>
                        </value>
                        <value name="progress">
                            <shadow type="math_number">
                                <field name="NUM">50</field>
                            </shadow>
                        </value>
                    </block>`
                },
                { 
                    xml : 
                    `<block type="i2c128x64_display_draw_pixel">
                        <value name="x">
                            <shadow type="math_number">
                                <field name="NUM">64</field>
                            </shadow>
                        </value>
                        <value name="y">
                            <shadow type="math_number">
                                <field name="NUM">32</field>
                            </shadow>
                        </value>    
                    </block>`
                },

                'i2c128x64_display_width',
                'i2c128x64_display_height',
                'basic_string',
				'text_join'
            ]
        },
		{
            name : 'Module',
            color : '230',
		//	icon : '/static/icons/SVG/c7.svg',
			icon: `file:///${dirIcon}/static/icons/lotus.png`,
            blocks : [
				'sw1_press',
         //       'button_1_status',
         //       'Knob_status',

				                'Lotus_servo',
				
				


                'Lotus_motor',
                'Lotus_motor_4ch',
                'Lotus_motor_2ch',
                'Lotus_motor_single',
                'Lotus_all_motor',
					'Lotus_motor_stop',
				////////////////////////////
             /*   { 
                    xml : 
                    `<block type="Lotus_sound">
                        <value name="soundfe">
                            <shadow type="math_number">
                                <field name="NUM">256</field>
                            </shadow>
                        </value>
                        <value name="soundms">
                            <shadow type="math_number">
                                <field name="NUM">500</field>
                            </shadow>
                        </value>
                    </block>`
                },
				*/
				///////////////////////////

				'nano_beep',
				        {
      xml :
      `<block type="nano_beep_custom">
        <value name="FREQUENCY">
          <shadow type="math_number">
            <field name="NUM">1000</field>
          </shadow>
        </value>
        <value name="DURATION">
          <shadow type="math_number">
            <field name="NUM">1000</field>
          </shadow>
        </value>
      </block>`
    },
                {
                    xml:
                    `<block type="map_func">
                        <value name="V1">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="V2">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="V3">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="V4">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                        <value name="V5">
                            <shadow type="math_number">
                                <field name="NUM">0</field>
                            </shadow>
                        </value>
                    </block>`
                },
            ]
        },
	

    ]
};