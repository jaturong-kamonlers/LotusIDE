#ifndef __BH1750_CPP__
#define __BH1750_CPP__

#include<BH1750.h>

BH1750::BH1750(int address, TwoWire* bus) {
	this->addr = address;
	this->wire = bus;
}

void BH1750::begin() {
	this->wire->beginTransmission(this->addr);
	this->wire->write(0b00010000); // Send "Continuously H-resolution mode " instruction 
	this->wire->endTransmission();
	
	delay(180); // Wait to complete 1st H-resolution mode measurement.( max. 180ms. ) 
}

float BH1750::read() {
	this->wire->requestFrom(this->addr, 2);
	if (this->wire->available() < 2) {
		Serial.println("BH1750 read error");
		return 0;
	}
	
	return ((this->wire->read() << 8) | this->wire->read()) / 1.2;
}

#endif
