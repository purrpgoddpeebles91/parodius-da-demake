const SpriteFactory = (() => {
  const createGlow = (ctx, x, y, radius, color) => {
    ctx.save();
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(0.2, color.replace(')', ', 0.75)').replace('rgb', 'rgba'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  function drawShip(ctx, x, y, size, color, shield = 0) {
    ctx.save();
    ctx.translate(x, y);

    if (shield > 0) {
      ctx.strokeStyle = 'rgba(118, 247, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.28, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.9);
    ctx.lineTo(size * 0.8, size * 0.7);
    ctx.lineTo(0, size * 0.42);
    ctx.lineTo(-size * 0.8, size * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b9f8ff';
    ctx.fillRect(-size * 0.2, -size * 0.1, size * 0.4, size * 0.5);

    ctx.fillStyle = '#ff5ea8';
    ctx.fillRect(-size * 0.58, size * 0.15, size * 0.25, size * 0.32);
    ctx.fillRect(size * 0.33, size * 0.15, size * 0.25, size * 0.32);

    ctx.fillStyle = '#091827';
    ctx.fillRect(-size * 0.12, -size * 0.18, size * 0.24, size * 0.14);
    ctx.restore();
  }

  function drawEnemy(ctx, x, y, type, hitFlash = 0) {
    ctx.save();
    ctx.translate(x, y);
    const alpha = hitFlash > 0 ? 0.35 + (Math.sin(hitFlash * 30) + 1) * 0.3 : 1;
    ctx.globalAlpha = alpha;

    if (type === 'scout') {
      ctx.fillStyle = '#ff7d7d';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(13, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(-13, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd0a5';
      ctx.fillRect(-4, -5, 8, 10);
    } else if (type === 'zigzag') {
      ctx.fillStyle = '#ffb86c';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(18, -6);
      ctx.lineTo(12, 18);
      ctx.lineTo(-12, 18);
      ctx.lineTo(-18, -6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#40160d';
      ctx.fillRect(-6, -8, 12, 12);
    } else if (type === 'tank') {
      ctx.fillStyle = '#93f5b0';
      ctx.fillRect(-20, -14, 40, 28);
      ctx.fillStyle = '#1c2340';
      ctx.fillRect(-8, -18, 16, 12);
      ctx.fillRect(-7, 6, 14, 10);
    } else if (type === 'spinner') {
      ctx.strokeStyle = '#d4a1ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, 0);
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 20);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#c8a6ff';
      ctx.beginPath();
      ctx.moveTo(-18, -18);
      ctx.lineTo(18, -18);
      ctx.lineTo(26, 0);
      ctx.lineTo(18, 18);
      ctx.lineTo(-18, 18);
      ctx.lineTo(-26, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBoss(ctx, x, y, hpRatio) {
    ctx.save();
    ctx.translate(x, y);

    const glow = `rgba(255, 106, 213, ${0.2 + hpRatio * 0.8})`;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff6ad5';
    ctx.fillRect(-70, -18, 140, 36);
    ctx.fillRect(-44, -66, 88, 48);
    ctx.fillRect(-60, 30, 120, 26);

    ctx.fillStyle = '#181d3b';
    ctx.fillRect(-14, -60, 28, 20);
    ctx.fillRect(-32, 36, 18, 22);
    ctx.fillRect(14, 36, 18, 22);

    ctx.fillStyle = '#76f7ff';
    ctx.fillRect(-46, -10, 18, 20);
    ctx.fillRect(28, -10, 18, 20);

    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.strokeRect(-82, -90, 164, 130);

    ctx.restore();
  }

  function drawPickup(ctx, x, y, kind) {
    ctx.save();
    ctx.translate(x, y);

    if (kind === 'shield') {
      ctx.strokeStyle = '#76f7ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === 'weapon') {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#171936';
      ctx.fillRect(-4, -10, 8, 20);
      ctx.fillRect(-10, -4, 20, 8);
    } else {
      ctx.fillStyle = '#8ef7a8';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a1f12';
      ctx.fillRect(-3, -10, 6, 20);
      ctx.fillRect(-10, -3, 20, 6);
    }

    ctx.restore();
  }

  function drawProjectile(ctx, x, y, radius, color, glow) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawExplosion(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    for (let i = 0; i < 12; i += 1) {
      const angle = (Math.PI * 2 / 12) * i;
      const dist = size * (0.4 + (i % 3) * 0.18);
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      ctx.fillRect(px, py, size * 0.6, size * 0.6);
    }
    ctx.restore();
  }

  function drawStars(ctx, stars, width, height) {
    for (const star of stars) {
      const alpha = 0.5 + star.twinkle * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  return {
    drawShip,
    drawEnemy,
    drawBoss,
    drawPickup,
    drawProjectile,
    drawExplosion,
    drawStars,
  };
})();
