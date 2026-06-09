#ifndef __BH1750_H__
#define __BH1750_H__

#include<Arduino.h>
#include<Wire.h>

class BH1750 {
	private:
		TwoWire* wire;
		uint8_t addr = 0x23;
		
	public:
		BH1750(int address, TwoWire* bus=&Wire) ;
		
		void begin() ;
		float read() ;
		
}
;

#endif
