import type { Actions } from "./input";
import { BLOCKS, BLUE_ICE, COBWEB, HAY, HONEY_BLOCK, ICE, isFluid, isSolid, LADDER, PACKED_ICE, SLIME_BLOCK, SOUL_SAND, WATER } from "./blocks";
import type { World } from "./world";
import type { Dim, Difficulty, GameMode, Slot } from "./types";
import { ELYTRA, getDef } from "./items";

const WIDTH = 0.6;
const HEIGHT = 1.8;
const EYE = 1.62;
const GRAVITY = 32;
const JUMP = 8.4;
const WALK = 4.317;
const SPRINT = 5.612;
const SNEAK = 1.295;
const FLY = 10.8;
const SWIM = 2.2;
const COYOTE = 0.12;

export class Player {
  x = 0;
  y = 80;
  z = 0;
  vx = 0;
  vy = 0;
  vz = 0;
  yaw = 0;
  pitch = 0;
  onGround = false;
  flying = false;
  sneaking = false;
  sprinting = false;
  inWater = false;
  inLava = false;
  health = 20;
  hunger = 20;
  xp = 0;
  xpLevel = 0;
  dim: Dim = "overworld";
  mode: GameMode = "survival";
  invincible = false;
  inventory: Slot[] = Array.from({ length: 36 }, () => null);
  armor: Slot[] = [null, null, null, null];
  offhand: Slot = null;
  hotbar = 0;
  bob = 0;
  swing = 0;
  hurt = 0;
  mining = 0;
  miningPos: { x: number; y: number; z: number } | null = null;
  lastGround = 0;
  flyPressed = 0;
  blocking = false;
  sat = 5;
  hungerTick = 0;
  drowned = 0;
  air = 10;
  autoJump = false;
  difficulty: Difficulty = "normal";
  lastHurtAmt = 0;
  attackCd = 0;
  attackCdMax = 0.625;
  absorption = 0;
  regenT = 0;
  kills = 0;
  shieldDisable = 0;
  squash = 1;
  wet = 0;
  riding = false;
  gliding = false;
  speedT = 0;
  fireResT = 0;
  nightT = 0;
  strengthT = 0;
  jumpBoostT = 0;
  waterBreathT = 0;
  invisT = 0;
  jumpHeld = false;
  fallStartY: number | null = null;


  get selected(): Slot {
    return this.inventory[this.hotbar] ?? null;
  }

  eyeY() {
    return this.y + (this.sneaking ? EYE - 0.2 : EYE);
  }

  forward() {
    return { x: -Math.sin(this.yaw), z: -Math.cos(this.yaw) };
  }

  right() {
    return { x: Math.cos(this.yaw), z: -Math.sin(this.yaw) };
  }

  lookDir() {
    const cp = Math.cos(this.pitch);
    return {
      x: -Math.sin(this.yaw) * cp,
      y: Math.sin(this.pitch),
      z: -Math.cos(this.yaw) * cp,
    };
  }

  update(dt: number, input: Actions, world: World) {
    this.yaw -= input.lookX;
    this.pitch -= input.lookY;
    const lim = Math.PI / 2 - 0.01;
    if (this.pitch > lim) this.pitch = lim;
    if (this.pitch < -lim) this.pitch = -lim;

    this.speedT = Math.max(0, this.speedT - dt);
    this.fireResT = Math.max(0, this.fireResT - dt);
    this.nightT = Math.max(0, this.nightT - dt);
    this.strengthT = Math.max(0, this.strengthT - dt);
    this.jumpBoostT = Math.max(0, this.jumpBoostT - dt);
    this.waterBreathT = Math.max(0, this.waterBreathT - dt);
    this.invisT = Math.max(0, this.invisT - dt);

    if (this.riding) {
      if (input.justJump) this.riding = false;
      return;
    }

    if (input.hotbar >= 0) this.hotbar = input.hotbar;
    this.sneaking = input.sneak && !this.flying;
    this.sprinting = input.sprint && input.moveY > 0.4 && !this.sneaking && this.hunger > 6;
    this.jumpHeld = input.jump;
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.shieldDisable = Math.max(0, this.shieldDisable - dt);
    this.squash += (1 - this.squash) * (1 - Math.exp(-12 * dt));
    if (this.regenT > 0) {
      this.regenT -= dt;
      this.health = Math.min(20, this.health + 2.4 * dt);
    }
    if (this.absorption > 0 && this.hurt <= 0) this.absorption = Math.max(0, this.absorption - 0.15 * dt);

    const f = this.forward();
    const r = this.right();
    const wishX = f.x * input.moveY + r.x * input.moveX;
    const wishZ = f.z * input.moveY + r.z * input.moveX;

    if (this.mode === "spectator") {
      this.flying = true;
      this.invincible = true;
      this.vx = wishX * FLY * 1.4;
      this.vz = wishZ * FLY * 1.4;
      this.vy = (input.jump ? 1 : 0) * FLY - (input.sneak ? 1 : 0) * FLY;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.z += this.vz * dt;
      return;
    }

    if (this.mode === "creative") {
      if (input.justJump) {
        const now = performance.now();
        if (now - this.flyPressed < 350) this.flying = !this.flying;
        this.flyPressed = now;
      }
    } else {
      this.flying = false;
    }

    const feetId = world.getBlock(Math.floor(this.x), Math.floor(this.y + 0.4), Math.floor(this.z));
    const headId = world.getBlock(Math.floor(this.x), Math.floor(this.y + 1.5), Math.floor(this.z));
    this.inWater = (isFluid(feetId) && BLOCKS[feetId]?.fluid === 1) || (isFluid(headId) && BLOCKS[headId]?.fluid === 1);
    this.inLava = BLOCKS[feetId]?.fluid === 2 || BLOCKS[headId]?.fluid === 2;
    const onLadder = feetId === LADDER || headId === LADDER;
    if (this.inWater || this.inLava) this.wet = 1;
    else this.wet = Math.max(0, this.wet - dt * 1.6);

    const chest = this.armor[1]?.id;
    if (chest === ELYTRA && !this.onGround && !this.inWater && !this.flying && this.vy < -0.55) {
      if (input.jump || this.gliding) this.gliding = true;
    }
    if (this.onGround || this.inWater || this.flying) this.gliding = false;

    let speed = this.sneaking ? SNEAK : this.sprinting ? SPRINT : WALK;
    if (this.speedT > 0) speed *= 1.45;
    if (this.inWater || this.inLava) speed = SWIM * (this.speedT > 0 ? 1.25 : 1);
    if (this.flying) speed = FLY * (this.sprinting ? 1.6 : 1);
    if (this.mode === "creative" && !this.flying) speed *= 1.15;

    if (this.flying) {
      this.vx = wishX * speed;
      this.vz = wishZ * speed;
      this.vy = (input.jump ? 1 : 0) * speed - (input.sneak ? 1 : 0) * speed;
    } else if (this.gliding) {
      const look = this.lookDir();
      this.vy -= 4.2 * dt;
      this.vx += look.x * 22 * dt;
      this.vz += look.z * 22 * dt;
      this.vy += look.y * 16 * dt;
      const sp = Math.hypot(this.vx, this.vy, this.vz);
      const cap = 28;
      if (sp > cap) {
        this.vx *= cap / sp;
        this.vy *= cap / sp;
        this.vz *= cap / sp;
      }
      this.vx *= Math.max(0, 1 - 0.35 * dt);
      this.vz *= Math.max(0, 1 - 0.35 * dt);
    } else if (this.inWater || this.inLava) {
      this.vx += (wishX * speed - this.vx) * 4 * dt;
      this.vz += (wishZ * speed - this.vz) * 4 * dt;
      const headInFluid = isFluid(headId);
      if (input.jump) {
        this.vy += (headInFluid ? 9.8 : 14.5) * dt;
        if (!headInFluid) {
          this.vy = Math.max(this.vy, 8.4);
          this.inWater = false;
          this.inLava = false;
        }
        this.tryShoreHop(world, f);
      } else {
        this.vy += -6.8 * dt;
      }
      this.vy *= Math.max(0, 1 - 1.15 * dt);
      this.fallStartY = null;
    } else if (onLadder) {
      this.vx = wishX * 2;
      this.vz = wishZ * 2;
      this.vy = input.moveY > 0.1 || input.jump ? 3 : -2;
    } else {
      const below = world.getBlock(Math.floor(this.x), Math.floor(this.y - 0.05), Math.floor(this.z));
      const ice = below === ICE || below === PACKED_ICE || below === BLUE_ICE;
      const honey = below === HONEY_BLOCK;
      const soul = below === SOUL_SAND;
      const accel = this.onGround ? (ice ? 3.2 : honey ? 8 : soul ? 10 : 22) : 8.5;
      const slip = honey ? 0.45 : soul ? 0.4 : 1;
      this.vx += (wishX * speed * slip - this.vx) * accel * dt;
      this.vz += (wishZ * speed * slip - this.vz) * accel * dt;
      this.vy -= GRAVITY * dt;
      const jumpPow = JUMP + (this.sprinting ? 0.35 : 0) + (this.jumpBoostT > 0 ? 2.2 : 0);
      if ((this.onGround || this.lastGround < COYOTE) && input.jump) {
        this.vy = jumpPow;
        this.onGround = false;
        this.lastGround = COYOTE;
      } else if (this.autoJump && this.onGround && input.moveY > 0.3 && !this.sneaking && !this.inWater) {
        const fx = Math.floor(this.x + f.x * 0.85);
        const fz = Math.floor(this.z + f.z * 0.85);
        const fy = Math.floor(this.y);
        const front = world.getBlock(fx, fy, fz);
        const above = world.getBlock(fx, fy + 1, fz);
        const head = world.getBlock(fx, fy + 2, fz);
        if (isSolid(front) && !isSolid(above) && !isSolid(head)) {
          this.vy = JUMP;
          this.onGround = false;
        }
      }
    }

    this.moveAxis(world, this.vx * dt, 0, 0);
    this.moveAxis(world, 0, this.vy * dt, 0);
    this.moveAxis(world, 0, 0, this.vz * dt);

    const web = world.getBlock(Math.floor(this.x), Math.floor(this.y + 0.8), Math.floor(this.z));
    if (web === COBWEB) {
      this.vx *= 0.22;
      this.vz *= 0.22;
      this.vy *= 0.18;
      this.fallStartY = null;
    }

    if (this.onGround) {
      if (this.fallStartY !== null) {
        this.applyFall(this.fallStartY - this.y, world);
        this.fallStartY = null;
      }
    } else if (this.fallStartY === null && !this.inWater && !this.inLava && !this.flying) {
      this.fallStartY = this.y;
    }

    if (this.onGround) this.lastGround = 0;
    else this.lastGround += dt;

    const horiz = Math.hypot(this.vx, this.vz);
    if (this.onGround && horiz > 0.4) this.bob += dt * horiz * 1.6;
    this.swing = Math.max(0, this.swing - dt * 4);
    this.hurt = Math.max(0, this.hurt - dt);
    this.blocking =
      this.shieldDisable <= 0 &&
      (input.use || input.block) &&
      (this.offhand?.id === 10031 || this.selected?.id === 10031);

    if (this.mode === "survival" || this.mode === "hardcore" || this.mode === "adventure") {
      this.tickSurvival(dt, world);
    }

    if (this.y < -20) this.hurtBy(4 * dt * 8, "void");
  }

  private tryShoreHop(world: World, f: { x: number; z: number }) {
    const probes = [
      { x: f.x, z: f.z },
      { x: f.x + f.z * 0.35, z: f.z - f.x * 0.35 },
      { x: f.x - f.z * 0.35, z: f.z + f.x * 0.35 },
    ];
    const fy = Math.floor(this.y);
    for (const p of probes) {
      const fx = Math.floor(this.x + p.x * 0.95);
      const fz = Math.floor(this.z + p.z * 0.95);
      const front = world.getBlock(fx, fy, fz);
      const above = world.getBlock(fx, fy + 1, fz);
      const head = world.getBlock(fx, fy + 2, fz);
      const shore = isSolid(front) && !isSolid(above) && !isSolid(head);
      const ledge = !isSolid(front) && isSolid(world.getBlock(fx, fy - 1, fz)) && !isSolid(above);
      if (shore || ledge) {
        this.vy = Math.max(this.vy, 10.4);
        this.y += 0.42;
        this.vx += p.x * 3.4;
        this.vz += p.z * 3.4;
        this.inWater = false;
        this.wet = 0.55;
        this.onGround = false;
        return;
      }
    }
  }

  private applyFall(dist: number, world: World) {
    if (this.invincible || this.flying || this.mode === "creative" || this.mode === "spectator") return;
    if (this.inWater || this.inLava) return;
    const below = world.getBlock(Math.floor(this.x), Math.floor(this.y - 0.05), Math.floor(this.z));
    const feet = world.getBlock(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    if (isFluid(feet) || isFluid(below) || feet === WATER) return;
    if (below === SLIME_BLOCK) {
      this.vy = Math.min(12, Math.max(4, dist * 1.45));
      this.onGround = false;
      return;
    }
    if (below === COBWEB) return;
    if (below === HAY) dist *= 0.2;
    if (dist <= 3.05) return;
    this.hurtBy(Math.floor(dist - 3), "fall");
  }

  private moveAxis(world: World, dx: number, dy: number, dz: number) {
    const w = WIDTH, h = this.sneaking ? HEIGHT - 0.2 : HEIGHT;
    const step = this.inWater || this.wet > 0 ? 1.05 : 0.55;
    const canStep = this.jumpHeld ? this.onGround || this.inWater || this.wet > 0 : this.onGround && !this.inWater;
    this.x += dx;
    if (world.collides(this.x - w / 2, this.y, this.z - w / 2, w, h, w)) {
      if (dx && canStep && !world.collides(this.x - w / 2, this.y + step, this.z - w / 2, w, h, w)) {
        this.y += step;
        if (this.inWater && this.jumpHeld) {
          this.inWater = false;
          this.vy = Math.max(this.vy, 6.2);
        }
      } else {
        this.x -= dx;
        if (dx) this.vx = 0;
      }
    }
    this.y += dy;
    if (world.collides(this.x - w / 2, this.y, this.z - w / 2, w, h, w)) {
      this.y -= dy;
      if (dy < 0) {
        this.onGround = true;
        this.vy = 0;
      } else if (dy > 0) {
        this.vy = 0;
      }
    } else if (dy !== 0) {
      this.onGround = false;
    }
    this.z += dz;
    if (world.collides(this.x - w / 2, this.y, this.z - w / 2, w, h, w)) {
      if (dz && canStep && !world.collides(this.x - w / 2, this.y + step, this.z - w / 2, w, h, w)) {
        this.y += step;
        if (this.inWater && this.jumpHeld) {
          this.inWater = false;
          this.vy = Math.max(this.vy, 6.2);
        }
      } else {
        this.z -= dz;
        if (dz) this.vz = 0;
      }
    }
  }

  private tickSurvival(dt: number, world: World) {
    const hungerMul = this.difficulty === "hard" ? 1.35 : this.difficulty === "easy" ? 0.7 : 1;
    this.hungerTick += dt;
    if (this.hungerTick > 8) {
      this.hungerTick = 0;
      if (this.sprinting || Math.hypot(this.vx, this.vz) > 3) this.hunger = Math.max(0, this.hunger - 0.4 * hungerMul);
    }
    if (this.hunger <= 0) this.hurtBy(1 * dt, "starve");
    if (this.hunger >= 18 && this.health < 20) this.health = Math.min(20, this.health + 0.6 * dt);
    if (this.inLava && this.fireResT <= 0) this.hurtBy(8 * dt, "lava");
    const head = world.getBlock(Math.floor(this.x), Math.floor(this.y + 1.6), Math.floor(this.z));
    if (head === WATER && this.waterBreathT <= 0) {
      this.air -= dt;
      if (this.air <= 0) this.hurtBy(2 * dt, "drown");
    } else this.air = 10;
    const below = world.getBlock(Math.floor(this.x), Math.floor(this.y - 0.05), Math.floor(this.z));
    if (below === 76 && this.fireResT <= 0) this.hurtBy(2 * dt, "fire");
  }

  armorPoints(): number {
    let n = 0;
    for (const s of this.armor) {
      if (!s) continue;
      n += getDef(s.id)?.armor ?? 0;
    }
    return n;
  }

  hurtBy(amount: number, _src: string) {
    if (this.invincible || this.mode === "creative" || this.mode === "spectator") return;
    if (_src !== "duelist" && this.hurt > (this.mode === "survival" ? 0.32 : 0.42) && amount < 5) return;
    let a = amount;
    if (this.difficulty === "peaceful" && _src !== "void" && _src !== "drown" && _src !== "starve" && _src !== "duelist") a = 0;
    if (this.difficulty === "easy") a *= 0.6;
    if (this.difficulty === "hard") a *= 1.25;
    if (this.blocking) a *= 0.33;
    const ar = this.armorPoints();
    const red = Math.min(20, Math.max(ar / 5, ar - a / 2)) / 25;
    a *= 1 - Math.min(0.8, Math.max(0, red));
    if (this.absorption > 0) {
      const take = Math.min(this.absorption, a);
      this.absorption -= take;
      a -= take;
    }
    this.health -= a;
    this.hurt = 0.5;
    this.lastHurtAmt = a;
    if (this.health < 0) this.health = 0;
  }

  tryPopTotem(): boolean {
    const pop = () => {
      this.health = 1;
      this.absorption = 8;
      this.regenT = 8;
      this.hurt = 0.35;
      this.lastHurtAmt = 0;
    };
    if (this.offhand?.id === 10105) {
      this.offhand = null;
      pop();
      return true;
    }
    for (let i = 0; i < 36; i++) {
      if (this.inventory[i]?.id === 10105) {
        this.inventory[i] = null;
        pop();
        return true;
      }
    }
    return false;
  }

  applyKnockback(dirX: number, dirZ: number, strength: number, grounded = false) {
    if (this.invincible || this.mode === "creative" || this.mode === "spectator") return;
    let s = strength;
    if (this.blocking) s *= 0.22;
    const len = Math.hypot(dirX, dirZ) || 1;
    const horiz = grounded ? Math.min(2.8, s * 0.48) : Math.min(6.5, s);
    this.vx += (dirX / len) * horiz;
    this.vz += (dirZ / len) * horiz;
    const lift = grounded ? Math.min(0.42, 0.05 * s) : Math.min(1.05, 0.14 * s);
    this.vy = Math.min(grounded ? 2.4 : 4.6, Math.max(this.vy, 0) + lift);
    this.onGround = false;
  }

  eat() {
    const s = this.selected;
    if (!s) return false;
    const food = getDef(s.id)?.food;
    if (!food) return false;
    const gapple = s.id === 10055;
    const eapple = s.id === 10164;
    if (!gapple && !eapple && this.hunger >= 20) return false;
    this.hunger = Math.min(20, this.hunger + food);
    if (gapple || eapple) {
      this.absorption = Math.max(this.absorption, eapple ? 8 : 4);
      this.regenT = eapple ? 20 : 5;
      this.health = Math.min(20, this.health + (eapple ? 6 : 2));
    }
    s.count--;
    if (s.count <= 0) this.inventory[this.hotbar] = null;
    return true;
  }

  give(id: number, count = 1): boolean {
    const max = getDef(id)?.stack ?? 64;
    for (let i = 0; i < 36; i++) {
      const s = this.inventory[i];
      if (s && s.id === id && s.count < max) {
        const add = Math.min(max - s.count, count);
        s.count += add;
        count -= add;
        if (count <= 0) return true;
      }
    }
    for (let i = 0; i < 36; i++) {
      if (!this.inventory[i]) {
        const add = Math.min(max, count);
        this.inventory[i] = { id, count: add };
        count -= add;
        if (count <= 0) return true;
      }
    }
    return count <= 0;
  }

  takeSelected(n = 1) {
    const s = this.selected;
    if (!s) return;
    s.count -= n;
    if (s.count <= 0) this.inventory[this.hotbar] = null;
  }
}
