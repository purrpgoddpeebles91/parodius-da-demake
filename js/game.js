const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hud = {
  score: document.getElementById('score'),
  wave: document.getElementById('wave'),
  lives: document.getElementById('lives'),
  weapon: document.getElementById('weapon'),
};

const overlay = {
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

const state = {
  mode: 'menu',
  lastTime: 0,
  score: 0,
  wave: 1,
  spawnTimer: 0,
  enemiesRemaining: 0,
  bossesSpawned: 0,
  bossActive: false,
  combo: 0,
  flashTimer: 0,
  waveBannerTimer: 0,
  stageTimer: 0,
  stars: [],
  particles: [],
  bullets: [],
  enemyBullets: [],
  enemies: [],
  pickups: [],
  player: null,
  activeScreenShake: 0,
};

const WEAPON_TITLES = ['RIFLE', 'SPREAD', 'LASER', 'ARC'];
const STAR_COLORS = ['#d9f6ff', '#c3d9ff', '#ffd4f5', '#c7ffc7'];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function initStars() {
  state.stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2.4 + 1,
    speed: Math.random() * 30 + 20,
    twinkle: Math.random(),
  }));
}

function resetPlayer() {
  state.player = {
    x: canvas.width * 0.18,
    y: canvas.height * 0.5,
    radius: 18,
    speed: 290,
    fireCooldown: 0,
    shootRate: 0.19,
    hp: 5,
    maxHp: 5,
    shield: 0,
    invuln: 0,
    weapon: 0,
    weaponTime: 0,
    upgradeLevel: 0,
  };
}

function resetGame() {
  state.score = 0;
  state.wave = 1;
  state.spawnTimer = 0;
  state.enemiesRemaining = 0;
  state.bossesSpawned = 0;
  state.bossActive = false;
  state.combo = 0;
  state.flashTimer = 0;
  state.waveBannerTimer = 0;
  state.stageTimer = 0;
  state.activeScreenShake = 0;
  state.particles = [];
  state.bullets = [];
  state.enemyBullets = [];
  state.enemies = [];
  state.pickups = [];
  resetPlayer();
  updateHud();
  initStars();
}

function setMode(mode) {
  state.mode = mode;

  if (mode === 'menu') {
    overlay.menu.classList.remove('hidden');
    overlay.menu.classList.add('visible');
    overlay.gameOver.classList.add('hidden');
    overlay.gameOver.classList.remove('visible');
  } else if (mode === 'gameOver') {
    finalScoreText.textContent = `Final Score: ${Math.floor(state.score)}`;
    overlay.gameOver.classList.remove('hidden');
    overlay.gameOver.classList.add('visible');
    overlay.menu.classList.add('hidden');
    overlay.menu.classList.remove('visible');
  } else {
    overlay.menu.classList.add('hidden');
    overlay.menu.classList.remove('visible');
    overlay.gameOver.classList.add('hidden');
    overlay.gameOver.classList.remove('visible');
  }
}

function startGame() {
  AudioSystem.ensureContext();
  AudioSystem.playMenu();
  resetGame();
  setMode('game');
}

function updateHud() {
  hud.score.textContent = Math.floor(state.score);
  hud.wave.textContent = state.wave;
  hud.lives.textContent = Math.max(0, state.player ? state.player.hp : 0);
  hud.weapon.textContent = WEAPON_TITLES[state.player ? state.player.weapon : 0];
}

function addParticles(x, y, color, count = 12, spread = 3) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(30, 180) * spread;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: rand(0.25, 0.8),
      maxLife: rand(0.25, 0.8),
      color,
      radius: rand(2, 5),
    });
  }
}

function spawnEnemy(type = 'scout', x = canvas.width + 18, y = rand(60, canvas.height - 60)) {
  let hp = 1;
  let speed = 90;
  let drift = 0;
  let shootRate = 0;

  if (type === 'scout') {
    hp = 1;
    speed = 100 + state.wave * 6;
  } else if (type === 'zigzag') {
    hp = 2;
    speed = 90 + state.wave * 7;
    drift = 1.2;
  } else if (type === 'tank') {
    hp = 4;
    speed = 55 + state.wave * 4;
  } else if (type === 'spinner') {
    hp = 3;
    speed = 80 + state.wave * 5;
    shootRate = rand(1.4, 2.5);
  } else if (type === 'boss') {
    hp = 26 + state.wave * 8;
    speed = 50;
  }

  state.enemies.push({
    x,
    y,
    vx: -speed,
    vy: 0,
    radius: type === 'tank' ? 22 : type === 'boss' ? 62 : 16,
    hp,
    maxHp: hp,
    type,
    drift,
    phase: rand(0, Math.PI * 2),
    shootCooldown: shootRate ? rand(0.8, 1.8) : 0,
    firePattern: type === 'spinner' ? 'orbital' : 'straight',
    scoreValue: type === 'boss' ? 1800 : 90 + state.wave * 15,
    hitFlash: 0,
  });
}

function spawnPickup(x, y, kind = 'weapon') {
  state.pickups.push({
    x,
    y,
    radius: 12,
    kind,
    drift: rand(-1, 1),
    rot: rand(0, Math.PI * 2),
  });
}

function spawnWave() {
  const waveDifficulty = clamp(state.wave, 1, 10);
  const count = 4 + waveDifficulty * 2 + (Math.random() > 0.5 ? 1 : 0);

  for (let i = 0; i < count; i += 1) {
    const kindRoll = Math.random();
    let kind = 'scout';
    if (kindRoll > 0.72 && state.wave > 1) kind = 'zigzag';
    if (kindRoll > 0.88 && state.wave > 2) kind = 'tank';
    if (kindRoll > 0.96 && state.wave > 3) kind = 'spinner';

    const x = canvas.width + rand(30, 220);
    const y = rand(80, canvas.height - 80);
    spawnEnemy(kind, x, y);
  }

  state.enemiesRemaining = state.enemies.length;
}

function spawnBoss() {
  state.bossActive = true;
  spawnEnemy('boss', canvas.width + 80, canvas.height * 0.5);
}

function createPlayerShot() {
  const p = state.player;
  if (!p || p.fireCooldown > 0) return;
  p.fireCooldown = p.shootRate;

  const velocity = 520;
  const bulletColors = ['#76f7ff', '#ffd166', '#ff95d1', '#8ef7a8'];
  const bulletColor = bulletColors[p.weapon % bulletColors.length];

  if (p.weapon === 0) {
    state.bullets.push({ x: p.x + 20, y: p.y, vx: velocity, vy: 0, radius: 5, color: bulletColor, damage: 1 });
  } else if (p.weapon === 1) {
    state.bullets.push({ x: p.x + 20, y: p.y, vx: velocity, vy: -35, radius: 4, color: '#ffd166', damage: 1 });
    state.bullets.push({ x: p.x + 20, y: p.y, vx: velocity, vy: 35, radius: 4, color: '#ffd166', damage: 1 });
  } else if (p.weapon === 2) {
    state.bullets.push({ x: p.x + 20, y: p.y, vx: velocity, vy: 0, radius: 7, color: '#76f7ff', damage: 2 });
    state.bullets.push({ x: p.x + 20, y: p.y - 10, vx: velocity, vy: -60, radius: 5, color: '#d0feff', damage: 1.2 });
    state.bullets.push({ x: p.x + 20, y: p.y + 10, vx: velocity, vy: 60, radius: 5, color: '#d0feff', damage: 1.2 });
  } else {
    const spread = [-0.65, -0.2, 0.2, 0.65];
    for (const angle of spread) {
      const vx = velocity * Math.cos(angle);
      const vy = velocity * Math.sin(angle);
      state.bullets.push({ x: p.x + 20, y: p.y, vx, vy, radius: 5, color: '#ff6ad5', damage: 1.8 });
    }
  }

  AudioSystem.playShoot();
}

function enemyFire(enemy) {
  const shotSpeed = 230 + state.wave * 10;
  const dx = state.player.x - enemy.x;
  const dy = state.player.y - enemy.y;
  const length = Math.hypot(dx, dy) || 1;

  state.enemyBullets.push({
    x: enemy.x,
    y: enemy.y,
    vx: (dx / length) * shotSpeed,
    vy: (dy / length) * shotSpeed,
    radius: 6,
    color: '#ff9a82',
  });
}

function applyDamageToPlayer(amount = 1) {
  const p = state.player;
  if (!p || p.invuln > 0) return;

  if (p.shield > 0) {
    p.shield -= 1;
    p.invuln = 0.7;
    AudioSystem.playHit();
    return;
  }

  p.hp -= amount;
  p.invuln = 1.2;
  state.flashTimer = 0.22;
  state.activeScreenShake = 10;
  AudioSystem.playHit();

  if (p.hp <= 0) {
    state.mode = 'gameOver';
    setMode('gameOver');
    AudioSystem.playExplode();
  }
}

function gainUpgrade(kind) {
  if (kind === 'shield') {
    state.player.shield = Math.min(3, state.player.shield + 1);
  } else if (kind === 'weapon') {
    state.player.weapon = Math.min(3, state.player.weapon + 1);
  } else {
    state.player.hp = Math.min(state.player.maxHp + 1, state.player.hp + 1);
  }

  AudioSystem.playPickup();
}

function updateStars(dt) {
  for (const star of state.stars) {
    star.y += star.speed * dt;
    star.twinkle += dt * (0.8 + star.speed / 90);
    if (star.y > canvas.height) {
      star.y = -5;
      star.x = Math.random() * canvas.width;
    }
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
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
  const magnitude = Math.hypot(dx, dy) || 1;

  p.x += (dx / magnitude) * p.speed * dt;
  p.y += (dy / magnitude) * p.speed * dt;
  p.x = clamp(p.x, 32, canvas.width - 32);
  p.y = clamp(p.y, 32, canvas.height - 32);

  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.weaponTime = Math.max(0, p.weaponTime - dt);

  if (input.fire) createPlayerShot();
}

function updateEnemies(dt) {
  const p = state.player;

  for (let i = state.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = state.enemies[i];
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);

    if (enemy.type === 'boss') {
      enemy.x -= 30 * dt;
      enemy.y += Math.sin((performance.now() * 0.0015) + enemy.phase) * 85 * dt;
      enemy.shootCooldown -= dt;
      if (enemy.shootCooldown <= 0) {
        enemyFire(enemy);
        enemy.shootCooldown = 1.2 + Math.random() * 0.65;
      }
    } else {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      enemy.vy = Math.sin((performance.now() * 0.0015) + enemy.phase) * (enemy.drift || 0.8) * 35;

      if (enemy.type === 'tank') {
        enemy.y += Math.sin((performance.now() * 0.0015) + enemy.phase) * 18 * dt;
      }

      if (enemy.type === 'spinner') {
        enemy.shootCooldown -= dt;
        if (enemy.shootCooldown <= 0) {
          enemyFire(enemy);
          enemy.shootCooldown = rand(1.0, 2.1);
        }
      }

      if (enemy.type === 'scout' || enemy.type === 'zigzag') {
        if (Math.random() < 0.008) {
          enemyFire(enemy);
        }
      }
    }

    if (enemy.x < -80) {
      state.enemies.splice(i, 1);
      continue;
    }

    if (enemy.x - enemy.radius < p.x + p.radius && enemy.x + enemy.radius > p.x - p.radius && enemy.y - enemy.radius < p.y + p.radius && enemy.y + enemy.radius > p.y - p.radius) {
      applyDamageToPlayer(1);
      enemy.hp = 0;
      addParticles(enemy.x, enemy.y, '#ff96aa', 18, 3);
      state.enemies.splice(i, 1);
      continue;
    }
  }
}

function handleCollisions() {
  const p = state.player;

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
        addParticles(bullet.x, bullet.y, bullet.color, 6, 2);

        if (enemy.hp <= 0) {
          state.score += enemy.scoreValue;
          state.combo += 1;
          addParticles(enemy.x, enemy.y, '#ffffff', enemy.type === 'boss' ? 42 : 18, 3);
          AudioSystem.playExplode();

          if (Math.random() < 0.18) {
            spawnPickup(enemy.x, enemy.y, Math.random() < 0.5 ? 'weapon' : 'shield');
          }

          if (enemy.type === 'boss') {
            state.bossActive = false;
            state.wave += 1;
            state.waveBannerTimer = 1.5;
            state.stageTimer = 0;
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
      applyDamageToPlayer(1);
      addParticles(p.x, p.y, '#ff8e8e', 10, 2.4);
    }
  }

  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = state.pickups[i];
    const dx = pickup.x - p.x;
    const dy = pickup.y - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist < pickup.radius + p.radius) {
      gainUpgrade(pickup.kind);
      state.pickups.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = state.pickups[i];
    pickup.y += Math.sin(performance.now() * 0.003 + pickup.rot) * 18 * dt;
    pickup.x -= 50 * dt;
    pickup.rot += dt * 2.5;

    if (pickup.x < -25) {
      state.pickups.splice(i, 1);
    }
  }
}

function updateWaveSystem(dt) {
  state.stageTimer += dt;

  if (!state.bossActive && state.enemies.length === 0) {
    state.wave += 1;
    state.waveBannerTimer = 1.5;
    state.enemiesRemaining = 0;
    state.spawnTimer = 0.2;
    if (state.wave % 3 === 0) {
      state.bossActive = true;
      state.bossesSpawned += 1;
      spawnBoss();
      return;
    }
    spawnWave();
  }

  if (state.bossActive) {
    return;
  }

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.enemies.length < 10) {
    spawnWave();
    state.spawnTimer = 1.7 - Math.min(state.wave * 0.07, 0.7);
  }
}

function updateGame(dt) {
  updateStars(dt);
  updateParticles(dt);
  updatePlayer(dt);
  updateBullets(dt);
  updatePickups(dt);
  updateEnemies(dt);
  handleCollisions();
  updateWaveSystem(dt);

  if (state.waveBannerTimer > 0) {
    state.waveBannerTimer = Math.max(0, state.waveBannerTimer - dt);
  }

  if (state.activeScreenShake > 0) {
    state.activeScreenShake = Math.max(0, state.activeScreenShake - dt * 32);
  }

  updateHud();
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#061120');
  grad.addColorStop(0.4, '#0b1a2e');
  grad.addColorStop(1, '#130c1b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 4; i += 1) {
    const yBase = (canvas.height / 4) * i;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(71, 109, 195, 0.12)' : 'rgba(255, 107, 180, 0.09)';
    ctx.fillRect(0, yBase, canvas.width, canvas.height / 4);
  }

  SpriteFactory.drawStars(ctx, state.stars, canvas.width, canvas.height);
}

function drawBullets() {
  for (const bullet of state.bullets) {
    SpriteFactory.drawProjectile(ctx, bullet.x, bullet.y, bullet.radius, bullet.color, 'rgba(255,255,255,0.35)');
  }

  for (const bullet of state.enemyBullets) {
    SpriteFactory.drawProjectile(ctx, bullet.x, bullet.y, bullet.radius, bullet.color, 'rgba(255,120,120,0.25)');
  }
}

function drawEnemyList() {
  for (const enemy of state.enemies) {
    if (enemy.type === 'boss') {
      SpriteFactory.drawBoss(ctx, enemy.x, enemy.y, enemy.hp / enemy.maxHp);
    } else {
      SpriteFactory.drawEnemy(ctx, enemy.x, enemy.y, enemy.type, enemy.hitFlash);
    }
  }
}

function drawPickups() {
  for (const pickup of state.pickups) {
    SpriteFactory.drawPickup(ctx, pickup.x, pickup.y, pickup.kind);
  }
}

function drawPlayer() {
  const p = state.player;
  if (!p) return;
  SpriteFactory.drawShip(ctx, p.x, p.y, 18 + p.weapon * 1.7, '#7df6ff', p.shield);

  if (p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.fillRect(p.x, p.y, p.radius, p.radius);
  }
}

function drawHudBars() {
  const p = state.player;
  if (!p) return;

  ctx.fillStyle = 'rgba(8, 16, 24, 0.6)';
  ctx.fillRect(24, canvas.height - 46, 220, 16);
  ctx.fillStyle = '#7ae8ff';
  ctx.fillRect(24, canvas.height - 46, (p.hp / p.maxHp) * 220, 16);

  ctx.fillStyle = 'rgba(8, 16, 24, 0.6)';
  ctx.fillRect(24, canvas.height - 24, 220, 8);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(24, canvas.height - 24, (p.shield / 3) * 220, 8);

  ctx.fillStyle = '#dfe8ff';
  ctx.font = '12px "Segoe UI", sans-serif';
  ctx.fillText(`HP ${p.hp}/${p.maxHp}`, 28, canvas.height - 50);
  ctx.fillText(`SHIELD ${p.shield}`, 28, canvas.height - 28);
}

function drawWaveBanner() {
  if (state.waveBannerTimer <= 0) return;
  ctx.save();
  const alpha = clamp(state.waveBannerTimer / 1.5, 0, 1);
  ctx.fillStyle = `rgba(10, 14, 26, ${0.4 + alpha * 0.2})`;
  ctx.fillRect(canvas.width * 0.35, canvas.height * 0.42, canvas.width * 0.3, 70);
  ctx.strokeStyle = 'rgba(118, 247, 255, 0.75)';
  ctx.strokeRect(canvas.width * 0.35, canvas.height * 0.42, canvas.width * 0.3, 70);
  ctx.fillStyle = `rgba(238,245,255,${alpha})`;
  ctx.font = 'bold 28px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${state.wave}`, canvas.width / 2, canvas.height / 2 + 8);
  ctx.restore();
}

function draw() {
  ctx.save();
  if (state.activeScreenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.activeScreenShake * 2;
    const shakeY = (Math.random() - 0.5) * state.activeScreenShake * 2;
    ctx.translate(shakeX, shakeY);
  }

  drawBackground();
  drawBullets();
  drawPickups();
  drawParticles();
  drawEnemyList();
  drawPlayer();
  drawHudBars();
  drawWaveBanner();

  if (state.mode === 'menu') {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS START', canvas.width / 2, canvas.height / 2 + 180);
  }

  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000 || 0.016, 0.033);
  state.lastTime = timestamp;

  if (state.mode === 'game') {
    updateGame(dt);
  } else {
    updateStars(dt);
  }

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
  if (key === ' ' || key === 'z' || key === 'x') {
    input.fire = true;
  }
  if (key === 'p') {
    if (state.mode === 'game') {
      state.mode = 'menu';
      setMode('menu');
    }
  }
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) {
    event.preventDefault();
  }
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') input.left = false;
  if (key === 'arrowright' || key === 'd') input.right = false;
  if (key === 'arrowup' || key === 'w') input.up = false;
  if (key === 'arrowdown' || key === 's') input.down = false;
  if (key === ' ' || key === 'z' || key === 'x') input.fire = false;
});

canvas.addEventListener('pointerdown', (event) => {
  if (state.mode !== 'game') return;
  input.fire = true;
});

canvas.addEventListener('pointerup', () => {
  input.fire = false;
});

canvas.addEventListener('pointermove', (event) => {
  if (state.mode !== 'game') return;

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
