// NEONVOID — particles, shockwave rings and floating score text.
// Pure visual feedback: every kill, hit and pickup spawns a short burst
// that fades on its own. Nothing here affects gameplay.

export class ParticleField {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.texts = [];
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  ring(x, y, color) {
    this.rings.push({ x, y, radius: 6, maxRadius: 64, life: 0.4, maxLife: 0.4, color });
  }

  scoreText(x, y, text, color) {
    this.texts.push({ x, y, text, life: 0.9, maxLife: 0.9, color: color || '#ffffff' });
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const r of this.rings) {
      r.radius += (r.maxRadius - r.radius) * dt * 6;
      r.life -= dt;
    }
    this.rings = this.rings.filter((r) => r.life > 0);
    for (const t of this.texts) {
      t.y -= 42 * dt;
      t.life -= dt;
    }
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.8;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
