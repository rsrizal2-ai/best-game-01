// NEONVOID — the things that move and fight: the player ship, bullets and
// the five enemy kinds. Movement, aiming, firing and damage live here;
// waves decide what spawns, the renderer decides how it looks.

import { ARENA, PLAYER, ENEMY_TYPES, ENEMY_BULLET } from './config.js';

export function circlesOverlap(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}

export class PlayerShip {
  constructor() {
    this.x = ARENA.width / 2;
    this.y = ARENA.height / 2 + 120;
    this.vx = 0;
    this.vy = 0;
    this.radius = PLAYER.radius;
    this.angle = -Math.PI / 2;
    this.hp = PLAYER.maxHp;
    this.maxHp = PLAYER.maxHp;
    this.maxSpeed = PLAYER.maxSpeed;
    this.bulletDamage = PLAYER.bulletDamage;
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.fireInterval = PLAYER.fireInterval;
    this.projectiles = 1;
    this.pierce = 0;
    this.regenPerSecond = PLAYER.regenPerSecond;
    this.fireTimer = 0;
    this.invulnerableUntil = 0;
    this.alive = true;
  }

  update(dt, input, now) {
    const move = input.moveVector();
    this.vx += move.x * PLAYER.accel * dt;
    this.vy += move.y * PLAYER.accel * dt;
    this.vx *= PLAYER.friction;
    this.vy *= PLAYER.friction;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }
    this.x = Math.min(ARENA.width - ARENA.margin, Math.max(ARENA.margin, this.x + this.vx * dt));
    this.y = Math.min(ARENA.height - ARENA.margin, Math.max(ARENA.margin + 34, this.y + this.vy * dt));
    this.angle = Math.atan2(input.mouseY - this.y, input.mouseX - this.x);
    if (this.regenPerSecond > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenPerSecond * dt);
    }
    this.fireTimer -= dt;
    return now < this.invulnerableUntil;
  }

  // Returns freshly fired bullets (empty when the trigger is up or cooling).
  tryFire(input) {
    if (!input.mouseDown || this.fireTimer > 0) return [];
    this.fireTimer = this.fireInterval;
    const bullets = [];
    const spread = 0.14;
    const count = this.projectiles;
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = this.angle + offset;
      bullets.push(new Bullet(
        this.x + Math.cos(angle) * (this.radius + 8),
        this.y + Math.sin(angle) * (this.radius + 8),
        Math.cos(angle) * this.bulletSpeed,
        Math.sin(angle) * this.bulletSpeed,
        this.bulletDamage,
        this.pierce,
        true,
      ));
    }
    return bullets;
  }

  hurt(damage, now) {
    if (now < this.invulnerableUntil || !this.alive) return false;
    this.hp -= damage;
    this.invulnerableUntil = now + PLAYER.invulnerableMs / 1000;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return true;
  }
}

export class Bullet {
  constructor(x, y, vx, vy, damage, pierce, friendly) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.pierce = pierce;
    this.friendly = friendly;
    this.radius = friendly ? PLAYER.bulletRadius : ENEMY_BULLET.radius;
    this.life = 2.2;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < -20 || this.x > ARENA.width + 20 || this.y < -20 || this.y > ARENA.height + 20) {
      this.dead = true;
    }
  }
}

let enemyId = 0;

export class Enemy {
  constructor(kind, x, y) {
    const def = ENEMY_TYPES[kind];
    this.id = enemyId += 1;
    this.kind = kind;
    this.shape = def.shape;
    this.x = x;
    this.y = y;
    this.radius = def.radius;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.score = def.score;
    this.color = def.color;
    this.angle = Math.random() * Math.PI * 2;
    this.wobble = Math.random() * Math.PI * 2;
    this.shootTimer = 1.2 + Math.random() * 1.4;
    this.flash = 0;
    this.dead = false;
  }

  // Returns an enemy bullet when a weaver fires, otherwise null.
  update(dt, player) {
    this.flash = Math.max(0, this.flash - dt);
    this.wobble += dt * 2.2;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const towardX = dx / dist;
    const towardY = dy / dist;

    if (this.kind === 'weaver') {
      // Strafe sideways in a sine wave while drifting toward the player.
      const strafe = Math.sin(this.wobble) * 0.9;
      this.x += (towardX * 0.45 - towardY * strafe) * this.speed * dt;
      this.y += (towardY * 0.45 + towardX * strafe) * this.speed * dt;
      this.shootTimer -= dt;
      if (this.shootTimer <= 0 && dist < 560) {
        this.shootTimer = 2.1 + Math.random() * 0.7;
        return new Bullet(
          this.x,
          this.y,
          towardX * ENEMY_BULLET.speed,
          towardY * ENEMY_BULLET.speed,
          ENEMY_BULLET.damage,
          0,
          false,
        );
      }
      return null;
    }

    this.x += towardX * this.speed * dt;
    this.y += towardY * this.speed * dt;
    this.angle += dt * 1.5;
    return null;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.flash = 0.09;
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }
}

// A spawn point just outside one random arena edge.
export function edgeSpawnPoint(random) {
  const edge = Math.floor(random() * 4);
  const m = ARENA.margin;
  if (edge === 0) return { x: m + random() * (ARENA.width - 2 * m), y: -30 };
  if (edge === 1) return { x: m + random() * (ARENA.width - 2 * m), y: ARENA.height + 30 };
  if (edge === 2) return { x: -30, y: m + random() * (ARENA.height - 2 * m) };
  return { x: ARENA.width + 30, y: m + random() * (ARENA.height - 2 * m) };
}
