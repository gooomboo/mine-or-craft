import type { Actions } from "./input";
import { BLOCKS, isFluid, isSolid, LADDER, WATER } from "./blocks";
import type { World } from "./world";
import type { Dim, Difficulty, GameMode, Slot } from "./types";
import { getDef } from "./items";

const WIDTH = 0.6;
const HEIGHT = 1.8;
const EYE = 1.62;
const GRAVITY = 28;
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

    if (input.hotbar >= 0) this.hotbar = input.hotbar;
    this.sneaking = input.sneak && !this.flying;
    this.sprinting = input.sprint && input.moveY > 0.4 && !this.sneaking && this.hunger > 6;
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.shieldDisable = Math.max(0, this.shieldDisable - dt);
    this.squash += (1 - this.squash) * (1 - Math.exp(-12 * dt));
    if (this.regenT > 0) {
      this.regenT -= dt;
      this.health = Math.min(20, this.health + 2.4 * dt);
    }
    if (this.absorption > 0 && this.hurt <= 0) this.absorption = Math.max(0, this.absorption - 0.15 * dt);


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

    const f = this.forward();
    const r = this.right();
    let speed = this.sneaking ? SNEAK : this.sprinting ? SPRINT : WALK;
    if (this.inWater || this.inLava) speed = SWIM;
    if (this.flying) speed = FLY * (this.sprinting ? 1.6 : 1);
    if (this.mode === "creative" && !this.flying) speed *= 1.15;

    const wishX = f.x * input.moveY + r.x * input.moveX;
    const wishZ = f.z * input.moveY + r.z * input.moveX;

    if (this.flying) {
      this.vx = wishX * speed;
      this.vz = wishZ * speed;
      this.vy = (input.jump ? 1 : 0) * speed - (input.sneak ? 1 : 0) * speed;
    } else if (this.inWater || this.inLava) {
      this.vx += (wishX * speed - this.vx) * 4 * dt;
      this.vz += (wishZ * speed - this.vz) * 4 * dt;
      this.vy += dt * (input.jump ? 8 : -6);
      this.vy *= Math.max(0, 1 - 1.4 * dt);
    } else if (onLadder) {
      this.vx = wishX * 2;
      this.vz = wishZ * 2;
      this.vy = input.moveY > 0.1 || input.jump ? 3 : -2;
    } else {
      const accel = this.onGround ? 22 : 8.5;
      this.vx += (wishX * speed - this.vx) * accel * dt;
      this.vz += (wishZ * speed - this.vz) * accel * dt;
      this.vy -= GRAVITY * dt;
      if ((this.onGround || this.lastGround < COYOTE) && input.justJump) {
        this.vy = JUMP + (this.sprinting ? 0.35 : 0);
        this.onGround = false;
      } else if (this.autoJump && this.onGround && input.moveY > 0.3 && !this.sneaking) {
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

    if (this.mode === "survival" || this.mode === "hardcore") {
      this.tickSurvival(dt, world);
    }

    if (this.y < -20) this.hurtBy(4 * dt * 8, "void");
  }

  private moveAxis(world: World, dx: number, dy: number, dz: number) {
    const w = WIDTH, h = this.sneaking ? HEIGHT - 0.2 : HEIGHT;
    this.x += dx;
    if (world.collides(this.x - w / 2, this.y, this.z - w / 2, w, h, w)) {
      if (dx && this.onGround && !world.collides(this.x - w / 2, this.y + 0.55, this.z - w / 2, w, h, w)) {
        this.y += 0.55;
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
      if (dz && this.onGround && !world.collides(this.x - w / 2, this.y + 0.55, this.z - w / 2, w, h, w)) {
        this.y += 0.55;
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
    if (this.inLava) this.hurtBy(8 * dt, "lava");
    const head = world.getBlock(Math.floor(this.x), Math.floor(this.y + 1.6), Math.floor(this.z));
    if (head === WATER) {
      this.air -= dt;
      if (this.air <= 0) this.hurtBy(2 * dt, "drown");
    } else this.air = 10;
    const below = world.getBlock(Math.floor(this.x), Math.floor(this.y - 0.05), Math.floor(this.z));
    if (below === 76) this.hurtBy(2 * dt, "fire");
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
    if (this.invincible || this.mode === "creative") return;
    if (this.hurt > (this.mode === "survival" ? 0.32 : 0.42) && amount < 5) return;
    let a = amount;
    if (this.difficulty === "peaceful" && _src !== "void" && _src !== "drown" && _src !== "starve") a = 0;
    if (this.difficulty === "easy") a *= 0.6;
    if (this.difficulty === "hard") a *= 1.4;
    if (this.blocking) a *= 0.33;
    const ar = this.armorPoints();
    a *= 1 - Math.min(0.8, ar / 25);
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

  applyKnockback(dirX: number, dirZ: number, strength: number) {
    if (this.invincible || this.mode === "creative") return;
    let s = strength;
    if (this.blocking) s *= 0.22;
    const len = Math.hypot(dirX, dirZ) || 1;
    this.vx += (dirX / len) * s;
    this.vz += (dirZ / len) * s;
    this.vy += Math.min(6.2, 0.42 * s);
    this.onGround = false;
  }

  eat() {
    const s = this.selected;
    if (!s) return false;
    const food = getDef(s.id)?.food;
    if (!food) return false;
    const gapple = s.id === 10055;
    if (!gapple && this.hunger >= 20) return false;
    this.hunger = Math.min(20, this.hunger + food);
    if (gapple) {
      this.absorption = Math.max(this.absorption, 4);
      this.regenT = 5;
      this.health = Math.min(20, this.health + 2);
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