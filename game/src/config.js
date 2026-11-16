// NEONVOID — tuning constants, wave table and upgrade catalog.
// Every number the game balances on lives here, so tuning never means
// hunting through gameplay code.

export const ARENA = { width: 1280, height: 800, margin: 46 };

export const PLAYER = {
  radius: 16,
  maxHp: 100,
  accel: 2600,
  maxSpeed: 340,
  friction: 0.86,
  bulletSpeed: 720,
  bulletDamage: 12,
  bulletRadius: 4,
  fireInterval: 0.16,
  invulnerableMs: 900,
  regenPerSecond: 0,
};

// Enemy types: shape, size, hp, speed, damage on contact, score value.
export const ENEMY_TYPES = {
  shard: { shape: 'triangle', radius: 15, hp: 14, speed: 165, damage: 10, score: 100, color: '#ff2d95' },
  weaver: { shape: 'diamond', radius: 17, hp: 22, speed: 105, damage: 12, score: 150, color: '#b967ff' },
  bulwark: { shape: 'hexagon', radius: 26, hp: 70, speed: 55, damage: 18, score: 250, color: '#ffb300' },
  splitter: { shape: 'square', radius: 20, hp: 30, speed: 95, damage: 12, score: 200, color: '#00e5ff' },
  mite: { shape: 'triangle', radius: 9, hp: 6, speed: 240, damage: 6, score: 50, color: '#ff5c5c' },
};

export const ENEMY_BULLET = { radius: 6, speed: 190, damage: 8, color: '#ff2d95' };

// Waves: how many of each type, and how fast they trickle in (seconds).
export const WAVES = [
  { shard: 6 },
  { shard: 9, weaver: 2 },
  { shard: 10, weaver: 4, splitter: 2 },
  { shard: 12, weaver: 5, splitter: 3, bulwark: 1 },
  { shard: 12, weaver: 6, splitter: 4, bulwark: 2 },
  { shard: 14, weaver: 8, splitter: 5, bulwark: 3 },
  { shard: 16, weaver: 9, splitter: 6, bulwark: 4 },
  { shard: 18, weaver: 10, splitter: 8, bulwark: 5 },
];
export const FINAL_WAVE = WAVES.length;
export const SPAWN_INTERVAL = 0.85;

// Upgrades offered between waves. Each one changes the run in a real way.
export const UPGRADES = [
  {
    id: 'rapid',
    name: 'RAPID CYCLER',
    desc: '+25% fire rate',
    apply: (p) => { p.fireInterval *= 0.8; },
  },
  {
    id: 'heavy',
    name: 'HEAVY ROUNDS',
    desc: '+35% bullet damage',
    apply: (p) => { p.bulletDamage = Math.round(p.bulletDamage * 1.35); },
  },
  {
    id: 'twin',
    name: 'TWIN BARRELS',
    desc: '+1 projectile per shot',
    apply: (p) => { p.projectiles += 1; },
  },
  {
    id: 'thrusters',
    name: 'ION THRUSTERS',
    desc: '+18% move speed',
    apply: (p) => { p.maxSpeed = Math.round(p.maxSpeed * 1.18); },
  },
  {
    id: 'hull',
    name: 'REINFORCED HULL',
    desc: '+25 max HP, restore 25 HP',
    apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); },
  },
  {
    id: 'pierce',
    name: 'PIERCING ROUNDS',
    desc: 'Bullets pierce +1 enemy',
    apply: (p) => { p.pierce += 1; },
  },
  {
    id: 'nanobots',
    name: 'NANOBOT SWARM',
    desc: 'Regenerate 1.5 HP per second',
    apply: (p) => { p.regenPerSecond += 1.5; },
  },
];

// Small deterministic RNG (mulberry32) for screenshot states and wave shuffles.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
