// NEONVOID — fixed demo states for screenshots.
// ?shot=title | play | win | lose sets the game up in a chosen state and
// freezes it, so a screenshot is the same render every time. Normal play
// (no ?shot=) never touches this file's states.

import { mulberry32 } from './config.js';
import { Enemy, Bullet } from './entities.js';

function placeEnemies(game, random) {
  const kinds = ['shard', 'shard', 'weaver', 'bulwark', 'splitter', 'shard', 'weaver', 'mite', 'mite', 'splitter'];
  const spots = [
    [250, 220], [1010, 240], [880, 560], [420, 620], [1080, 420],
    [180, 460], [640, 200], [760, 660], [330, 330], [980, 640],
  ];
  for (let i = 0; i < kinds.length; i += 1) {
    const enemy = new Enemy(kinds[i], spots[i][0], spots[i][1]);
    enemy.wobble = random() * Math.PI * 2;
    enemy.shootTimer = 1 + random();
    if (kinds[i] === 'bulwark') enemy.hp = 44;
    if (kinds[i] === 'weaver') enemy.hp = 12;
    game.enemies.push(enemy);
  }
}

function placeBullets(game) {
  const player = game.player;
  const angles = [-0.5, -0.15, 0.2, 0.55];
  for (const offset of angles) {
    const angle = player.angle + offset;
    game.bullets.push(new Bullet(
      player.x + Math.cos(angle) * 120,
      player.y + Math.sin(angle) * 120,
      Math.cos(angle) * player.bulletSpeed,
      Math.sin(angle) * player.bulletSpeed,
      player.bulletDamage,
      0,
      true,
    ));
  }
  game.enemyBullets.push(new Bullet(820, 300, -120, 90, 8, 0, false));
  game.enemyBullets.push(new Bullet(420, 250, 140, 60, 8, 0, false));
}

// Sets up the requested demo state. Returns true when a state was applied.
export function applyShotState(game, shot) {
  if (shot === 'title') {
    game.state = 'title';
    game.frozen = true;
    return true;
  }
  if (shot === 'play') {
    const random = mulberry32(1337);
    game.startRun();
    game.director.wave = 3;
    game.director.queue = [];
    game.director.spawnTimer = 0;
    game.score = 1250;
    game.kills = 14;
    game.shotsFired = 96;
    game.shotsHit = 58;
    game.player.hp = 78;
    game.player.x = 640;
    game.player.y = 480;
    game.player.angle = -0.6;
    game.enemies = [];
    game.bullets = [];
    game.enemyBullets = [];
    placeEnemies(game, random);
    placeBullets(game);
    // The startRun banner says WAVE 1 and frozen mode never fades it:
    // hide it so the shot shows pure gameplay at wave 3.
    game.banner = { text: '', alpha: 0 };
    game.frozen = true;
    return true;
  }
  if (shot === 'win') {
    game.state = 'victory';
    game.stats = { score: 12450, wave: 8, kills: 96, accuracy: 61 };
    // Keep the HUD behind the overlay consistent with the stats.
    game.score = 12450;
    game.kills = 96;
    game.director.wave = 8;
    game.player.hp = game.player.maxHp;
    game.frozen = true;
    return true;
  }
  if (shot === 'lose') {
    game.state = 'gameover';
    game.stats = { score: 4320, wave: 5, kills: 41, accuracy: 54 };
    game.score = 4320;
    game.kills = 41;
    game.director.wave = 5;
    game.player.hp = 0;
    game.player.alive = false;
    game.frozen = true;
    return true;
  }
  return false;
}
