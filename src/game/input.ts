export interface Actions {
  moveX: number;
  moveY: number;
  jump: boolean;
  sneak: boolean;
  sprint: boolean;
  attack: boolean;
  use: boolean;
  inventory: boolean;
  pause: boolean;
  drop: boolean;
  chat: boolean;
  hotbar: number;
  lookX: number;
  lookY: number;
  justJump: boolean;
  justAttack: boolean;
  justUse: boolean;
  justInventory: boolean;
  justPause: boolean;
  justDrop: boolean;
  justChat: boolean;
  justCamera: boolean;
  justDebug: boolean;
  block: boolean;
}

const empty = (): Actions => ({
  moveX: 0,
  moveY: 0,
  jump: false,
  sneak: false,
  sprint: false,
  attack: false,
  use: false,
  inventory: false,
  pause: false,
  drop: false,
  chat: false,
  hotbar: -1,
  lookX: 0,
  lookY: 0,
  justJump: false,
  justAttack: false,
  justUse: false,
  justInventory: false,
  justPause: false,
  justDrop: false,
  justChat: false,
  justCamera: false,
  justDebug: false,
  block: false,
});

export class Input {
  keys = new Set<string>();
  forced = new Set<string>();
  lookDX = 0;
  lookDY = 0;
  private prev: Actions = empty();
  actions: Actions = empty();
  pointerLocked = false;
  invertY = false;
  invertX = false;
  sens = 0.22;
  touchLookSens = 1;
  sneakToggle = false;
  sprintToggle = false;
  private sneakLatch = false;
  private sprintLatch = false;
  touchMove = { x: 0, y: 0 };
  touchLook = { x: 0, y: 0 };
  touchJump = false;
  touchSneak = false;
  touchAttack = false;
  touchUse = false;
  touchSprint = false;
  touchBlock = false;
  enabled = true;
  private el: HTMLElement | null = null;

  attach(el: HTMLElement) {
    this.el = el;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.onVis);
    el.addEventListener("mousemove", this.onMouse);
    el.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    document.addEventListener("pointerlockchange", this.onLock);
    el.addEventListener("contextmenu", this.prevent);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.onVis);
    this.el?.removeEventListener("mousemove", this.onMouse);
    this.el?.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    document.removeEventListener("pointerlockchange", this.onLock);
    this.el?.removeEventListener("contextmenu", this.prevent);
    this.el = null;
  }

  private prevent = (e: Event) => e.preventDefault();

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) {
      e.preventDefault();
    }
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private clear = () => {
    this.keys.clear();
    this.forced.clear();
  };

  private onVis = () => {
    if (document.hidden) this.clear();
  };

  private onMouse = (e: MouseEvent) => {
    if (!this.pointerLocked) return;
    this.lookDX += e.movementX;
    this.lookDY += e.movementY;
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.enabled) return;
    if (e.button === 0) this.keys.add("Mouse0");
    if (e.button === 2) this.keys.add("Mouse2");
    if (!this.pointerLocked && this.el && !("ontouchstart" in window)) {
      this.el.requestPointerLock?.({ unadjustedMovement: true } as PointerLockOptions).catch(() => {
        this.el?.requestPointerLock?.();
      });
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) this.keys.delete("Mouse0");
    if (e.button === 2) this.keys.delete("Mouse2");
  };

  private onLock = () => {
    this.pointerLocked = document.pointerLockElement === this.el;
  };

  has(code: string) {
    return this.keys.has(code) || this.forced.has(code);
  }

  setKeys(codes: string[]) {
    this.forced = new Set(codes);
  }

  poll(): Actions {
    const a = empty();
    const w = this.has("KeyW") || this.has("ArrowUp");
    const s = this.has("KeyS") || this.has("ArrowDown");
    const d = this.has("KeyD") || this.has("ArrowRight");
    const aa = this.has("KeyA") || this.has("ArrowLeft");
    a.moveX = (d ? 1 : 0) - (aa ? 1 : 0) + this.touchMove.x;
    a.moveY = (w ? 1 : 0) - (s ? 1 : 0) + this.touchMove.y;
    const mag = Math.hypot(a.moveX, a.moveY);
    if (mag > 1) {
      a.moveX /= mag;
      a.moveY /= mag;
    }
    a.jump = this.has("Space") || this.touchJump;

    const sneakHeld = this.has("ShiftLeft") || this.has("ShiftRight") || this.touchSneak;
    const sprintHeld = this.has("ControlLeft") || this.has("ControlRight") || this.has("KeyR") || this.touchSprint;
    if (this.sneakToggle) {
      if (sneakHeld && !this.prev.sneak) this.sneakLatch = !this.sneakLatch;
      a.sneak = this.sneakLatch;
    } else {
      a.sneak = sneakHeld;
    }
    if (this.sprintToggle) {
      if (sprintHeld && !this.prev.sprint) this.sprintLatch = !this.sprintLatch;
      a.sprint = this.sprintLatch;
    } else {
      a.sprint = sprintHeld;
    }

    a.attack = this.has("Mouse0") || this.touchAttack;
    a.use = this.has("Mouse2") || this.touchUse;
    a.block = this.touchBlock || this.has("KeyC");
    a.inventory = this.has("KeyE");
    a.pause = this.has("Escape");
    a.drop = this.has("KeyQ");
    a.chat = this.has("Slash") || this.has("KeyT");
    a.lookX = this.lookDX * this.sens * 0.012 * (this.invertX ? -1 : 1) + this.touchLook.x * this.touchLookSens;
    a.lookY = this.lookDY * this.sens * 0.012 * (this.invertY ? -1 : 1) + this.touchLook.y * this.touchLookSens;
    this.lookDX = 0;
    this.lookDY = 0;
    this.touchLook.x = 0;
    this.touchLook.y = 0;
    for (let i = 0; i < 9; i++) {
      if (this.has(`Digit${i + 1}`)) a.hotbar = i;
    }
    a.justJump = a.jump && !this.prev.jump;
    a.justAttack = a.attack && !this.prev.attack;
    a.justUse = a.use && !this.prev.use;
    a.justInventory = a.inventory && !this.prev.inventory;
    a.justPause = a.pause && !this.prev.pause;
    a.justDrop = a.drop && !this.prev.drop;
    a.justChat = a.chat && !this.prev.chat;
    a.justCamera = this.has("F5") && !this._camHeld;
    a.justDebug = this.has("F3") && !this._dbgHeld;
    this._camHeld = this.has("F5");
    this._dbgHeld = this.has("F3");
    this.prev = { ...a, sneak: sneakHeld, sprint: sprintHeld };
    this.actions = a;
    return a;
  }

  private _camHeld = false;
  private _dbgHeld = false;
}