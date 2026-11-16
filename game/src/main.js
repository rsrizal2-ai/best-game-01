// NEONVOID — the game loop and state machine.
// Owns the screens (title, playing, upgrade, victory, game over), the
// run's score and stats, collisions, wave flow and the restart. Rules live
// in entities/waves; drawing lives in render; this file wires them together.

import { ARENA, FINAL_WAVE } from './config.js';
import { SoundBank } from './audio.js';
import { Input, insideRect } from './input.js';
import { ParticleField } from './particles.js';
import { PlayerShip, Enemy, circlesOverlap } from './entities.js';
import { WaveDirector, drawUpgradeChoices } from './waves.js';
import {
  createStarfield,
  drawBackground,
  drawPlayer,
  drawBullets,
  drawEnemies,
  drawHud,
  drawTitle,
  drawUpgrade,
  drawVictory,
  drawGameOver,
  drawPaused,
  drawWaveBanner,
} from './render.js';
import { applyShotState } from './shots.js';

export class NeonVoidGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sound = new SoundBank();
    this.particles = new ParticleField();
    this.stars = createStarfield(140);
    this.director = new WaveDirector();
    this.state = 'title';
    this.paused = false;
    this.frozen = false;
    this.time = 0;
    this.lastTimestamp = 0;
    this.shake = 0;
    this.banner = { text: '', alpha: 0 };
    this.buttons = {};
    this.upgradeChoices = [];
    this.decor = [];
    this.best = this.loadBest();
    this.resetRun();
    this.seedTitleDecor();

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) applyShotState(this, shot);

    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing' && !this.paused) this.paused = true;
    });
    requestAnimationFrame((ts) => this.loop(ts));
  }

  loadBest() {
    try {
      return Number(window.localStorage.getItem('neonvoid-best') || 0) || 0;
    } catch {
      return 0;
    }
  }

  saveBest() {
    try {
      if (this.score > this.best) {
        this.best = this.score;
        window.localStorage.setItem('neonvoid-best', String(this.best));
      }
    } catch {
      // Best score is a nicety; a blocked store never breaks the game.
    }
  }

  resetRun() {
    this.player = new PlayerShip();
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.score = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.stats = { score: 0, wave: 1, kills: 0, accuracy: 0 };
    this.paused = false;
  }

  seedTitleDecor() {
    const kinds = ['shard', 'weaver', 'bulwark', 'splitter', 'mite'];
    this.decor = [];
    for (let i = 0; i < 8; i += 1) {
      const enemy = new Enemy(kinds[i % kinds.length], Math.random() * ARENA.width, 120 + Math.random() * 560);
      enemy.speed = 24 + Math.random() * 30;
      this.decor.push(enemy);
    }
  }

  startRun() {
    this.sound.unlock();
    this.resetRun();
    this.state = 'playing';
    this.director.startWave(1);
    this.showBanner('WAVE 1');
    this.sound.waveStart();
  }

  showBanner(text) {
    this.banner = { text, alpha: 1.6 };
  }

  accuracy() {
    return this.shotsFired === 0 ? 0 : Math.round((this.shotsHit / this.shotsFired) * 100);
  }

  currentStats() {
    return {
      score: this.score,
      wave: this.director.wave,
      kills: this.kills,
      accuracy: this.accuracy(),
    };
  }

  endRun(victory) {
    this.saveBest();
    this.stats = this.currentStats();
    this.state = victory ? 'victory' : 'gameover';
    if (victory) this.sound.victory();
    else this.sound.gameOver();
  }

  loop(timestamp) {
    const dt = this.lastTimestamp === 0 ? 0 : Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.time += dt;
    if (!this.frozen) this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    if (this.input.wasPressed('KeyM')) {
      const muted = this.sound.toggleMute();
      this.particles.scoreText(this.player.x, this.player.y - 40, muted ? 'SOUND OFF' : 'SOUND ON');
    }
    if (this.state === 'playing' && this.input.wasPressed('KeyP')) {
      this.paused = !this.paused;
    }
    if (this.paused) return;

    if (this.state === 'title') {
      for (const enemy of this.decor) {
        enemy.y += enemy.speed * dt * 0.4;
        enemy.angle += dt;
        if (enemy.y > ARENA.height + 40) enemy.y = -40;
      }
      const clicks = this.input.takeClicks();
      if (clicks.some((c) => this.buttons.start && insideRect(c.x, c.y, this.buttons.start))
        || this.input.wasPressed('Enter') || this.input.wasPressed('Space')) {
        this.startRun();
      }
      return;
    }

    if (this.state === 'upgrade') {
      const clicks = this.input.takeClicks();
      let picked = -1;
      clicks.forEach((c) => {
        this.buttons.cards?.forEach((rect, i) => {
          if (insideRect(c.x, c.y, rect)) picked = i;
        });
      });
      if (picked < 0) {
        if (this.input.wasPressed('Digit1')) picked = 0;
        if (this.input.wasPressed('Digit2')) picked = 1;
        if (this.input.wasPressed('Digit3')) picked = 2;
      }
      if (picked >= 0 && this.upgradeChoices[picked]) {
        this.upgradeChoices[picked].apply(this.player);
        this.sound.upgrade();
        this.state = 'playing';
        const next = this.director.wave + 1;
        this.director.startWave(next);
        this.showBanner(`WAVE ${next}`);
        this.sound.waveStart();
      }
      return;
    }

    if (this.state === 'victory' || this.state === 'gameover') {
      const clicks = this.input.takeClicks();
      if (clicks.some((c) => this.buttons.again && insideRect(c.x, c.y, this.buttons.again))
        || this.input.wasPressed('KeyR') || this.input.wasPressed('Enter')) {
        this.startRun();
      }
      return;
    }

    if (this.state !== 'playing') return;

    // --- playing ---
    // Firing uses mouseDown; the click queue is for menus only. Drain it
    // here so a volley of shots never leaks into the upgrade draft as a pick.
    this.input.takeClicks();
    const invulnerable = this.player.update(dt, this.input, this.time);
    void invulnerable;
    const fresh = this.player.tryFire(this.input);
    this.shotsFired += fresh.length;
    if (fresh.length > 0) this.sound.shoot();
    this.bullets.push(...fresh);

    for (const enemy of this.director.update(dt)) this.enemies.push(enemy);

    for (const enemy of this.enemies) {
      const shot = enemy.update(dt, this.player);
      if (shot) this.enemyBullets.push(shot);
    }

    for (const bullet of this.bullets) bullet.update(dt);
    for (const bullet of this.enemyBullets) bullet.update(dt);

    this.resolveBulletHits();
    this.resolvePlayerHits();
    this.cleanup();

    if (this.state !== 'playing') return;
    if (this.director.remaining === 0 && this.enemies.length === 0) {
      if (this.director.isFinalWave) {
        this.endRun(true);
      } else {
        const bonus = 250 * this.director.wave;
        this.score += bonus;
        this.particles.scoreText(ARENA.width / 2, 200, `WAVE BONUS +${bonus}`, '#a6ff00');
        this.upgradeChoices = drawUpgradeChoices();
        this.state = 'upgrade';
        this.sound.upgrade();
      }
    }

    this.particles.update(dt);
    this.shake = Math.max(0, this.shake - dt * 26);
    this.banner.alpha = Math.max(0, this.banner.alpha - dt * 0.55);
  }

  resolveBulletHits() {
    for (const bullet of this.bullets) {
      if (bullet.dead) continue;
      for (const enemy of this.enemies) {
        if (enemy.dead || bullet.dead) continue;
        if (!circlesOverlap(bullet, enemy)) continue;
        const killed = enemy.takeDamage(bullet.damage);
        if (!bullet.counted) {
          bullet.counted = true;
          this.shotsHit += 1;
        }
        this.sound.enemyHit();
        this.particles.burst(bullet.x, bullet.y, enemy.color, 4, 160);
        if (killed) this.killEnemy(enemy);
        bullet.pierce -= 1;
        if (bullet.pierce < 0) {
          bullet.dead = true;
          break;
        }
      }
    }
  }

  killEnemy(enemy) {
    this.score += enemy.score;
    this.kills += 1;
    this.particles.burst(enemy.x, enemy.y, enemy.color, 18, 260);
    this.particles.ring(enemy.x, enemy.y, enemy.color);
    this.particles.scoreText(enemy.x, enemy.y - 10, `+${enemy.score}`, enemy.color);
    this.sound.explode();
    this.shake = Math.min(10, this.shake + 3);
    if (enemy.kind === 'splitter') {
      for (const offset of [-14, 14]) {
        const mite = new Enemy('mite', enemy.x + offset, enemy.y);
        this.enemies.push(mite);
      }
    }
  }

  resolvePlayerHits() {
    for (const bullet of this.enemyBullets) {
      if (bullet.dead || !this.player.alive) continue;
      if (!circlesOverlap(bullet, this.player)) continue;
      bullet.dead = true;
      if (this.player.hurt(bullet.damage, this.time)) {
        this.sound.playerHit();
        this.particles.burst(this.player.x, this.player.y, '#ff2d95', 12, 220);
        this.shake = Math.min(12, this.shake + 5);
      }
    }
    for (const enemy of this.enemies) {
      if (enemy.dead || !this.player.alive) continue;
      if (!circlesOverlap(enemy, this.player)) continue;
      if (this.player.hurt(enemy.damage, this.time)) {
        this.sound.playerHit();
        this.particles.burst(this.player.x, this.player.y, '#ff2d95', 12, 220);
        this.shake = Math.min(12, this.shake + 5);
      }
      // Shove the enemy off the player so one touch is one hit.
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy) || 1;
      enemy.x = this.player.x + (dx / dist) * (enemy.radius + this.player.radius + 2);
      enemy.y = this.player.y + (dy / dist) * (enemy.radius + this.player.radius + 2);
    }
    if (!this.player.alive) {
      this.particles.burst(this.player.x, this.player.y, '#00f0ff', 40, 380);
      this.particles.ring(this.player.x, this.player.y, '#00f0ff');
      this.endRun(false);
    }
  }

  cleanup() {
    this.bullets = this.bullets.filter((b) => !b.dead);
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead);
    this.enemies = this.enemies.filter((e) => !e.dead);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    drawBackground(ctx, this.stars, this.time);
    const mouse = { x: this.input.mouseX, y: this.input.mouseY };

    if (this.state === 'title') {
      drawEnemies(ctx, this.decor);
      this.buttons = drawTitle(ctx, this.best, mouse);
      ctx.restore();
      return;
    }

    drawEnemies(ctx, this.enemies);
    drawBullets(ctx, [...this.bullets, ...this.enemyBullets]);
    this.particles.draw(ctx);
    if (this.player.alive && this.state !== 'victory' && this.state !== 'gameover') {
      drawPlayer(ctx, this.player, this.time);
    }
    drawHud(ctx, {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      score: this.score,
      wave: this.director.wave,
      finalWave: FINAL_WAVE,
      enemiesLeft: this.enemies.length + this.director.remaining,
      kills: this.kills,
      muted: this.sound.muted,
    });
    drawWaveBanner(ctx, this.banner.text, this.banner.alpha);

    if (this.state === 'upgrade') {
      this.buttons = drawUpgrade(ctx, this.upgradeChoices, this.director.wave, mouse);
    } else if (this.state === 'victory') {
      this.buttons = drawVictory(ctx, this.stats, mouse);
    } else if (this.state === 'gameover') {
      this.buttons = drawGameOver(ctx, this.stats, mouse);
    } else if (this.paused) {
      drawPaused(ctx);
    }
    ctx.restore();
  }
}
