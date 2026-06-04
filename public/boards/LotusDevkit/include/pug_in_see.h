int pug_base_x= 60;
int pug_base_y= 10;
int sun_xx = 118;
int sun_yy = 10;

void sun_radius_1() {
  display.drawLine((sun_xx - 10), (sun_yy - 4), (sun_xx - 12), (sun_yy - 4));
  display.drawLine((sun_xx - 10), (sun_yy + 1), (sun_xx - 14), (sun_yy + 2));
  display.drawLine((sun_xx - 8), (sun_yy + 6), (sun_xx - 10), (sun_yy + 8));
  display.drawLine((sun_xx - 3), (sun_yy + 10), (sun_xx - 4), (sun_yy + 13));
  display.drawLine((sun_xx + 4), (sun_yy + 8), (sun_xx + 4), (sun_yy + 10));

  return;
}

void sun_radius_2() {
  display.drawLine((sun_xx - 10), (sun_yy - 4), (sun_xx - 16), (sun_yy - 4));
  display.drawLine((sun_xx - 10), (sun_yy + 1), (sun_xx - 16), (sun_yy + 2));
  display.drawLine((sun_xx - 8), (sun_yy + 6), (sun_xx - 12), (sun_yy + 10));
  display.drawLine((sun_xx - 3), (sun_yy + 10), (sun_xx - 4), (sun_yy + 15));
  display.drawLine((sun_xx + 4), (sun_yy + 8), (sun_xx + 4), (sun_yy + 14));

  return;
}

void sun_radius_3() {
  display.drawLine((sun_xx - 10), (sun_yy - 4), (sun_xx - 19), (sun_yy - 4));
  display.drawLine((sun_xx - 10), (sun_yy + 1), (sun_xx - 16), (sun_yy + 2));
  display.drawLine((sun_xx - 8), (sun_yy + 6), (sun_xx - 14), (sun_yy + 12));
  display.drawLine((sun_xx - 3), (sun_yy + 10), (sun_xx - 4), (sun_yy + 15));
  display.drawLine((sun_xx + 4), (sun_yy + 8), (sun_xx + 4), (sun_yy + 17));

  return;
}

void pug1() {
  // ระดับพื้นดิน
  display.drawLine((pug_base_x + 4), (pug_base_y + 35), (pug_base_x + 47),(pug_base_y + 35));
  display.fillCircle((pug_base_x + 25), (pug_base_y + 38), 10);

  return;
}
void pug2() {
  // ระดับพื้นดิน
  display.drawLine((pug_base_x + 4), (pug_base_y + 35), (pug_base_x + 47),(pug_base_y + 35));
  display.fillCircle((pug_base_x + 14), (pug_base_y + 25), 10);
  display.drawLine((pug_base_x + 18), (pug_base_y + 15), (pug_base_x + 34),(pug_base_y + 17));
  display.drawLine((pug_base_x + 34), (pug_base_y + 17), (pug_base_x + 41),(pug_base_y + 26));
  display.drawLine((pug_base_x + 41), (pug_base_y + 26), (pug_base_x + 37),(pug_base_y + 47));
  display.drawLine((pug_base_x + 37), (pug_base_y + 47), (pug_base_x + 34),(pug_base_y + 48));
  display.drawLine((pug_base_x + 34), (pug_base_y + 48), (pug_base_x + 32),(pug_base_y + 29));
  display.drawLine((pug_base_x + 32), (pug_base_y + 29), (pug_base_x + 30),(pug_base_y + 28));
  display.drawLine((pug_base_x + 30), (pug_base_y + 28), (pug_base_x + 24),(pug_base_y + 29));
  display.drawLine((pug_base_x + 30), (pug_base_y + 38), (pug_base_x + 26),(pug_base_y + 41));
  display.drawLine((pug_base_x + 31), (pug_base_y + 42), (pug_base_x + 27),(pug_base_y + 47));
  display.drawLine((pug_base_x + 40), (pug_base_y + 43), (pug_base_x + 43),(pug_base_y + 48));
  display.drawLine((pug_base_x + 41), (pug_base_y + 37), (pug_base_x + 44),(pug_base_y + 41));

  return;
}

void pug3() {
  // ระดับพื้นดิน
  display.drawLine((pug_base_x + 4), (pug_base_y + 35), (pug_base_x + 47),(pug_base_y + 35));
  display.drawCircle((pug_base_x + 35), (pug_base_y + 14), 8);
  display.drawCircle((pug_base_x + 15), (pug_base_y + 16), 9);
  display.drawLine((pug_base_x + 30), (pug_base_y + 20), (pug_base_x + 27),(pug_base_y + 47));
  display.drawLine((pug_base_x + 27), (pug_base_y + 47), (pug_base_x + 21),(pug_base_y + 36));
  display.drawLine((pug_base_x + 21), (pug_base_y + 36), (pug_base_x + 20),(pug_base_y + 24));
  display.drawLine((pug_base_x + 23), (pug_base_y + 20), (pug_base_x + 25),(pug_base_y + 25));
  display.drawLine((pug_base_x + 25), (pug_base_y + 25), (pug_base_x + 27),(pug_base_y + 18));
  display.drawLine((pug_base_x + 21), (pug_base_y + 22), (pug_base_x + 13),(pug_base_y + 14));
  display.drawLine((pug_base_x + 18), (pug_base_y + 19), (pug_base_x + 11),(pug_base_y + 18));
  display.drawLine((pug_base_x + 17), (pug_base_y + 18), (pug_base_x + 17),(pug_base_y + 13));
  display.drawLine((pug_base_x + 29), (pug_base_y + 19), (pug_base_x + 35),(pug_base_y + 13));
  display.drawLine((pug_base_x + 31), (pug_base_y + 17), (pug_base_x + 31),(pug_base_y + 12));
  display.drawLine((pug_base_x + 32), (pug_base_y + 16), (pug_base_x + 39),(pug_base_y + 15));
  display.drawLine((pug_base_x + 19), (pug_base_y + 38), (pug_base_x + 15),(pug_base_y + 41));
  display.drawLine((pug_base_x + 22), (pug_base_y + 42), (pug_base_x + 20),(pug_base_y + 46));
  display.drawLine((pug_base_x + 29), (pug_base_y + 43), (pug_base_x + 32),(pug_base_y + 46));
  display.drawLine((pug_base_x + 31), (pug_base_y + 38), (pug_base_x + 37),(pug_base_y + 42));

  return;
}
void pug4() {
  // ระดับพื้นดิน
  display.drawLine((pug_base_x + 4), (pug_base_y + 35), (pug_base_x + 47),(pug_base_y + 35));
  display.drawCircle((pug_base_x + 12), (pug_base_y + 15), 6);
  display.drawCircle((pug_base_x + 36), (pug_base_y + 13), 6);
  display.drawCircle((pug_base_x + 23), (pug_base_y + 15), 2);
  display.drawLine((pug_base_x + 25), (pug_base_y + 20), (pug_base_x + 25),(pug_base_y + 38));
  display.drawLine((pug_base_x + 25), (pug_base_y + 27), (pug_base_x + 17),(pug_base_y + 18));
  display.drawLine((pug_base_x + 25), (pug_base_y + 22), (pug_base_x + 30),(pug_base_y + 16));
  display.drawLine((pug_base_x + 25), (pug_base_y + 20), (pug_base_x + 23),(pug_base_y + 17));
  display.drawLine((pug_base_x + 23), (pug_base_y + 37), (pug_base_x + 16),(pug_base_y + 41));
  display.drawLine((pug_base_x + 23), (pug_base_y + 40), (pug_base_x + 19),(pug_base_y + 45));
  display.drawLine((pug_base_x + 26), (pug_base_y + 40), (pug_base_x + 30),(pug_base_y + 45));
  display.drawLine((pug_base_x + 28), (pug_base_y + 37), (pug_base_x + 32),(pug_base_y + 42));
  display.drawLine((pug_base_x + 15), (pug_base_y + 17), (pug_base_x + 9),(pug_base_y + 17));
  display.drawLine((pug_base_x + 15), (pug_base_y + 17), (pug_base_x + 15),(pug_base_y + 13));

  return;
}