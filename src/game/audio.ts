export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  music: GainNode | null = null;
  unlocked = false;
  volumes = { master: 0.8, sfx: 0.9, music: 0.4 };
  private musicTimer = 0;
  private osc: OscillatorNode | null = null;

  unlock() {
    if (this.unlocked && this.ctx?.state === "running") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!this.ctx) {
      this.ctx = new AC({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.music.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.unlocked = true;
    this.applyVol();
  }

  applyVol() {
    if (!this.master || !this.sfx || !this.music || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.master ** 2, t, 0.03);
    this.sfx.gain.setTargetAtTime(this.volumes.sfx ** 2, t, 0.03);
    this.music.gain.setTargetAtTime(this.volumes.music ** 2, t, 0.03);
  }

  private beep(freq: number, dur: number, type: OscillatorType, vol = 0.15, slide = 0) {
    if (!this.ctx || !this.sfx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.sfx);
    o.start();
    o.stop(this.ctx.currentTime + dur + 0.02);
  }

  private noise(dur: number, vol = 0.08, lp = 1200) {
    if (!this.ctx || !this.sfx) return;
    const n = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  place() {
    this.beep(180 + Math.random() * 40, 0.08, "square", 0.08);
    this.noise(0.05, 0.04, 800);
  }
  break() {
    this.noise(0.12, 0.1, 1800);
    this.beep(120, 0.07, "sawtooth", 0.05, -60);
  }
  step() {
    this.noise(0.04, 0.035, 600 + Math.random() * 200);
  }
  hit() {
    this.beep(220, 0.08, "square", 0.12, -80);
  }
  hurt() {
    this.beep(140, 0.18, "sawtooth", 0.14, -90);
  }
  pop() {
    this.beep(520, 0.06, "square", 0.07);
  }
  craft() {
    this.beep(330, 0.1, "triangle", 0.08);
    this.beep(490, 0.12, "triangle", 0.06);
  }
  portal() {
    this.beep(90, 0.6, "sine", 0.1, 200);
  }
  ui() {
    this.beep(420, 0.04, "square", 0.05);
  }
  explode() {
    this.noise(0.4, 0.25, 400);
    this.beep(60, 0.4, "sawtooth", 0.12, -40);
  }
  jump() {
    this.beep(280, 0.08, "square", 0.05, -40);
    this.noise(0.04, 0.03, 900);
  }
  land() {
    this.noise(0.07, 0.06, 500);
    this.beep(90, 0.05, "triangle", 0.04);
  }
  eat() {
    this.noise(0.12, 0.05, 1400);
    this.beep(180, 0.08, "square", 0.04);
  }
  bow() {
    this.beep(520, 0.06, "triangle", 0.07, -120);
  }
  splash() {
    this.noise(0.18, 0.08, 1800);
    this.beep(240, 0.1, "sine", 0.04, -80);
  }
  blockHit() {
    this.beep(160, 0.05, "square", 0.08);
    this.noise(0.06, 0.05, 700);
  }
  dragon() {
    this.beep(80, 0.8, "sawtooth", 0.1, 40);
  }
  wraith() {
    this.beep(70, 1.2, "sine", 0.08, 30);
  }

  tickMusic(dt: number, night: boolean, nether: boolean, end: boolean) {
    this.musicTimer += dt;
    if (!this.ctx || !this.music) return;
    if (this.musicTimer > 16) {
      this.musicTimer = 0;
      const base = end ? 46 : nether ? 52 : night ? 60 : 74;
      const third = base * (nether ? 1.26 : 1.25);
      const fifth = base * (end ? 1.5 : 1.5);
      const now = this.ctx.currentTime;
      const chord = [base, third, fifth];
      for (let i = 0; i < chord.length; i++) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = i === 0 ? "sine" : "triangle";
        o.frequency.value = chord[i]!;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.028 - i * 0.006, now + 1.8);
        g.gain.linearRampToValueAtTime(0.0001, now + 11);
        o.connect(g);
        g.connect(this.music);
        o.start(now);
        o.stop(now + 11.2);
      }
    }
  }
}
