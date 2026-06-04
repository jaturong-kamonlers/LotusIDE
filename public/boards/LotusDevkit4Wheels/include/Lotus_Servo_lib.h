#include "Lotus_Servo.h"
#define _servo1 32
#define _servo2 33
#define _servo3 5
#ifndef ALL
#define ALL 100
#endif

Servo servo1;
Servo servo2;
Servo servo3;

void servo(uint8_t servo, int16_t angle)
{
  if (servo == ALL)
  {
    if (angle == -1)
    {
      servo1.detach();
      servo2.detach();
      servo3.detach();
    }
    else
    {
      if (!(servo1.attached()))
      {
        servo1.attach(_servo1);
      }
      servo1.write(angle);

      if (!(servo2.attached()))
      {
        servo2.attach(_servo2);
      }
      servo2.write(angle);

      if (!(servo3.attached()))
      {
        servo3.attach(_servo3);
      }
      servo3.write(angle);
    }
  }
  if (servo == 1)
  {
    if (angle == -1)
    {
      servo1.detach();
    }
    else
    {
      if (!(servo1.attached()))
      {
        servo1.attach(_servo1);
      }
      servo1.write(angle);
    }
  }
  
  if (servo == 2)
  {
    if (angle == -1)
    {
      servo2.detach();
    }
    else
    {
      if (!(servo2.attached()))
      {
        servo2.attach(_servo2);
      }
      servo2.write(angle);
    }
  }
  
  if (servo == 3)
  {
    if (angle == -1)
    {
      servo3.detach();
    }
    else
    {
      if (!(servo3.attached()))
      {
        servo3.attach(_servo3);
      }
      servo3.write(angle);
    }
  }
  
}
//Cr. Inex & wit32 it-maker