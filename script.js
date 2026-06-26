// ----------------------------------------------------
// BACKGROUND CANVAS ENGINE (Deep Space Battle)
// ----------------------------------------------------
const canvas = document.getElementById('battle-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Stars array
const starsCount = 500;
const stars = [];
const twinkleCount = 80;
const pulseCount = 20;

for (let i = 0; i < starsCount; i++) {
  let type = 'static';
  if (i < twinkleCount) type = 'twinkle';
  else if (i < twinkleCount + pulseCount) type = 'pulse';

  stars.push({
    x: Math.random() * 2000,
    y: Math.random() * 2000,
    radius: type === 'pulse' ? (1.5 + Math.random() * 0.5) : (0.2 + Math.random() * 1.0),
    opacity: 0.1 + Math.random() * 0.5,
    type: type,
    offset: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.04
  });
}

// Debris Field
const debrisCount = 30;
const debrisField = [];

function generateDebrisPolygon(size) {
  const points = [];
  const numPoints = 5 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const radius = (size / 2) + (Math.random() * size / 2);
    points.push({
      x: Math.sin(angle) * radius,
      y: Math.cos(angle) * radius
    });
  }
  return points;
}

for (let i = 0; i < debrisCount; i++) {
  const size = 2 + Math.random() * 6;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.05 + Math.random() * 0.15;

  debrisField.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    dx: Math.sin(angle) * speed,
    dy: Math.cos(angle) * speed,
    points: generateDebrisPolygon(size),
    opacity: 0.05 + Math.random() * 0.1,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.01
  });
}

// Enemies
const enemies = [
  { id: 1, cx: 0.25, cy: 0.25, rx: 70, ry: 35, speed: 0.0006, size: 50, phase: 0, currentX: 0, currentY: 0, lastX: 0, lastY: 0 },
  { id: 2, cx: 0.52, cy: 0.18, rx: 110, ry: 50, speed: 0.0004, size: 68, phase: Math.PI / 3, currentX: 0, currentY: 0, lastX: 0, lastY: 0 },
  { id: 3, cx: 0.78, cy: 0.24, rx: 90, ry: 40, speed: 0.0007, size: 45, phase: Math.PI * 1.1, currentX: 0, currentY: 0, lastX: 0, lastY: 0 },
  { id: 4, cx: 0.40, cy: 0.32, rx: 80, ry: 30, speed: 0.0005, size: 55, phase: Math.PI * 1.6, currentX: 0, currentY: 0, lastX: 0, lastY: 0 }
];

// Lasers & Explosions
const lasers = [];
const explosions = [];

function drawDebris(ctx, debris) {
  ctx.save();
  ctx.translate(debris.x, debris.y);
  ctx.rotate(debris.rotation);
  ctx.beginPath();
  ctx.moveTo(debris.points[0].x, debris.points[0].y);
  for (let i = 1; i < debris.points.length; i++) {
    ctx.lineTo(debris.points[i].x, debris.points[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 255, 255, ${debris.opacity})`;
  ctx.fill();
  ctx.restore();
}

function drawHeroShip(ctx, x, y, time) {
  const w = 150;
  const h = 155;

  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 0.6;
  
  // Wings
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, -h * 0.1);
  ctx.lineTo(-w * 0.5, h * 0.15);
  ctx.lineTo(-w * 0.44, h * 0.3);
  ctx.lineTo(-w * 0.12, h * 0.22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.08, -h * 0.1);
  ctx.lineTo(w * 0.5, h * 0.15);
  ctx.lineTo(w * 0.44, h * 0.3);
  ctx.lineTo(w * 0.12, h * 0.22);
  ctx.closePath();
  ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.stroke();

  // Hull Body
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.5);
  ctx.lineTo(-w * 0.07, -h * 0.1);
  ctx.lineTo(-w * 0.12, h * 0.22);
  ctx.lineTo(-w * 0.08, h * 0.4);
  ctx.lineTo(w * 0.08, h * 0.4);
  ctx.lineTo(w * 0.12, h * 0.22);
  ctx.lineTo(w * 0.07, -h * 0.1);
  ctx.closePath();
  ctx.fillStyle = 'rgba(12, 12, 12, 0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.stroke();

  // Bridge
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.3);
  ctx.lineTo(-w * 0.04, -h * 0.12);
  ctx.lineTo(-w * 0.03, -h * 0.04);
  ctx.lineTo(w * 0.03, -h * 0.04);
  ctx.lineTo(w * 0.04, -h * 0.12);
  ctx.closePath();
  ctx.fillStyle = 'rgba(22, 22, 22, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-w * 0.02, -h * 0.3);
  ctx.lineTo(-w * 0.06, -h * 0.4);
  ctx.moveTo(w * 0.02, -h * 0.3);
  ctx.lineTo(w * 0.06, -h * 0.4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.stroke();

  // Engine Pods
  ctx.fillStyle = 'rgba(15, 15, 15, 0.95)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(-w * 0.12, h * 0.4, w * 0.035, h * 0.08);
  ctx.strokeRect(-w * 0.12, h * 0.4, w * 0.035, h * 0.08);
  ctx.fillRect(-w * 0.05, h * 0.4, w * 0.025, h * 0.06);
  ctx.strokeRect(-w * 0.05, h * 0.4, w * 0.025, h * 0.06);
  ctx.fillRect(w * 0.025, h * 0.4, w * 0.025, h * 0.06);
  ctx.strokeRect(w * 0.025, h * 0.4, w * 0.025, h * 0.06);
  ctx.fillRect(w * 0.085, h * 0.4, w * 0.035, h * 0.08);
  ctx.strokeRect(w * 0.085, h * 0.4, w * 0.035, h * 0.08);

  // Turrets
  ctx.beginPath();
  ctx.arc(-w * 0.22, h * 0.18, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(25, 25, 25, 0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w * 0.22, h * 0.18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Viewports
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillRect(-w * 0.06, h * 0.05, 2, 4);
  ctx.fillRect(-w * 0.06, h * 0.12, 2, 4);
  ctx.fillRect(-w * 0.06, h * 0.19, 2, 4);
  ctx.fillRect(w * 0.05, h * 0.05, 2, 4);
  ctx.fillRect(w * 0.05, h * 0.12, 2, 4);
  ctx.fillRect(w * 0.05, h * 0.19, 2, 4);

  // Panel details
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.05, -h * 0.1); ctx.lineTo(w * 0.05, -h * 0.1);
  ctx.moveTo(-w * 0.07, h * 0.05); ctx.lineTo(w * 0.07, h * 0.05);
  ctx.moveTo(-w * 0.09, h * 0.22); ctx.lineTo(w * 0.09, h * 0.22);
  ctx.moveTo(0, -h * 0.12); ctx.lineTo(0, h * 0.4);
  ctx.moveTo(-w * 0.1, h * 0.1); ctx.lineTo(-w * 0.4, h * 0.25);
  ctx.moveTo(w * 0.1, h * 0.1); ctx.lineTo(w * 0.4, h * 0.25);
  ctx.stroke();

  ctx.restore();
}

function drawEngineThrust(ctx, x, y, width, height, time) {
  const w = 150;
  const h = 155;

  const nozzles = [
    { rx: -w * 0.1025, ry: h * 0.48, isOuter: true, index: 0 },
    { rx: -w * 0.0375, ry: h * 0.46, isOuter: false, index: 1 },
    { rx: w * 0.0375, ry: h * 0.46, isOuter: false, index: 2 },
    { rx: w * 0.1025, ry: h * 0.48, isOuter: true, index: 3 }
  ];

  nozzles.forEach(nozzle => {
    const nx = x + nozzle.rx;
    const ny = y + nozzle.ry;

    const linesCount = 7;
    const baseLength = nozzle.isOuter ? 60 : 35;
    const baseWidth = nozzle.isOuter ? 8 : 4;
    
    ctx.save();
    ctx.translate(nx, ny);

    for (let i = 0; i < linesCount; i++) {
      const spreadX = (i / (linesCount - 1) - 0.5) * baseWidth;
      const flicker = Math.sin(time * 22 + nozzle.index * 7 + i) * 0.35 + 0.65;
      const lengthOffset = Math.random() * 12 - 6;
      const lineLength = (baseLength * flicker) + lengthOffset;
      
      ctx.beginPath();
      ctx.moveTo(spreadX, 0);
      ctx.lineTo(spreadX * 1.5, lineLength);
      
      const grad = ctx.createLinearGradient(0, 0, 0, lineLength);
      const opacity = (nozzle.isOuter ? 0.65 : 0.4) * (0.6 + Math.random() * 0.4);
      grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      grad.addColorStop(0.3, `rgba(220, 220, 220, ${opacity * 0.7})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.5 + Math.random() * 0.5;
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawEnemyShip(ctx, enemy, time) {
  const size = enemy.size;
  ctx.save();
  ctx.translate(enemy.currentX, enemy.currentY);
  
  const dx = enemy.currentX - enemy.lastX;
  const dy = enemy.currentY - enemy.lastY;
  const angle = Math.atan2(dy, dx) - Math.PI / 2;
  ctx.rotate(angle);

  ctx.lineWidth = 0.75;
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + Math.sin(time * 0.005 + enemy.phase) * 0.1})`;
  ctx.fillStyle = 'rgba(5, 5, 5, 0.9)';

  ctx.beginPath();
  ctx.moveTo(0, size * 0.4);
  ctx.lineTo(-size * 0.15, size * 0.1);
  ctx.lineTo(-size * 0.45, -size * 0.2);
  ctx.lineTo(-size * 0.12, -size * 0.05);
  ctx.lineTo(-size * 0.1, -size * 0.35);
  ctx.lineTo(0, -size * 0.2);
  ctx.lineTo(size * 0.1, -size * 0.35);
  ctx.lineTo(size * 0.12, -size * 0.05);
  ctx.lineTo(size * 0.45, -size * 0.2);
  ctx.lineTo(size * 0.15, size * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const exhaustLines = 5;
  const length = size * 0.4;
  const ports = [-size * 0.07, size * 0.07];

  ports.forEach((px, idx) => {
    for (let i = 0; i < exhaustLines; i++) {
      const spread = (i / (exhaustLines - 1) - 0.5) * 3;
      const flicker = Math.sin(time * 30 + enemy.id * 12 + i) * 0.3 + 0.7;
      const lineLength = length * flicker * (0.8 + Math.random() * 0.4);

      ctx.beginPath();
      ctx.moveTo(px + spread, -size * 0.35);
      ctx.lineTo(px + spread * 1.5, -size * 0.35 - lineLength);

      const grad = ctx.createLinearGradient(0, -size * 0.35, 0, -size * 0.35 - lineLength);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  });

  ctx.restore();
}

function spawnHeroLaser(heroX, heroY) {
  if (enemies.length === 0) return;
  const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
  const isLeft = Math.random() > 0.5;
  const turretOffsetX = isLeft ? -150 * 0.22 : 150 * 0.22;
  const turretOffsetY = 155 * 0.18;

  lasers.push({
    id: Math.random(),
    isHero: true,
    sourceX: heroX + turretOffsetX,
    sourceY: heroY + turretOffsetY,
    targetEnemyId: targetEnemy.id,
    targetX: targetEnemy.currentX,
    targetY: targetEnemy.currentY,
    progress: 0,
    age: 0,
    duration: 500,
    explosionTriggered: false
  });
}

function spawnEnemyLaser() {
  const shooter = enemies[Math.floor(Math.random() * enemies.length)];
  const side = Math.random() > 0.5 ? -1 : 1;
  const targetX = canvas.width / 2 + (side * (200 + Math.random() * 300));
  const targetY = canvas.height + 100;

  lasers.push({
    id: Math.random(),
    isHero: false,
    sourceX: shooter.currentX,
    sourceY: shooter.currentY,
    targetX: targetX,
    targetY: targetY,
    progress: 0,
    age: 0,
    duration: 500,
    explosionTriggered: false
  });
}

function spawnExplosion(x, y) {
  if (explosions.length >= 3) {
    explosions.shift();
  }
  explosions.push({
    x: x,
    y: y,
    radius: 0,
    maxRadius: 20,
    duration: 800,
    age: 0
  });
}

// Loop update
let lastTime = 0;
let nextHeroLaserTime = 2000;
let nextEnemyLaserTime = 3000;

function gameLoop(time) {
  if (!lastTime) lastTime = time;
  const delta = Math.min(time - lastTime, 100);
  lastTime = time;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  stars.forEach(star => {
    let opacity = star.opacity;
    let radius = star.radius;
    if (star.type === 'twinkle') {
      opacity = star.opacity * (0.3 + 0.7 * Math.abs(Math.sin(time * 0.001 * 1.5 + star.offset)));
    } else if (star.type === 'pulse') {
      radius = star.radius * (0.85 + 0.15 * Math.sin(time * 0.001 * 0.8 + star.offset));
      opacity = star.opacity * (0.7 + 0.3 * Math.sin(time * 0.001 * 0.8 + star.offset));
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.beginPath();
    ctx.arc(star.x % canvas.width, star.y % canvas.height, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Debris
  debrisField.forEach(debris => {
    debris.x += debris.dx;
    debris.y += debris.dy;
    debris.rotation += debris.rotSpeed;
    if (debris.x < -20) debris.x = canvas.width + 20;
    if (debris.x > canvas.width + 20) debris.x = -20;
    if (debris.y < -20) debris.y = canvas.height + 20;
    if (debris.y > canvas.height + 20) debris.y = -20;
    drawDebris(ctx, debris);
  });

  // Enemies
  enemies.forEach(enemy => {
    enemy.lastX = enemy.currentX;
    enemy.lastY = enemy.currentY;
    const centerX = enemy.cx * canvas.width;
    const centerY = enemy.cy * canvas.height;
    enemy.currentX = centerX + Math.sin(time * enemy.speed + enemy.phase) * enemy.rx;
    enemy.currentY = centerY + Math.cos(time * enemy.speed + enemy.phase) * enemy.ry;
    drawEnemyShip(ctx, enemy, time);
  });

  // Hero
  const heroX = canvas.width / 2;
  const bobY = Math.sin(time * 0.001 * 0.4) * 6;
  const heroY = canvas.height - 180 + bobY;
  drawEngineThrust(ctx, heroX, heroY, 150, 155, time);
  drawHeroShip(ctx, heroX, heroY, time);

  // Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    laser.age += delta;

    if (laser.isHero) {
      const targetEnemy = enemies.find(e => e.id === laser.targetEnemyId);
      if (targetEnemy) {
        laser.targetX = targetEnemy.currentX;
        laser.targetY = targetEnemy.currentY;
      }
    }

    const extendDuration = 300;
    const fadeDuration = 200;
    let progress = 1;
    let opacity = 1;

    if (laser.age < extendDuration) {
      progress = laser.age / extendDuration;
      opacity = 1;
    } else {
      progress = 1;
      opacity = 1 - (laser.age - extendDuration) / fadeDuration;
    }

    if (laser.age >= extendDuration && !laser.explosionTriggered) {
      laser.explosionTriggered = true;
      if (laser.isHero) spawnExplosion(laser.targetX, laser.targetY);
    }

    if (laser.age < laser.duration) {
      const endX = laser.sourceX + (laser.targetX - laser.sourceX) * progress;
      const endY = laser.sourceY + (laser.targetY - laser.sourceY) * progress;

      ctx.beginPath();
      ctx.moveTo(laser.sourceX, laser.sourceY);
      ctx.lineTo(endX, endY);
      
      const laserOpacity = Math.max(0, laser.isHero ? opacity : opacity * 0.3);
      const grad = ctx.createLinearGradient(laser.sourceX, laser.sourceY, endX, endY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${laserOpacity})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      lasers.splice(i, 1);
    }
  }

  // Explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.age += delta;
    if (exp.age < exp.duration) {
      const progress = exp.age / exp.duration;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.maxRadius * progress, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - progress)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      explosions.splice(i, 1);
    }
  }

  // Timers
  nextHeroLaserTime -= delta;
  if (nextHeroLaserTime <= 0) {
    spawnHeroLaser(heroX, heroY);
    nextHeroLaserTime = 2000 + Math.random() * 1000;
  }
  nextEnemyLaserTime -= delta;
  if (nextEnemyLaserTime <= 0) {
    spawnEnemyLaser();
    nextEnemyLaserTime = 3000 + Math.random() * 2000;
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ----------------------------------------------------
// PAGE-SPECIFIC INTERACTIVE ACTIONS LOGIC
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // 1. Crew Page
  if (document.getElementById('roster-grid')) {
    const tabs = document.querySelectorAll('.btn-tab');
    const cards = document.querySelectorAll('.crew-card');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const division = this.getAttribute('data-division');
        cards.forEach(card => {
          card.style.display = (division === 'all' || card.getAttribute('data-division') === division) ? 'flex' : 'none';
        });
      });
    });
  }

  // 2. Intelligence Page
  if (document.querySelector('.starchart-svg')) {
    const nodes = document.querySelectorAll('.sector-node');
    const rows = document.querySelectorAll('.sector-row-trigger');
    const detailTitle = document.getElementById('intel-detail-title');
    const detailDesc = document.getElementById('intel-detail-desc');

    function updateSelectedSector(sectorId, title, description) {
      detailTitle.textContent = title;
      detailDesc.textContent = description;
      rows.forEach(r => {
        r.style.backgroundColor = r.getAttribute('data-node') === sectorId ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
      });
      nodes.forEach(n => {
        const dot = n.querySelector('circle');
        if (n.id === sectorId) {
          dot.setAttribute('r', '8');
          dot.setAttribute('stroke-width', '2.5');
          dot.setAttribute('fill', '#ffffff');
        } else {
          dot.setAttribute('r', '4');
          dot.setAttribute('stroke-width', '2');
          dot.setAttribute('fill', 'rgba(255, 255, 255, 0.6)');
        }
      });
    }

    nodes.forEach(node => {
      node.addEventListener('click', function() {
        updateSelectedSector(this.id, this.getAttribute('data-title'), this.getAttribute('data-desc'));
      });
    });
    rows.forEach(row => {
      row.addEventListener('click', function() {
        const nodeId = this.getAttribute('data-node');
        const node = document.getElementById(nodeId);
        if (node) updateSelectedSector(nodeId, node.getAttribute('data-title'), node.getAttribute('data-desc'));
      });
    });
  }

  // 3. Enlist Page
  if (document.getElementById('enlist-form')) {
    const form = document.getElementById('enlist-form');
    const terminal = document.getElementById('enlist-page-terminal');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const callsign = document.getElementById('callsign').value.trim().toUpperCase();
      const division = document.getElementById('division').value;
      const spinal = document.getElementById('spinal-bias').value;

      form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
      const cursor = terminal.querySelector('.terminal-cursor');
      if (cursor) cursor.remove();

      const diagnostics = [
        `[SYS] SECURE SIGNAL ESTABLISHED: "${callsign}"`,
        `[SYS] RECRUIT RECORD CLASSIFIED AS C-GRADE FRONT-LINE OPERATIVE.`,
        `[LOG 0.1s] SCANNING TARGET BRAIN CORTEX SPHERE... 100% OK`,
        `[LOG 0.3s] BINDING DIVISION MODULE: [${division}]`,
        `[LOG 0.6s] CALIBRATING SPINAL BONE ADAPTER INTEGRATION: [${spinal}]`,
        `[LOG 0.9s] UPLOADING COGNITIVE DUAL-SPLIT LOGIC DRIVERS...`,
        `[LOG 1.2s] CORE SYSTEM LINK COMMENCING VECTOR THRUST CONFIG...`,
        `[LOG 1.5s] SYNC FEEDBACK VOLTAGE IN COILS: NORM (1.46V)`,
        `[SUCCESS] AUGMENTATION DIAGNOSTIC PASSED. SYNC METRIC COEF: 99.85%`,
        `[STATUS] WELCOME TO VANGUARD DEEP SPACE DIVISION, OPERATIVE ${callsign}.`
      ];

      let step = 0;
      function printLine() {
        if (step < diagnostics.length) {
          const row = document.createElement('div');
          row.className = 'terminal-line';
          if (diagnostics[step].startsWith('[SUCCESS]') || diagnostics[step].startsWith('[STATUS]')) {
            row.className += ' success';
          } else if (diagnostics[step].startsWith('[SYS]') || diagnostics[step].startsWith('[LOG')) {
            row.className += ' info';
          }
          row.textContent = diagnostics[step];
          terminal.appendChild(row);
          terminal.scrollTop = terminal.scrollHeight;
          step++;
          setTimeout(printLine, 250 + Math.random() * 150);
        } else {
          const caret = document.createElement('div');
          caret.innerHTML = `<span class="terminal-cursor"></span>`;
          terminal.appendChild(caret);
          terminal.scrollTop = terminal.scrollHeight;
        }
      }
      printLine();
    });
  }

  // 4. Logs Page
  if (document.getElementById('logs-terminal-viewer')) {
    const folders = document.querySelectorAll('.log-folder-btn');
    const viewer = document.getElementById('logs-terminal-viewer');

    const logDatabase = {
      sec7: [
        "[LOG 2026.06.27-01:04:12 SEC-7] Vanguard exited hyperspace warp link. Sector 7-Alpha coordinates locked.",
        "[LOG 2026.06.27-01:04:30 SEC-7] Alert: 4 angular enemy ships detected on sweep intercept paths.",
        "[LOG 2026.06.27-01:04:55 SEC-7] Shield generators set to 120% capacity. Vector engines stable.",
        "[LOG 2026.06.27-01:05:08 SEC-7] Enemy weapons volley registered (beams missed. 0% structural shield impact).",
        "[LOG 2026.06.27-01:05:12 SEC-7] Wing turret arrays charged. locking thermal signature matrices.",
        "[LOG 2026.06.27-01:05:15 SEC-7] Weapon Fire: Tactical ion laser battery engaged.",
        "[LOG 2026.06.27-01:05:16 SEC-7] Direct strike logged. Enemy vessel #3 thermal sig dissolved.",
        "[LOG 2026.06.27-01:05:38 SEC-7] Adjusting nozzle vectors for high-speed orbit tracking. Bob: stable.",
        "[LOG 2026.06.27-01:06:01 SEC-7] Countermeasures active. Debris fields safely avoided.",
        "[LOG 2026.06.27-01:06:22 SEC-7] Vanguard turret locks onto flagship target.",
        "[LOG 2026.06.27-01:06:25 SEC-7] Laser fired. Outer armor plate compression verified.",
        "[LOG 2026.06.27-01:06:26 SEC-7] Threat flagship explosion registered. Debris field scattering.",
        "[LOG 2026.06.27-01:06:44 SEC-7] Remaining enemy fighters break formations, executing retreat.",
        "[LOG 2026.06.27-01:07:00 SEC-7] Sector secured. Engines reduced to patrol speed. Status: Undefeated."
      ],
      sec9: [
        "[LOG 2026.06.25-08:12:00 SEC-9] Patrol sweep: Sector 9-Beta hyperspace lanes stable.",
        "[LOG 2026.06.25-10:45:18 SEC-9] Standard biometric scan on civilian cruiser passing outer ring: APPROVED.",
        "[LOG 2026.06.25-14:22:09 SEC-9] Minor space debris field detected near orbital point beta-4.",
        "[LOG 2026.06.25-14:30:00 SEC-9] Recalibrated thruster vectors to clear gravitational pulls.",
        "[LOG 2026.06.25-19:01:45 SEC-9] All vectors clear. No hostile signatures reported. Status: Secure."
      ],
      core4: [
        "[LOG 2026.06.23-11:00:22 CORE-4] Vanguard docked at Fortress Sector 4-Delta base.",
        "[LOG 2026.06.23-12:15:00 CORE-4] Commenced standard maintenance swap of ion core nozzle plates.",
        "[LOG 2026.06.23-15:40:55 CORE-4] 340 cyborg units reported sync parameters: 99.8% structural bias.",
        "[LOG 2026.06.24-09:30:11 CORE-4] Fuel rods replenishment cycle initiated and completed. Core integrity 100%.",
        "[LOG 2026.06.24-18:00:00 CORE-4] Shield emitter coils set to passive diagnostics mode. Status: Full readiness."
      ],
      manifesto: [
        "[MANIFESTO ROW 1] We are the augmented. The carbon-composite vanguard. The shield wall.",
        "[MANIFESTO ROW 2] Our minds are linked. 340 thoughts compiled into a single tactical consensus.",
        "[MANIFESTO ROW 3] We feel no fatigue. Our engine vector nozzles pivot at the velocity of thought.",
        "[MANIFESTO ROW 4] Relentless. Cyborg. Undefeated.",
        "[MANIFESTO ROW 5] We patrol the cold void so that the core remains secure."
      ]
    };

    folders.forEach(btn => {
      btn.addEventListener('click', function() {
        folders.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const logId = this.getAttribute('data-log-id');
        const entries = logDatabase[logId];

        viewer.innerHTML = `<div class="terminal-line info">DECRYPTING CLASSIFIED COMBAT ARCHIVES: [${logId.toUpperCase()}]... SUCCESS.</div>`;

        let entryStep = 0;
        function printEntryLine() {
          if (entryStep < entries.length) {
            const row = document.createElement('div');
            row.className = 'terminal-line';
            row.textContent = entries[entryStep];
            viewer.appendChild(row);
            viewer.scrollTop = viewer.scrollHeight;
            entryStep++;
            setTimeout(printEntryLine, 100 + Math.random() * 50);
          } else {
            const caret = document.createElement('div');
            caret.innerHTML = `END OF RECORD STREAM.<span class="terminal-cursor"></span>`;
            viewer.appendChild(caret);
            viewer.scrollTop = viewer.scrollHeight;
          }
        }
        printEntryLine();
      });
    });
  }
});

// Resets animation clock and handles resize when page is restored from cache (bfcache)
window.addEventListener('pageshow', (event) => {
  lastTime = 0;
  if (typeof resizeCanvas === 'function') {
    resizeCanvas();
  }
});
