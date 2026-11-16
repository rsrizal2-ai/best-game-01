// NEONVOID — everything the eye sees: the arena, the ships, the HUD and
// every screen. Drawing only; no game rules live here. Buttons return
// their rectangles so the main loop can hit-test clicks.

import { ARENA } from './config.js';
import { insideRect } from './input.js';

const CYAN = '#00f0ff';
const MAGENTA = '#ff2d95';
const PURPLE = '#b967ff';
const AMBER = '#ffb300';
const LIME = '#a6ff00';
const WHITE = '#f2f6ff';

export function createStarfield(count) {
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * ARENA.width,
      y: Math.random() * ARENA.height,
      size: 0.6 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 1.2,
    });
  }
  return stars;
}

export function drawBackground(ctx, stars, time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, ARENA.height);
  gradient.addColorStop(0, '#070718');
  gradient.addColorStop(1, '#0b0b2e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.055)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= ARENA.width; x += 64) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ARENA.height);
  }
  for (let y = 0; y <= ARENA.height; y += 64) {
    ctx.moveTo(0, y);
    ctx.lineTo(ARENA.width, y);
  }
  ctx.stroke();

  for (const star of stars) {
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * star.speed + star.phase));
    ctx.globalAlpha = twinkle * 0.8;
    ctx.fillStyle = '#cfe9ff';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function neonPath(ctx, points, color, glow) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function polygonPoints(x, y, radius, sides, rotation) {
  const points = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return points;
}

export function drawPlayer(ctx, player, now) {
  const blink = now < player.invulnerableUntil && Math.floor(now * 14) % 2 === 0;
  if (blink) return;
  const nose = [player.x + Math.cos(player.angle) * 24, player.y + Math.sin(player.angle) * 24];
  const left = [
    player.x + Math.cos(player.angle + 2.5) * 17,
    player.y + Math.sin(player.angle + 2.5) * 17,
  ];
  const right = [
    player.x + Math.cos(player.angle - 2.5) * 17,
    player.y + Math.sin(player.angle - 2.5) * 17,
  ];
  // Engine flame flickers behind the ship.
  const flame = 10 + Math.random() * 8;
  const tail = [player.x - Math.cos(player.angle) * (18 + flame), player.y - Math.sin(player.angle) * (18 + flame)];
  ctx.beginPath();
  ctx.moveTo(left[0], left[1]);
  ctx.lineTo(tail[0], tail[1]);
  ctx.lineTo(right[0], right[1]);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 179, 0, 0.85)';
  ctx.fill();
  neonPath(ctx, [nose, left, right], CYAN, 18);
  // Aim tick: a short line toward the cursor.
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.angle) * 28, player.y + Math.sin(player.angle) * 28);
  ctx.lineTo(player.x + Math.cos(player.angle) * 40, player.y + Math.sin(player.angle) * 40);
  ctx.stroke();
}

export function drawBullets(ctx, bullets) {
  for (const b of bullets) {
    if (b.friendly) {
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#bff6ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - (b.vx / 720) * 14, b.y - (b.vy / 720) * 14);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.shadowColor = MAGENTA;
      ctx.shadowBlur = 12;
      ctx.fillStyle = MAGENTA;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

export function drawEnemies(ctx, enemies) {
  for (const e of enemies) {
    const color = e.flash > 0 ? '#ffffff' : e.color;
    if (e.shape === 'triangle') {
      neonPath(ctx, polygonPoints(e.x, e.y, e.radius + 3, 3, e.angle), color, 14);
    } else if (e.shape === 'diamond') {
      neonPath(ctx, polygonPoints(e.x, e.y, e.radius + 3, 4, e.angle), color, 14);
    } else if (e.shape === 'hexagon') {
      neonPath(ctx, polygonPoints(e.x, e.y, e.radius + 2, 6, e.angle * 0.5), color, 16);
    } else {
      neonPath(ctx, polygonPoints(e.x, e.y, e.radius + 2, 4, e.angle), color, 14);
    }
    if (e.maxHp >= 30) {
      const w = e.radius * 2;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w, 4);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w * Math.max(0, e.hp / e.maxHp), 4);
    }
  }
}

export function drawHud(ctx, hud) {
  ctx.fillStyle = 'rgba(4, 6, 24, 0.72)';
  ctx.fillRect(0, 0, ARENA.width, 40);
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 40.5);
  ctx.lineTo(ARENA.width, 40.5);
  ctx.stroke();

  // Hull bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(16, 12, 220, 16);
  const hpRatio = Math.max(0, hud.hp / hud.maxHp);
  ctx.fillStyle = hpRatio > 0.5 ? LIME : hpRatio > 0.25 ? AMBER : MAGENTA;
  ctx.fillRect(16, 12, 220 * hpRatio, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.strokeRect(16.5, 12.5, 220, 16);
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`HULL ${Math.ceil(hud.hp)}/${hud.maxHp}`, 246, 25);

  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = WHITE;
  ctx.fillText(`SCORE ${hud.score}`, ARENA.width / 2, 26);

  ctx.textAlign = 'right';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`WAVE ${hud.wave}/${hud.finalWave}`, ARENA.width - 16, 19);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText(`HOSTILES ${hud.enemiesLeft}   KILLS ${hud.kills}`, ARENA.width - 16, 36);
  if (hud.muted) {
    ctx.fillStyle = '#9fb4d8';
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MUTED (M)', 16, 58);
  }
}

function drawButton(ctx, rect, label, mouse) {
  const hovered = mouse && insideRect(mouse.x, mouse.y, rect);
  ctx.fillStyle = hovered ? 'rgba(0, 240, 255, 0.28)' : 'rgba(0, 240, 255, 0.10)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = hovered ? CYAN : 'rgba(0, 240, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  ctx.fillStyle = hovered ? '#ffffff' : CYAN;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 7);
  return rect;
}

function centerTitle(ctx, text, y, size, color) {
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = 'center';
  ctx.shadowColor = color;
  ctx.shadowBlur = 26;
  ctx.fillStyle = color;
  ctx.fillText(text, ARENA.width / 2, y);
  ctx.shadowBlur = 0;
}

export function drawTitle(ctx, best, mouse) {
  ctx.fillStyle = 'rgba(4, 6, 24, 0.55)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerTitle(ctx, 'NEONVOID', 210, 84, CYAN);
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText('Hold the reactor. Break the void. Survive all 8 waves.', ARENA.width / 2, 258);
  ctx.font = '16px monospace';
  ctx.fillStyle = WHITE;
  const lines = [
    'WASD / ARROWS — move      MOUSE — aim      HOLD CLICK — fire',
    'Clear a wave, then pick 1 of 3 upgrades. P — pause, M — mute, R — restart.',
  ];
  ctx.fillText(lines[0], ARENA.width / 2, 330);
  ctx.fillText(lines[1], ARENA.width / 2, 358);
  if (best > 0) {
    ctx.fillStyle = AMBER;
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`BEST SCORE ${best}`, ARENA.width / 2, 410);
  }
  const start = drawButton(ctx, { x: ARENA.width / 2 - 130, y: 470, w: 260, h: 56 }, 'START MISSION', mouse);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#6c7ea3';
  ctx.fillText('An original arena shooter. No downloads, no accounts, no network.', ARENA.width / 2, 580);
  return { start };
}

export function drawUpgrade(ctx, choices, wave, mouse) {
  ctx.fillStyle = 'rgba(4, 6, 24, 0.72)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerTitle(ctx, `WAVE ${wave} CLEARED`, 150, 44, LIME);
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = WHITE;
  ctx.fillText('Choose one upgrade — it shapes the rest of the run.', ARENA.width / 2, 200);
  const cards = [];
  const cardW = 300;
  const cardH = 190;
  const gap = 36;
  const totalW = cardW * 3 + gap * 2;
  const startX = (ARENA.width - totalW) / 2;
  const y = 280;
  choices.forEach((choice, i) => {
    const rect = { x: startX + i * (cardW + gap), y, w: cardW, h: cardH };
    const hovered = mouse && insideRect(mouse.x, mouse.y, rect);
    ctx.fillStyle = hovered ? 'rgba(0, 240, 255, 0.20)' : 'rgba(10, 14, 44, 0.9)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = hovered ? CYAN : PURPLE;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    ctx.fillStyle = CYAN;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[ ${i + 1} ]`, rect.x + rect.w / 2, rect.y + 34);
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 19px monospace';
    ctx.fillText(choice.name, rect.x + rect.w / 2, rect.y + 72);
    ctx.fillStyle = '#c9d8f2';
    ctx.font = '15px monospace';
    ctx.fillText(choice.desc, rect.x + rect.w / 2, rect.y + 108);
    ctx.fillStyle = '#6c7ea3';
    ctx.font = '13px monospace';
    ctx.fillText('click or press 1 / 2 / 3', rect.x + rect.w / 2, rect.y + 152);
    cards.push(rect);
  });
  return { cards };
}

function statLine(ctx, label, value, y) {
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText(label, ARENA.width / 2 - 130, y);
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(String(value), ARENA.width / 2 + 40, y);
}

export function drawVictory(ctx, stats, mouse) {
  ctx.fillStyle = 'rgba(4, 10, 8, 0.78)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerTitle(ctx, 'REACTOR SECURED', 190, 56, LIME);
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = WHITE;
  ctx.fillText('All 8 waves broken. The void retreats — this time.', ARENA.width / 2, 240);
  statLine(ctx, 'FINAL SCORE', stats.score, 320);
  statLine(ctx, 'WAVES CLEARED', `${stats.wave} / 8`, 356);
  statLine(ctx, 'KILLS', stats.kills, 392);
  statLine(ctx, 'ACCURACY', `${stats.accuracy}%`, 428);
  const again = drawButton(ctx, { x: ARENA.width / 2 - 130, y: 500, w: 260, h: 56 }, 'PLAY AGAIN', mouse);
  return { again };
}

export function drawGameOver(ctx, stats, mouse) {
  ctx.fillStyle = 'rgba(16, 4, 10, 0.78)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerTitle(ctx, 'SHIP DESTROYED', 190, 56, MAGENTA);
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = WHITE;
  ctx.fillText('The void takes the reactor. The next run is yours.', ARENA.width / 2, 240);
  statLine(ctx, 'FINAL SCORE', stats.score, 320);
  statLine(ctx, 'WAVE REACHED', `${stats.wave} / 8`, 356);
  statLine(ctx, 'KILLS', stats.kills, 392);
  statLine(ctx, 'ACCURACY', `${stats.accuracy}%`, 428);
  const again = drawButton(ctx, { x: ARENA.width / 2 - 130, y: 500, w: 260, h: 56 }, 'TRY AGAIN', mouse);
  return { again };
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(4, 6, 24, 0.6)';
  ctx.fillRect(0, 0, ARENA.width, ARENA.height);
  centerTitle(ctx, 'PAUSED', 380, 56, WHITE);
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9fb4d8';
  ctx.fillText('Press P to resume.', ARENA.width / 2, 440);
}

export function drawWaveBanner(ctx, text, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = Math.min(1, alpha);
  centerTitle(ctx, text, 330, 52, WHITE);
  ctx.globalAlpha = 1;
}
