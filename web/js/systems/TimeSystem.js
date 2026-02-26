export class TimeSystem {
  constructor() {
    this.isPaused = false;
    this.gameSpeed = 1;
    this.hour = 6; // Start at 6 AM
    this.day = 1;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setSpeed(speed) {
    this.gameSpeed = Math.max(0.1, Math.min(5, speed));
  }

  cycleSpeed() {
    const speeds = [0, 1, 2, 3];
    const currentIndex = speeds.indexOf(this.gameSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    this.gameSpeed = speeds[nextIndex];
    return this.gameSpeed;
  }

  update(dt) {
    if (this.isPaused || this.gameSpeed === 0) {
      return 0;
    }

    // Time passes: dt is seconds, we want 1 real second = 1 game minute at speed 1
    const effectiveDt = dt * this.gameSpeed * 0.1;
    this.hour += effectiveDt;

    if (this.hour >= 24) {
      this.hour -= 24;
      this.day += 1;
      console.log(`Day ${this.day} begins`);
    }

    return effectiveDt;
  }

  getTimeString() {
    const hours = Math.floor(this.hour);
    const minutes = Math.floor((this.hour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  isDaytime() {
    return this.hour >= 6 && this.hour < 20;
  }

  isNighttime() {
    return !this.isDaytime();
  }
}
