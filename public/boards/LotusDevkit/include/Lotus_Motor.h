
void motor(int pin, int Speeds) {
  int _SpeedsA;
  int _SpeedsB;
  /// มอเตอร์ซ้าย
  if (pin == 1) {
    _SpeedsA = abs(Speeds);
    _SpeedsA = _SpeedsA * 2.55;
    if (_SpeedsA > 255)_SpeedsA = 255;
    else if (_SpeedsA < -255)_SpeedsA = -255;
    if (Speeds > 0) {
    digitalWrite(16, LOW);
    digitalWrite(17, HIGH);
    ledcWrite(4, _SpeedsA);
    }
    else if (Speeds < 0) {
	digitalWrite(16, HIGH);
    digitalWrite(17, LOW);
   ledcWrite(4, _SpeedsA);
    }
	else  {
	digitalWrite(16, HIGH);
    digitalWrite(17, HIGH);

	}
  }
  // มอเตอร์ขวา
  else if (pin == 2) {
    _SpeedsB = abs(Speeds);
    
    _SpeedsB = _SpeedsB * 2.55;
    if (_SpeedsB > 255)_SpeedsB = 255;
    else if (_SpeedsB < -255)_SpeedsB = -255;
    if (Speeds > 0) {

	digitalWrite(2, LOW);
    digitalWrite(15, HIGH);
    ledcWrite(13, _SpeedsB);
    }
    else if (Speeds < 0) {
  	digitalWrite(2, HIGH);
    digitalWrite(15, LOW);
    ledcWrite(13, _SpeedsB);
    }
	else {
	digitalWrite(2, HIGH);
    digitalWrite(15, HIGH);	
	}
  }
}

void ao(){
motor(1,0);
motor(2,0);

}
