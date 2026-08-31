export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  music: GainNode | null = null;
  unlocked = false;
  volumes = { master: 0.8, sfx: 0.9, music: 0.4 };
  private musicTimer = 16;
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

  private noise(dur: number, vol = 0.08, lp = 1200, hp = 80) {
    if (!this.ctx || !this.sfx) return;
    const n = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * dur)), this.ctx.sampleRate);
    const d = n.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.65 + white * 0.35;
      d[i] = last;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lp;
    const h = this.ctx.createBiquadFilter();
    h.type = "highpass";
    h.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(h);
    h.connect(f);
    f.connect(g);
    g.connect(this.sfx);
    src.start();
  }

  place() {
    this.noise(0.07, 0.07, 900, 120);
    this.beep(160 + Math.random() * 50, 0.06, "square", 0.05);
  }
  break() {
    this.noise(0.16, 0.14, 2200, 90);
    this.beep(90 + Math.random() * 40, 0.1, "sawtooth", 0.07, -70);
  }
  step() {
    this.noise(0.06, 0.09, 520 + Math.random() * 220, 60);
    this.beep(90 + Math.random() * 30, 0.04, "triangle", 0.03);
  }
  hit() {
    this.noise(0.09, 0.14, 1800, 180);
    this.beep(240, 0.08, "square", 0.12, -140);
    this.beep(90, 0.1, "sawtooth", 0.08, -40);
  }
  hurt() {
    this.beep(130, 0.2, "sawtooth", 0.16, -100);
    this.noise(0.12, 0.08, 700, 60);
  }
  pop() {
    this.beep(620, 0.05, "square", 0.06);
    this.beep(880, 0.04, "triangle", 0.04);
  }
  craft() {
    this.beep(330, 0.09, "triangle", 0.08);
    this.beep(494, 0.11, "triangle", 0.06);
    this.beep(660, 0.14, "sine", 0.05);
  }
  portal() {
    this.beep(70, 0.7, "sine", 0.1, 240);
    this.beep(110, 0.55, "triangle", 0.05, 180);
    this.noise(0.4, 0.05, 600, 40);
  }
  ui() {
    this.beep(420, 0.04, "square", 0.05);
  }
  explode() {
    this.noise(0.45, 0.28, 500, 30);
    this.beep(55, 0.45, "sawtooth", 0.14, -30);
  }
  jump() {
    this.beep(300, 0.07, "square", 0.045, -50);
    this.noise(0.04, 0.03, 1100, 200);
  }
  land() {
    this.noise(0.08, 0.07, 420, 50);
    this.beep(80, 0.05, "triangle", 0.04);
  }
  eat() {
    this.noise(0.14, 0.06, 1600, 300);
    this.beep(170, 0.07, "square", 0.04);
    this.beep(220, 0.05, "square", 0.03);
  }
  bow() {
    this.beep(540, 0.05, "triangle", 0.07, -140);
    this.noise(0.06, 0.04, 2400, 400);
  }
  splash() {
    this.noise(0.2, 0.09, 2000, 250);
    this.beep(230, 0.1, "sine", 0.04, -90);
  }
  blockHit() {
    this.beep(150, 0.05, "square", 0.08);
    this.noise(0.07, 0.06, 800, 120);
  }
  dragon() {
    this.beep(72, 0.9, "sawtooth", 0.11, 50);
    this.noise(0.5, 0.08, 300, 20);
  }
  wraith() {
    this.beep(64, 1.3, "sine", 0.08, 40);
    this.beep(96, 1.1, "triangle", 0.04, 20);
  }

  swing() {
    this.noise(0.06, 0.06, 2600, 400);
    this.beep(180, 0.05, "square", 0.04, -70);
  }
  shield() {
    this.beep(420, 0.07, "triangle", 0.12, -40);
    this.beep(180, 0.08, "square", 0.06);
    this.noise(0.08, 0.07, 1400, 160);
  }
  death() {
    this.beep(98, 0.5, "sawtooth", 0.15, -80);
    this.noise(0.4, 0.14, 500, 40);
  }
  levelup() {
    this.beep(523, 0.12, "triangle", 0.1);
    this.beep(659, 0.14, "triangle", 0.08);
    this.beep(784, 0.2, "sine", 0.07);
  }
  pearl() {
    this.beep(200, 0.2, "sine", 0.08, 200);
    this.noise(0.14, 0.05, 1500, 200);
  }
  click() {
    this.beep(680, 0.03, "square", 0.04);
  }
  whoosh() {
    this.noise(0.09, 0.07, 2600, 500);
    this.beep(400, 0.07, "sine", 0.04, -180);
  }

  tickMusic(dt: number, night: boolean, nether: boolean, end: boolean) {
    this.musicTimer += dt;
    if (!this.ctx || !this.music) return;
    if (this.musicTimer > 14) {
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

  tickMenu(dt: number) {
    this.applyVol();
    this.tickMusic(dt, false, false, false);
  }

  hush() {
    if (!this.ctx || !this.music) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(0.0001, t, 0.08);
  }

  playUrl(url: string) {
    if (!url) {
      this.craft();
      return;
    }
    try {
      const a = new Audio(url);
      a.volume = Math.max(0, Math.min(1, this.volumes.master * this.volumes.sfx));
      void a.play();
    } catch {
      this.craft();
    }
  }

  playNamed(name: string, pack: Array<{ name: string; dataUrl: string }> = []) {
    const key = (name || "").trim().toLowerCase();
    const hit = pack.find((s) => s.name.toLowerCase() === key);
    if (hit?.dataUrl) {
      this.playUrl(hit.dataUrl);
      return;
    }
    const builtins: Record<string, () => void> = {
      place: () => this.place(),
      break: () => this.break(),
      hit: () => this.hit(),
      hurt: () => this.hurt(),
      jump: () => this.jump(),
      step: () => this.step(),
      explode: () => this.explode(),
      portal: () => this.portal(),
      craft: () => this.craft(),
      pop: () => this.pop(),
      dragon: () => this.dragon(),
      click: () => this.click(),
    };
    (builtins[key] ?? (() => this.craft()))();
  }
}
