// NEONVOID — waves and the between-wave upgrade draft.
// A wave is a shuffled queue of enemy kinds trickled in from the edges.
// Clearing a wave opens the draft: three distinct upgrades, pick one,
// and the choice genuinely changes how the next waves play.

import { WAVES, FINAL_WAVE, SPAWN_INTERVAL, UPGRADES, mulberry32 } from './config.js';
import { Enemy, edgeSpawnPoint } from './entities.js';

export class WaveDirector {
  constructor() {
    this.wave = 0;
    this.queue = [];
    this.spawnTimer = 0;
    this.betweenWaves = false;
  }

  startWave(number) {
    this.wave = number;
    this.queue = [];
    const table = WAVES[number - 1];
    for (const [kind, count] of Object.entries(table)) {
      for (let i = 0; i < count; i += 1) this.queue.push(kind);
    }
    // Shuffle so the mix, not the table order, is what the player meets.
    const random = mulberry32(0x9e3779b9 + number * 7919);
    for (let i = this.queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    this.spawnTimer = 0.6;
    this.betweenWaves = false;
  }

  get totalToSpawn() {
    return WAVES[this.wave - 1]
      ? Object.values(WAVES[this.wave - 1]).reduce((a, b) => a + b, 0)
      : 0;
  }

  get remaining() {
    return this.queue.length;
  }

  get isFinalWave() {
    return this.wave >= FINAL_WAVE;
  }

  // Trickle enemies in; returns the ones spawned this frame.
  update(dt) {
    if (this.queue.length === 0) return [];
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return [];
    this.spawnTimer = SPAWN_INTERVAL * (0.8 + Math.random() * 0.4);
    const kind = this.queue.shift();
    const point = edgeSpawnPoint(Math.random);
    return [new Enemy(kind, point.x, point.y)];
  }
}

// Three distinct upgrades, drawn at random, for the draft screen.
export function drawUpgradeChoices() {
  const pool = [...UPGRADES];
  const picks = [];
  while (picks.length < 3 && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}
