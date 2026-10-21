const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const ui = {
  score: document.getElementById('score'),
  wave: document.getElementById('wave'),
  lives: document.getElementById('lives'),
  weapon: document.getElementById('weapon'),
  combo: document.getElementById('combo'),
};

const overlays = {
  menu: document.getElementById('menuOverlay'),
  gameOver: document.getElementById('gameOverOverlay'),
};

const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreText = document.getElementById('finalScoreText');

const input = {
  left: false,
  right: false,
  up: false,
  down: false,
  fire: false,
  boost: false,
};

const WEAPON_NAMES = ['RIFLE', 'SPREAD', 'LASER', 'ARC'];
const state = {
  mode: 'menu',
  lastTime: 0,
  score: 0,
  wave: 1,
  combo: 1,
  comboTimer: 0,
  screenShake: 0,
  messageTimer: 0,
  nextWaveTimer: 0,
  bossMode: false,
  stars: [],
  particles: [],
  bullets: [],
  enemyBullets: [],
  enemies: [],
  pickups: [],
  player: null,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function setMode(mode) {
  state.mode = mode;
  if (mode === 'menu') {
    overlays.menu.classList.remove('hidden');
    overlays.menu.classList.add('visible');
    overlays.gameOver.classList.add('hidden');
    overlays.gameOver.classList.remove('visible');
  } else if (mode === 'gameOver') {
    finalScoreText.textContent = `Final Score: ${Math.floor(state.score)}`;
    overlays.gameOver.classList.remove('hidden');
    overlays.gameOver.classList.add('visible');
    overlays.menu.classList.add('hidden');
    overlays.menu.classList.remove('visible');
  } else {
    overlays.menu.classList.add('hidden');
    overlays.menu.classList.remove('visible');
    overlays.gameOver.classList.add('hidden');
    overlays.gameOver.classList.remove('visible');
  }
}

function initStars() {
  state.stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2.3 + 1,
    speed: Math.random() * 45 + 25,
    twinkle: Math.random() * Math.PI * 2,
  }));
}

function resetPlayer() {
  state.player = {
    x: canvas.width * 0.18,
    y: canvas.height * 0.5,
    radius: 18,
    speed: 300,
    fireCooldown: 0,
    shootRate: 0.18,
    hp: 5,
    maxHp: 5,
    shield: 0,
    invuln: 0,
    weapon: 0,
  };
}

function updateHud() {
  if (!state.player) return;
  ui.score.textContent = Math.floor(state.score);
  ui.wave.textContent = state.wave;
  ui.lives.textContent = state.player.hp;
  ui.weapon.textContent = WEAPON_NAMES[state.player.weapon];
  ui.combo.textContent = `x${state.combo}`;
}

function addParticles(x, y, color, count = 12, spread = 2.2) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(30, 180) * spread;
    state.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: rand(0.2, 0.8), maxLife: rand(0.2, 0.8), radius: rand(2, 5), color });
  }
}

function spawnPickup(x, y, kind = 'weapon') {
  state.pickups.push({ x, y, kind, radius: 12, pulse: Math.random() * Math.PI * 2, drift: rand(-0.4, 0.4) });
}

function spawnEnemy(type = 'scout', x = canvas.width + 30, y = rand(50, canvas.height - 50)) {
  let hp = 1, speed = 110, drift = 0, shoot = 0, radius = 18, scoreValue = 85;

  if (type === 'scout') {
    hp = 1; speed = 100 + state.wave * 10; drift = 0.5; radius = 16; scoreValue = 80;
  } else if (type === 'zigzag') {
    hp = 2; speed = 90 + state.wave * 8; drift = 1.1; radius = 18; scoreValue = 120;
  } else if (type === 'tank') {
    hp = 4; speed = 68 + state.wave * 6; drift = 0.7; radius = 20; shoot = rand(1.2, 2.3); scoreValue = 220;
  } else if (type === 'spinner') {
    hp = 3; speed = 80 + state.wave * 7; radius = 18; shoot = rand(1.0, 1.7); scoreValue = 280;
  } else if (type === 'boss') {
    hp = 26 + state.wave * 9; speed = 48; radius = 58; shoot = rand(0.8, 1.3); scoreValue = 1600;
  }

  state.enemies.push({ type, x, y, vx: -speed, vy: 0, hp, maxHp: hp, radius, scoreValue, drift, shootCooldown: shoot, pulse: Math.random() * Math.PI * 2, hitFlash: 0, phase: 0 });
}

function spawnWave() {
  const count = 4 + state.wave * 2;
  for (let i = 0; i < count; i += 1) {
    const roll = Math.random();
    let kind = 'scout';
    if (roll > 0.72 && state.wave > 1) kind = 'zigzag';
    if (roll > 0.88 && state.wave > 2) kind = 'tank';
    if (roll > 0.96 && state.wave > 3) kind = 'spinner';
    spawnEnemy(kind, canvas.width + rand(30, 180), rand(60, canvas.height - 60));
  }
}

function spawnBoss() {
  state.bossMode = true;
  spawnEnemy('boss', canvas.width + 80, canvas.height * 0.5);
}

function resetGame() {
  state.score = 0;
  state.wave = 1;
  state.combo = 1;
  state.comboTimer = 0;
  state.screenShake = 0;
  state.messageTimer = 1.2;
  state.nextWaveTimer = 1.4;
  state.bossMode = false;
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.pickups = [];
  state.particles = [];
  resetPlayer();
  initStars();
  spawnWave();
  updateHud();
}

function startGame() {
  AudioSystem.ensureContext();
  AudioSystem.playMenu();
  resetGame();
  setMode('game');
}

function createPlayerShot() {
  const p = state.player;
  if (!p || p.fireCooldown > 0) return;
  p.fireCooldown = p.shootRate;

  const velocity = 560;
  const colors = ['#76f7ff', '#ffd166', '#ff8ce1', '#9afcb4'];

  if (p.weapon === 0) {
    state.bullets.push({ x: p.x + 22, y: p.y, vx: velocity, vy: 0, radius: 5, color: colors[0], damage: 1 });
  } else if (p.weapon === 1) {
    state.bullets.push({ x: p.x + 22, y: p.y - 7, vx: velocity, vy: -30, radius: 4, color: colors[1], damage: 1 });
    state.bullets.push({ x: p.x + 22, y: p.y + 7, vx: velocity, vy: 30, radius: 4, color: colors[1], damage: 1 });
  } else if (p.weapon === 2) {
    state.bullets.push({ x: p.x + 22, y: p.y, vx: velocity, vy: 0, radius: 7, color: colors[2], damage: 2 });
    state.bullets.push({ x: p.x + 22, y: p.y - 24, vx: velocity * 0.8, vy: -75, radius: 4.5, color: colors[2], damage: 1.2 });
    state.bullets.push({ x: p.x + 22, y: p.y + 24, vx: velocity * 0.8, vy: 75, radius: 4.5, color: colors[2], damage: 1.2 });
  } else {
    const spread = [-0.8, -0.35, 0, 0.35, 0.8];
    for (const angle of spread) {
      state.bullets.push({ x: p.x + 22, y: p.y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, radius: 5, color: '#ff6ad5', damage: 1.75 });
    }
  }

  AudioSystem.playShoot();
}

function enemyFire(enemy, spread = 1) {
  if (!state.player) return;
  const dx = state.player.x - enemy.x;
  const dy = state.player.y - enemy.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = 220 + state.wave * 10;

  if (spread === 1) {
    state.enemyBullets.push({ x: enemy.x, y: enemy.y, vx: (dx / dist) * speed, vy: (dy / dist) * speed, radius: enemy.type === 'boss' ? 8 : 5, color: enemy.type === 'boss' ? '#ff9ed4' : '#ff9477' });
    return;
  }

  const startAngle = -Math.PI / 2;
  for (let i = 0; i < spread; i += 1) {
    const angle = startAngle + (i / (spread - 1)) * Math.PI;
    state.enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: enemy.type === 'boss' ? 7 : 5, color: '#ff9ed4' });
  }
}

function applyDamage(amount = 1) {
  const p = state.player;
  if (!p || p.invuln > 0) return;

  if (p.shield > 0) {
    p.shield -= 1;
    p.invuln = 0.8;
    AudioSystem.playHit();
    return;
  }

  p.hp -= amount;
  p.invuln = 1.2;
  state.screenShake = 12;
  AudioSystem.playHit();

  if (p.hp <= 0) {
    setMode('gameOver');
    AudioSystem.playExplode();
  }
}

function gainPickup(kind) {
  if (!state.player) return;
  if (kind === 'weapon') {
    state.player.weapon = Math.min(3, state.player.weapon + 1);
  } else if (kind === 'shield') {
    state.player.shield = Math.min(3, state.player.shield + 1);
  } else {
    state.player.hp = Math.min(state.player.maxHp + 1, state.player.hp + 1);
  }
  AudioSystem.playPickup();
}

function updateStars(dt) {
  for (const star of state.stars) {
    star.y += star.speed * dt;
    star.twinkle += dt * 2.2;
    if (star.y > canvas.height) {
      star.y = -8;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const particle = state.particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    if (particle.life <= 0) state.particles.splice(i, 1);
  }
}

function updateBullets(dt) {
  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.x > canvas.width + 80 || bullet.y < -80 || bullet.y > canvas.height + 80) {
      state.bullets.splice(i, 1);
    }
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.enemyBullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.x < -80 || bullet.x > canvas.width + 80 || bullet.y < -80 || bullet.y > canvas.height + 80) {
      state.enemyBullets.splice(i, 1);
    }
  }
}

function updatePlayer(dt) {
  const p = state.player;
  if (!p) return;

  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(dx, dy) || 1;

  const speed = input.boost ? p.speed * 1.35 : p.speed;
  p.x += (dx / mag) * speed * dt;
  p.y += (dy / mag) * speed * dt;
  p.x = clamp(p.x, 28, canvas.width - 28);
  p.y = clamp(p.y, 28, canvas.height - 28);

  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);

  if (input.fire) createPlayerShot();
}

function updateEnemies(dt) {
  const p = state.player;
  if (!p) return;

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);
    enemy.pulse += dt * 2.5;

    if (enemy.type === 'boss') {
      const phase = enemy.hp < enemy.maxHp * 0.5 ? 1 : 0;
      enemy.phase = phase;
      enemy.x -= (phase === 1 ? 34 : 26) * dt;
      enemy.y += Math.sin(enemy.pulse + enemy.phase * 2) * (phase === 1 ? 140 : 90) * dt;
      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        enemyFire(enemy, phase === 1 ? 5 : 3);
        enemy.shootCooldown = phase === 1 ? 0.5 + Math.random() * 0.35 : 0.9 + Math.random() * 0.4;
      }
    } else {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.vy = Math.sin((performance.now() * 0.002) + enemy.pulse) * enemy.drift * 70;

      if (enemy.type === 'spinner' || enemy.type === 'tank') {
        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0) {
          enemyFire(enemy, enemy.type === 'spinner' ? 3 : 1);
          enemy.shootCooldown = enemy.type === 'spinner' ? rand(1.0, 1.7) : rand(1.6, 2.6);
        }
      } else if (Math.random() < 0.009) {
        enemyFire(enemy, 1);
      }
    }

    if (enemy.x < -100) {
      state.enemies.splice(i, 1);
      continue;
    }

    if (enemy.x - enemy.radius < p.x + p.radius && enemy.x + enemy.radius > p.x - p.radius && enemy.y - enemy.radius < p.y + p.radius && enemy.y + enemy.radius > p.y - p.radius) {
      applyDamage(1);
      state.enemies.splice(i, 1);
      addParticles(enemy.x, enemy.y, '#ff9aa3', 18, 2.8);
      continue;
    }
  }
}

function handleCollisions() {
  const p = state.player;
  if (!p) return;

  for (let i = state.bullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.bullets[i];

    for (let j = state.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = state.enemies[j];
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      if (dist < bullet.radius + enemy.radius) {
        enemy.hp -= bullet.damage;
        enemy.hitFlash = 1;
        state.bullets.splice(i, 1);
        addParticles(bullet.x, bullet.y, bullet.color, 6, 1.8);

        if (enemy.hp <= 0) {
          state.score += enemy.scoreValue * state.combo;
          state.combo = Math.min(9, state.combo + 1);
          state.comboTimer = 2.2;
          addParticles(enemy.x, enemy.y, enemy.type === 'boss' ? '#ff6ad5' : '#ffffff', enemy.type === 'boss' ? 44 : 18, 3.2);
          AudioSystem.playExplode();

          if (enemy.type === 'boss') {
            state.bossMode = false;
            state.wave += 1;
            state.messageTimer = 1.4;
            state.nextWaveTimer = 1.4;
          }

          if (Math.random() < 0.2) {
            const kind = Math.random() < 0.5 ? 'weapon' : 'shield';
            spawnPickup(enemy.x, enemy.y, kind);
          }

          state.enemies.splice(j, 1);
        }
        break;
      }
    }
  }

  for (let i = state.enemyBullets.length - 1; i >= 0; i -= 1) {
    const bullet = state.enemyBullets[i];
    const dx = bullet.x - p.x;
    const dy = bullet.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < bullet.radius + p.radius) {
      state.enemyBullets.splice(i, 1);
      applyDamage(1);
      addParticles(p.x, p.y, '#ff8d8d', 12, 2.2);
    }
  }

  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = state.pickups[i];
    const dx = pickup.x - p.x;
    const dy = pickup.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < pickup.radius + p.radius) {
      gainPickup(pickup.kind);
      state.pickups.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = state.pickups[i];
    pickup.y += Math.sin((performance.now() * 0.004) + pickup.pulse) * 18 * dt;
    pickup.x -= 52 * dt;
    pickup.pulse += dt * 2.4;

    if (pickup.x < -20) {
      state.pickups.splice(i, 1);
    }
  }
}

function updateWaveSystem(dt) {
  if (state.mode !== 'game') return;

  if (state.comboTimer > 0) {
    state.comboTimer -= dt;
    if (state.comboTimer <= 0) {
      state.combo = 1;
    }
  }

  if (state.messageTimer > 0) {
    state.messageTimer = Math.max(0, state.messageTimer - dt);
  }

  if (state.screenShake > 0) {
    state.screenShake = Math.max(0, state.screenShake - dt * 40);
  }

  if (!state.bossMode && state.enemies.length === 0) {
    state.nextWaveTimer -= dt;
    if (state.nextWaveTimer <= 0) {
      if (state.wave % 3 === 0) {
        spawnBoss();
      } else {
        state.wave += 1;
        state.messageTimer = 1.2;
        spawnWave();
      }
      state.nextWaveTimer = 1.45;
    }
  }
}

function updateGame(dt) {
  updateStars(dt);
  updateParticles(dt);
  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updatePickups(dt);
  handleCollisions();
  updateWaveSystem(dt);
  updateHud();
}

function getThemeColors() {
  const themes = [
    { skyTop: '#040d1d', skyMid: '#0b1b30', skyLow: '#1a0d22', accent: '#79f6ff' },
    { skyTop: '#12151f', skyMid: '#202d4d', skyLow: '#2d1531', accent: '#ff6ad5' },
    { skyTop: '#111917', skyMid: '#173b39', skyLow: '#2d1b2a', accent: '#90f7b0' },
  ];
  return themes[(state.wave - 1) % themes.length];
}

function drawBackground() {
  const theme = getThemeColors();
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, theme.skyTop);
  bg.addColorStop(0.45, theme.skyMid);
  bg.addColorStop(1, theme.skyLow);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < 8; row += 1) {
    const y = (row * 70) + (performance.now() * 0.02) % 70;
    ctx.fillStyle = row % 2 === 0 ? 'rgba(131, 173, 255, 0.08)' : 'rgba(255, 106, 213, 0.05)';
    ctx.fillRect(0, y, canvas.width, 60);
  }

  ctx.strokeStyle = 'rgba(132, 174, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (const star of state.stars) {
    const alpha = 0.35 + Math.sin(star.twinkle) * 0.6;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
}

function drawPlayer() {
  const p = state.player;
  if (!p) return;

  if (p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }

  if (p.shield > 0) {
    ctx.strokeStyle = 'rgba(121,246,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.fillStyle = '#7af5ff';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(14, 14);
  ctx.lineTo(0, 6);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ff7ec4';
  ctx.fillRect(-2, -2, 4, 12);
  ctx.restore();

  const boostVisible = input.boost && Math.random() > 0.2;
  if (boostVisible) {
    ctx.fillStyle = 'rgba(121,246,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(p.x - 6, p.y + 18);
    ctx.lineTo(p.x, p.y + 32);
    ctx.lineTo(p.x + 6, p.y + 18);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEnemy(enemy) {
  const blink = enemy.hitFlash > 0 ? '#ffffff' : null;
  if (enemy.type === 'scout') {
    ctx.fillStyle = blink || '#ff7f7f';
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - 16);
    ctx.lineTo(enemy.x + 14, enemy.y + 14);
    ctx.lineTo(enemy.x, enemy.y + 7);
    ctx.lineTo(enemy.x - 14, enemy.y + 14);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.type === 'zigzag') {
    ctx.fillStyle = blink || '#ffbf69';
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - 18);
    ctx.lineTo(enemy.x + 18, enemy.y - 4);
    ctx.lineTo(enemy.x + 10, enemy.y + 16);
    ctx.lineTo(enemy.x - 10, enemy.y + 16);
    ctx.lineTo(enemy.x - 18, enemy.y - 4);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.type === 'tank') {
    ctx.fillStyle = blink || '#9ef6b5';
    ctx.fillRect(enemy.x - 22, enemy.y - 15, 44, 30);
    ctx.fillStyle = '#1f2f3f';
    ctx.fillRect(enemy.x - 12, enemy.y - 22, 24, 12);
  } else if (enemy.type === 'spinner') {
    ctx.strokeStyle = blink || '#d1a7ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(enemy.x - 18, enemy.y);
    ctx.lineTo(enemy.x + 18, enemy.y);
    ctx.moveTo(enemy.x, enemy.y - 18);
    ctx.lineTo(enemy.x, enemy.y + 18);
    ctx.stroke();
  } else if (enemy.type === 'boss') {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.fillStyle = blink || '#ff6ad5';
    ctx.fillRect(-54, -18, 108, 36);
    ctx.fillRect(-34, -62, 68, 48);
    ctx.fillRect(-46, 28, 92, 20);
    ctx.fillStyle = '#1f1232';
    ctx.fillRect(-16, -58, 32, 18);
    ctx.fillRect(-18, 32, 18, 18);
    ctx.fillRect(0, 32, 18, 18);
    ctx.fillStyle = '#79f6ff';
    ctx.fillRect(-42, -6, 18, 18);
    ctx.fillRect(24, -6, 18, 18);
    ctx.restore();
  }
}

function drawBullets() {
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.color || '#ffffff';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bullet of state.enemyBullets) {
    ctx.fillStyle = bullet.color || '#ffaa99';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickups() {
  for (const pickup of state.pickups) {
    const pulse = 0.6 + Math.sin(pickup.pulse) * 0.4;
    ctx.save();
    ctx.translate(pickup.x, pickup.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = pickup.kind === 'weapon' ? '#ffd166' : pickup.kind === 'shield' ? '#79f6ff' : '#90f7b0';
    ctx.lineWidth = 3;

    if (pickup.kind === 'weapon') {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#161839';
      ctx.fillRect(-3, -11, 6, 22);
      ctx.fillRect(-11, -3, 22, 6);
    } else if (pickup.kind === 'shield') {
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#90f7b0';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#081a0f';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillRect(-10, -3, 20, 6);
    }
    ctx.restore();
  }
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.fillRect(particle.x, particle.y, particle.radius, particle.radius);
  }
}

function drawHudBars() {
  const p = state.player;
  if (!p) return;

  ctx.fillStyle = 'rgba(7, 14, 24, 0.7)';
  ctx.fillRect(18, canvas.height - 35, 200, 12);
  ctx.fillStyle = '#79f6ff';
  ctx.fillRect(18, canvas.height - 35, (p.hp / p.maxHp) * 200, 12);

  ctx.fillStyle = 'rgba(7, 14, 24, 0.7)';
  ctx.fillRect(18, canvas.height - 18, 200, 8);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(18, canvas.height - 18, (p.shield / 3) * 200, 8);

  ctx.fillStyle = '#edf9ff';
  ctx.font = '12px Segoe UI';
  ctx.fillText(`HP ${p.hp}/${p.maxHp}`, 22, canvas.height - 38);
  ctx.fillText(`SHIELD ${p.shield}`, 22, canvas.height - 21);
}

function drawWaveBanner() {
  if (state.messageTimer <= 0) return;
  const alpha = clamp(state.messageTimer / 1.2, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(8, 12, 22, ${0.35 + alpha * 0.25})`;
  ctx.fillRect(canvas.width * 0.33, canvas.height * 0.42, canvas.width * 0.34, 72);
  ctx.strokeStyle = `rgba(121, 246, 255, ${alpha})`;
  ctx.strokeRect(canvas.width * 0.33, canvas.height * 0.42, canvas.width * 0.34, 72);
  ctx.fillStyle = `rgba(237,249,255,${alpha})`;
  ctx.font = '700 28px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${state.wave}`, canvas.width / 2, canvas.height / 2 + 8);
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of state.enemies) drawEnemy(enemy);
}

function draw() {
  ctx.save();
  if (state.screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * state.screenShake * 2, (Math.random() - 0.5) * state.screenShake * 2);
  }

  drawBackground();
  drawBullets();
  drawPickups();
  drawParticles();
  drawEnemies();
  drawPlayer();
  drawHudBars();
  drawWaveBanner();

  if (state.mode === 'menu') {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '700 24px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS START', canvas.width / 2, canvas.height / 2 + 170);
  }

  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000 || 0.016, 0.033);
  state.lastTime = timestamp;

  if (state.mode === 'game') updateGame(dt);
  else updateStars(dt);

  draw();
  requestAnimationFrame(gameLoop);
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') input.left = true;
  if (key === 'arrowright' || key === 'd') input.right = true;
  if (key === 'arrowup' || key === 'w') input.up = true;
  if (key === 'arrowdown' || key === 's') input.down = true;
  if (key === ' ' || key === 'z') input.fire = true;
  if (key === 'shift') input.boost = true;
  if (key === 'p' && state.mode === 'game') setMode('menu');
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault();
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') input.left = false;
  if (key === 'arrowright' || key === 'd') input.right = false;
  if (key === 'arrowup' || key === 'w') input.up = false;
  if (key === 'arrowdown' || key === 's') input.down = false;
  if (key === ' ' || key === 'z') input.fire = false;
  if (key === 'shift') input.boost = false;
});

canvas.addEventListener('pointerdown', () => {
  if (state.mode === 'game') input.fire = true;
});

canvas.addEventListener('pointerup', () => {
  input.fire = false;
});

canvas.addEventListener('pointermove', (event) => {
  if (state.mode !== 'game' || !state.player) return;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  state.player.x = x;
  state.player.y = y;
});

function initialize() {
  initStars();
  resetGame();
  setMode('menu');
  requestAnimationFrame(gameLoop);
}

initialize();
