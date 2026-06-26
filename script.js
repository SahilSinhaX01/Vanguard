// ==========================================================================
// VANGUARD // 3D CINEMATIC MONOCHROME STARSHIP BACKDROP ENGINE (Three.js & GSAP)
// ==========================================================================

const canvas = document.getElementById('battle-canvas');
let renderer, scene, camera, clock;
let composer; // post-processing EffectComposer
let vanguardGroup, vanguardModel;
let starfield;
let planetMesh, planetAtmosphere;
let innerPlumeMat, outerPlumeMat;
let lastFlickerTime = 0;
let currentFlicker = 1.0;
let bobAngle = 0;
let driftX = -0.3;
let proceduralTex;
let lastGrainTime = 0;

// Programmatically generates a worn metal panel texture for micro-roughness details
function createProceduralNoiseTexture() {
  const size = 1024;
  const canvasTex = document.createElement('canvas');
  canvasTex.width = size;
  canvasTex.height = size;
  const ctx = canvasTex.getContext('2d');
  
  // Base dark gunmetal grey
  ctx.fillStyle = '#1c1c20';
  ctx.fillRect(0, 0, size, size);
  
  // Draw randomized overlapping metal armor panels
  ctx.strokeStyle = '#0a0a0c';
  ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const w = 50 + Math.random() * 150;
    const h = 50 + Math.random() * 150;
    const x = Math.random() * (size - w);
    const y = Math.random() * (size - h);
    
    // Panel shade variation (strict monochrome)
    const shade = 20 + Math.floor(Math.random() * 24);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(x, y, w, h);
    
    // Panel borders (seam lines)
    ctx.strokeRect(x, y, w, h);
  }
  
  // Add fine scratches and weathering streaks
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const len = 2 + Math.random() * 8;
    ctx.strokeStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * len, y + (Math.random() - 0.5) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvasTex);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 6);
  return texture;
}

// Recreates the exact high-fidelity capital-class warship model programmatically
function createVanguardModel() {
  const shipGroup = new THREE.Group();

  // Ship material properties per user request
  const shipMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a5a65,       // steel-grey gunmetal for high visibility and contrast
    roughness: 0.35,       // polished metallic roughness for specular edge catch
    metalness: 0.85,       // highly metallic gunmetal
    bumpMap: proceduralTex,
    bumpScale: 0.035,      // increased bump scale for deeper surface panel textures
    roughnessMap: proceduralTex
  });

  const emissiveWhiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
  });

  const glowBlueMat = new THREE.MeshBasicMaterial({
    color: 0xd0e0ff,
    transparent: true,
    opacity: 0.9
  });

  // HULL CONFIGURATION
  // Elongated capital-class warship, approximately 8:1 length-to-width ratio.
  // Dual parallel hull bodies running the full length separated by a recessed channel.
  // Needle-sharp nose tapering from a broad mid-section.
  const leftHullGroup = new THREE.Group();
  const rightHullGroup = new THREE.Group();
  
  const slices = 40;
  const sliceLen = 8.0 / slices; // 0.2 units per slice

  for (let i = 0; i < slices; i++) {
    // z ranges from -4.0 (stern) to +4.0 (nose)
    const z = -4.0 + (i + 0.5) * sliceLen;
    
    // Tapering scale
    let taper = 1.0;
    if (z > 0.5) {
      // Needle-sharp nose tapering from a broad mid-section
      taper = (4.0 - z) / 3.5;
    } else if (z < -3.0) {
      // Taper slightly at the stern
      taper = 0.85 + (z + 4.0) * 0.15;
    }

    const w = 0.38 * taper;
    const h = 0.24 * taper;

    // Recessed panel lines every 6 slices + physical segment gaps between every slice
    const isPanelGap = (i % 6 === 0);
    const scaleFactor = isPanelGap ? 0.88 : 1.0;

    // A. Main inner structural core
    const sliceGeo = new THREE.BoxGeometry(w * scaleFactor * 0.7, h * scaleFactor, sliceLen * 0.85);
    
    const leftSlice = new THREE.Mesh(sliceGeo, shipMaterial);
    leftSlice.position.set(-0.25 * taper, 0, z);
    leftSlice.castShadow = true;
    leftSlice.receiveShadow = true;
    leftHullGroup.add(leftSlice);

    const rightSlice = new THREE.Mesh(sliceGeo, shipMaterial);
    rightSlice.position.set(0.25 * taper, 0, z);
    rightSlice.castShadow = true;
    rightSlice.receiveShadow = true;
    rightHullGroup.add(rightSlice);

    // B. Outer sloped armor plates on flanks to create faceted structural depth
    const slopeGeo = new THREE.BoxGeometry(w * scaleFactor * 0.35, h * scaleFactor * 0.85, sliceLen * 0.82);
    
    const leftSlope = new THREE.Mesh(slopeGeo, shipMaterial);
    leftSlope.position.set(-0.25 * taper - w * 0.22, 0, z);
    leftSlope.rotation.z = Math.PI / 12; // sloped inwards
    leftSlope.castShadow = true;
    leftSlope.receiveShadow = true;
    leftHullGroup.add(leftSlope);

    const rightSlope = new THREE.Mesh(slopeGeo, shipMaterial);
    rightSlope.position.set(0.25 * taper + w * 0.22, 0, z);
    rightSlope.rotation.z = -Math.PI / 12; // sloped inwards
    rightSlope.castShadow = true;
    rightSlope.receiveShadow = true;
    rightHullGroup.add(rightSlope);
  }

  shipGroup.add(leftHullGroup);
  shipGroup.add(rightHullGroup);

  // ANGLED SPACE-TRUSS CROSS CONNECTORS (scaffold layout in the recessed center slot)
  for (let tz = -3.2; tz <= 2.8; tz += 0.6) {
    const strutGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.48);
    
    const strut1 = new THREE.Mesh(strutGeo, shipMaterial);
    strut1.position.set(0, 0, tz + 0.15);
    strut1.rotation.set(0, 0, Math.PI / 4); // X-brace cross strut
    strut1.castShadow = true;
    shipGroup.add(strut1);

    const strut2 = new THREE.Mesh(strutGeo, shipMaterial);
    strut2.position.set(0, 0, tz + 0.15);
    strut2.rotation.set(0, 0, -Math.PI / 4); // X-brace cross strut
    strut2.castShadow = true;
    shipGroup.add(strut2);
  }

  // TRENCH PIPING & VERTICAL STRUCTURAL RIBS
  // Deep horizontal trench detail with metallic piping running along the flanks
  const pipeGeo = new THREE.CylinderGeometry(0.012, 0.012, 7.2);
  
  const leftPipe = new THREE.Mesh(pipeGeo, shipMaterial);
  leftPipe.position.set(-0.43, 0, 0);
  leftPipe.rotation.x = Math.PI / 2;
  leftPipe.castShadow = true;
  shipGroup.add(leftPipe);

  const rightPipe = new THREE.Mesh(pipeGeo, shipMaterial);
  rightPipe.position.set(0.43, 0, 0);
  rightPipe.rotation.x = Math.PI / 2;
  rightPipe.castShadow = true;
  shipGroup.add(rightPipe);

  for (let rz = -3.2; rz <= 2.8; rz += 0.8) {
    const ribGeo = new THREE.BoxGeometry(0.02, 0.22, 0.04);
    
    const leftRib = new THREE.Mesh(ribGeo, shipMaterial);
    leftRib.position.set(-0.435, 0, rz);
    leftRib.castShadow = true;
    shipGroup.add(leftRib);

    const rightRib = new THREE.Mesh(ribGeo, shipMaterial);
    rightRib.position.set(0.435, 0, rz);
    rightRib.castShadow = true;
    shipGroup.add(rightRib);
  }

  // TIERED BRIDGE SUPERSTRUCTURE (sloped command deck & sensor mast)
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(0, 0.14, -1.0);

  // Base sloped deck
  const bBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.8), shipMaterial);
  bBase.castShadow = true;
  bBase.receiveShadow = true;
  bridgeGroup.add(bBase);

  // Command deck box
  const bDeck = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.4), shipMaterial);
  bDeck.position.set(0, 0.08, -0.1);
  bDeck.castShadow = true;
  bDeck.receiveShadow = true;
  bridgeGroup.add(bDeck);

  // Glowing command bridge visor slot
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.025, 0.04), glowBlueMat);
  win.position.set(0, 0.09, 0.11);
  bridgeGroup.add(win);

  // Communication sensor mast behind the bridge
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.35, 4), shipMaterial);
  mast.position.set(0, 0.16, -0.2);
  mast.castShadow = true;
  bridgeGroup.add(mast);

  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.008), shipMaterial);
  bar.position.set(0, 0.3, -0.2);
  bridgeGroup.add(bar);

  shipGroup.add(bridgeGroup);

  // DORSAL WEAPON TURRETS
  // 4 detailed defensive turrets along the ship spine
  const turretPositions = [-2.2, -0.8, 0.6, 1.8];
  turretPositions.forEach(zPos => {
    const tGroup = new THREE.Group();
    tGroup.position.set(0, 0.14, zPos);

    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 8), shipMaterial);
    tBase.castShadow = true;
    tGroup.add(tBase);

    const tHead = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.06), shipMaterial);
    tHead.position.y = 0.02;
    tHead.castShadow = true;
    tGroup.add(tHead);

    const barrelGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4);
    
    const leftB = new THREE.Mesh(barrelGeo, shipMaterial);
    leftB.position.set(-0.016, 0.025, 0.07);
    leftB.rotation.x = Math.PI / 2 - 0.15;
    leftB.castShadow = true;
    tGroup.add(leftB);

    const rightB = new THREE.Mesh(barrelGeo, shipMaterial);
    rightB.position.set(0.016, 0.025, 0.07);
    rightB.rotation.x = Math.PI / 2 - 0.15;
    rightB.castShadow = true;
    tGroup.add(rightB);

    shipGroup.add(tGroup);
  });

  // RECESSED HANGAR BAYS
  // Twin hangars on the flanks with glowing runways
  for (let side of [-1, 1]) {
    const hangarGroup = new THREE.Group();
    hangarGroup.position.set(side * 0.34, -0.01, -2.2);

    const opening = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.4), new THREE.MeshBasicMaterial({ color: 0x010102 }));
    hangarGroup.add(opening);

    const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.005, 0.38), new THREE.MeshBasicMaterial({ color: 0x50c0ff, transparent: true, opacity: 0.85 }));
    lightStrip.position.set(-side * 0.008, -0.032, 0);
    hangarGroup.add(lightStrip);

    shipGroup.add(hangarGroup);
  }

  // LONGITUDINAL RIDGE DETAILS
  const leftRidgeGeo = new THREE.BoxGeometry(0.10, 0.05, 7.8);
  const leftRidge = new THREE.Mesh(leftRidgeGeo, shipMaterial);
  leftRidge.position.set(-0.25, 0.14, 0);
  leftRidge.castShadow = true;
  leftRidge.receiveShadow = true;
  shipGroup.add(leftRidge);

  const rightRidgeGeo = new THREE.BoxGeometry(0.10, 0.05, 7.8);
  const rightRidge = new THREE.Mesh(rightRidgeGeo, shipMaterial);
  rightRidge.position.set(0.25, 0.14, 0);
  rightRidge.castShadow = true;
  rightRidge.receiveShadow = true;
  shipGroup.add(rightRidge);

  // RECTANGULAR MODULE BLOCKS
  const moduleCount = 28;
  for (let k = 0; k < moduleCount; k++) {
    const isLeft = Math.random() > 0.5;
    const zPos = -3.2 + Math.random() * 5.0;
    const mw = 0.08 + Math.random() * 0.10;
    const mh = 0.04 + Math.random() * 0.06;
    const md = 0.15 + Math.random() * 0.30;

    const modGeo = new THREE.BoxGeometry(mw, mh, md);
    const mod = new THREE.Mesh(modGeo, shipMaterial);
    
    const xPos = (isLeft ? -0.25 : 0.25) + (Math.random() - 0.5) * 0.08;
    mod.position.set(xPos, 0.15, zPos);
    mod.castShadow = true;
    mod.receiveShadow = true;
    shipGroup.add(mod);
  }

  // ANTENNA ARRAYS & SENSOR BLISTERS
  for (let side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const zPos = -2.5 + k * 1.5;
      const antGroup = new THREE.Group();
      antGroup.position.set(side * 0.44, 0, zPos);
      
      const mastGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4);
      const mast = new THREE.Mesh(mastGeo, shipMaterial);
      mast.rotation.z = side * Math.PI / 3;
      mast.castShadow = true;
      antGroup.add(mast);

      const barGeo = new THREE.BoxGeometry(0.06, 0.008, 0.008);
      const bar = new THREE.Mesh(barGeo, shipMaterial);
      bar.position.y = 0.1;
      bar.rotation.z = side * Math.PI / 3;
      antGroup.add(bar);
      
      shipGroup.add(antGroup);
    }

    for (let k = 0; k < 6; k++) {
      const zPos = -3.0 + k * 1.2;
      const domeGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const dome = new THREE.Mesh(domeGeo, shipMaterial);
      dome.scale.set(1.5, 0.6, 1.5);
      dome.position.set(side * 0.42, 0.02, zPos);
      dome.rotation.z = side * Math.PI / 2;
      dome.castShadow = true;
      shipGroup.add(dome);
    }
  }

  // FOUR SWEPT-BACK DELTA FINS AT THE STERN
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.2, 0.8);
  finShape.lineTo(0.6, 0.2);
  finShape.lineTo(0.4, 0.0);
  finShape.closePath();

  const extrudeSettings = {
    depth: 0.015,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.005,
    bevelThickness: 0.005
  };
  const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
  finGeo.center();

  const finScale = 1.2;

  const leftDorsal = new THREE.Mesh(finGeo, shipMaterial);
  leftDorsal.scale.set(finScale, finScale, finScale);
  leftDorsal.position.set(-0.35, 0.35, -3.4);
  leftDorsal.rotation.set(-0.3, 0.2, Math.PI / 6);
  leftDorsal.castShadow = true;
  leftDorsal.receiveShadow = true;
  shipGroup.add(leftDorsal);

  const rightDorsal = new THREE.Mesh(finGeo, shipMaterial);
  rightDorsal.scale.set(finScale, finScale, finScale);
  rightDorsal.position.set(0.35, 0.35, -3.4);
  rightDorsal.rotation.set(-0.3, -0.2, -Math.PI / 6);
  rightDorsal.castShadow = true;
  rightDorsal.receiveShadow = true;
  shipGroup.add(rightDorsal);

  const leftVentral = new THREE.Mesh(finGeo, shipMaterial);
  leftVentral.scale.set(finScale, finScale, finScale);
  leftVentral.position.set(-0.35, -0.35, -3.4);
  leftVentral.rotation.set(0.3, 0.2, 5 * Math.PI / 6);
  leftVentral.castShadow = true;
  leftVentral.receiveShadow = true;
  shipGroup.add(leftVentral);

  const rightVentral = new THREE.Mesh(finGeo, shipMaterial);
  rightVentral.scale.set(finScale, finScale, finScale);
  rightVentral.position.set(0.35, -0.35, -3.4);
  rightVentral.rotation.set(0.3, -0.2, -5 * Math.PI / 6);
  rightVentral.castShadow = true;
  rightVentral.receiveShadow = true;
  shipGroup.add(rightVentral);

  // TWO THRUSTER NOZZLE CLUSTERS AT THE STERN
  const nozzlePositions = [
    [-0.32, 0.0, -4.0],
    [-0.12, 0.0, -4.0]
  ];

  nozzlePositions.forEach(pos => {
    const outerGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.28, 8);
    const outer = new THREE.Mesh(outerGeo, shipMaterial);
    outer.position.set(pos[0], pos[1], pos[2]);
    outer.rotation.x = Math.PI / 2;
    outer.castShadow = true;
    shipGroup.add(outer);

    const innerGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8);
    const inner = new THREE.Mesh(innerGeo, emissiveWhiteMat);
    inner.position.set(pos[0], pos[1], pos[2] - 0.12);
    inner.rotation.x = Math.PI / 2;
    shipGroup.add(inner);
  });

  return shipGroup;
}

// Injects the cinematic vignette and animated film grain DOM layers
function initCinematicOverlays() {
  if (document.getElementById('cinematic-film-grain')) return;

  // Create 128x128 film grain base noise texture in memory
  const noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const noiseCtx = noiseCanvas.getContext('2d');
  const noiseImg = noiseCtx.createImageData(128, 128);
  const noiseData = noiseImg.data;
  for (let i = 0; i < noiseData.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    noiseData[i] = val;
    noiseData[i+1] = val;
    noiseData[i+2] = val;
    noiseData[i+3] = 30; // opacity transparency
  }
  noiseCtx.putImageData(noiseImg, 0, 0);

  // Overlay container div
  const grainDiv = document.createElement('div');
  grainDiv.id = 'cinematic-film-grain';
  grainDiv.style.position = 'fixed';
  grainDiv.style.top = '0';
  grainDiv.style.left = '0';
  grainDiv.style.width = '100vw';
  grainDiv.style.height = '100vh';
  grainDiv.style.zIndex = '999';
  grainDiv.style.pointerEvents = 'none';
  grainDiv.style.opacity = '0.12'; // 12% opacity
  grainDiv.style.backgroundImage = `url(${noiseCanvas.toDataURL()})`;
  grainDiv.style.backgroundRepeat = 'repeat';
  document.body.appendChild(grainDiv);

  // Vignette darkening corners to pure black
  const vignetteDiv = document.createElement('div');
  vignetteDiv.id = 'cinematic-vignette';
  vignetteDiv.style.position = 'fixed';
  vignetteDiv.style.top = '0';
  vignetteDiv.style.left = '0';
  vignetteDiv.style.width = '100vw';
  vignetteDiv.style.height = '100vh';
  vignetteDiv.style.zIndex = '998';
  vignetteDiv.style.pointerEvents = 'none';
  vignetteDiv.style.background = 'radial-gradient(circle, transparent 35%, rgba(0, 0, 0, 0.95) 100%)';
  document.body.appendChild(vignetteDiv);
}

// Update loop for film grain position (animates at 24fps)
function updateFilmGrain(time) {
  const grainDiv = document.getElementById('cinematic-film-grain');
  if (grainDiv && time - lastGrainTime > 1.0 / 24.0) { // 24fps
    const x = Math.floor(Math.random() * 128);
    const y = Math.floor(Math.random() * 128);
    grainDiv.style.backgroundPosition = `${x}px ${y}px`;
    lastGrainTime = time;
  }
}

// Initialize Three.js WebGL Scene
function init3D() {
  // 1. Renderer Setup
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  
  // Enable shadows
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 2. Scene & Camera Setup
  scene = new THREE.Scene();
  clock = new THREE.Clock();
  
  // Set up camera corresponding to a 3/4 upper-left camera view
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 150);
  camera.position.set(-4.5, 2.5, -6.5);
  camera.lookAt(0, 0, 0); // Camera centers at origin

  // 3. Cinematic Hard Lighting setup (Single hard rim light from upper-left + front fill light)
  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0); // single hard rim light from behind
  dirLight.position.set(-8, 6, 8); 
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 25;
  dirLight.shadow.camera.left = -6;
  dirLight.shadow.camera.right = 6;
  dirLight.shadow.camera.top = 6;
  dirLight.shadow.camera.bottom = -6;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Dynamic front fill light placed next to the camera to illuminate the details facing the camera (increased to 1.2)
  const cameraFillLight = new THREE.DirectionalLight(0xffffff, 1.2); 
  cameraFillLight.position.set(-4.5, 3.5, -6.5); // aligns with camera view position
  scene.add(cameraFillLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.20); // soft baseline ambient fill (increased to 0.20)
  scene.add(ambientLight);

  // 4. Generate procedural textures & ship assemblies
  proceduralTex = createProceduralNoiseTexture();

  vanguardGroup = new THREE.Group();
  vanguardModel = new THREE.Group(); // Inner model for micro-animations
  vanguardGroup.add(vanguardModel);

  // Initial ship orientation: 3/4 view, ship nose pointing upper-right at 25 degrees, slight roll of 15 degrees clockwise
  vanguardGroup.position.set(-1.4, -0.9, 1.0); // Shift ship further left and down in the viewport
  vanguardGroup.rotation.set(0.2, -0.6, 0.26); // pitch, yaw, roll
  scene.add(vanguardGroup);

  const shipMesh = createVanguardModel();
  vanguardModel.add(shipMesh);

  // 5. Custom ShaderMaterial Starfield (800 point sprites twinkling independently)
  const starCount = 800;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  const starSpeeds = new Float32Array(starCount);
  const starPhases = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    // Spread stars out far in the background
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() - 0.5) * 2);
    const dist = 75 + Math.random() * 20;

    starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * dist;
    starPositions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * dist;
    starPositions[i * 3 + 2] = Math.cos(phi) * dist;

    // Twinkling sizes 0.3px to 1.8px
    starSizes[i] = 0.3 + Math.random() * 1.5;
    // Twinkling durations 0.3s to 2.5s -> frequency = 2*PI / duration
    const duration = 0.3 + Math.random() * 2.2;
    starSpeeds[i] = (Math.PI * 2) / duration;
    starPhases[i] = Math.random() * Math.PI * 2;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
  starGeo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(starSpeeds, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

  const starMat = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float aSize;
      attribute float aTwinkleSpeed;
      attribute float aPhase;
      varying float vBrightness;
      uniform float uTime;
      void main() {
        vBrightness = 0.35 + 0.65 * sin(uTime * aTwinkleSpeed + aPhase);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * (350.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      varying float vBrightness;
      uniform vec3 uColor;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        if (length(uv) > 0.5) discard;
        float dist = length(uv);
        float alpha = smoothstep(0.5, 0.1, dist) * vBrightness;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    uniforms: {
      uTime: { value: 0.0 },
      uColor: { value: new THREE.Color(0xd0e0ff) } // cold blue-white
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  starfield = new THREE.Points(starGeo, starMat);
  scene.add(starfield);

  // 6. Two long thruster plume streaks (1 inner core, 1 outer diffused)
  // Inner plume: tight bright-white core (Y translated and rotated)
  const innerPlumeGeo = new THREE.CylinderGeometry(0.012, 0.012, 6.0, 8, 1, true);
  innerPlumeGeo.translate(0, -3.0, 0);
  innerPlumeGeo.rotateX(Math.PI / 2);

  // Outer plume: wider diffused cone
  const outerPlumeGeo = new THREE.ConeGeometry(0.18, 11.0, 8, 1, true);
  outerPlumeGeo.translate(0, -5.5, 0);
  outerPlumeGeo.rotateX(Math.PI / 2);

  innerPlumeMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uFlicker;
      void main() {
        float fade = 1.0 - vUv.y;
        float alpha = pow(fade, 1.2) * uFlicker;
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha); // tight white core
      }
    `,
    uniforms: {
      uFlicker: { value: 1.0 }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  outerPlumeMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uFlicker;
      uniform vec3 uColor;
      void main() {
        float fade = 1.0 - vUv.y;
        float alpha = pow(fade, 3.2) * uFlicker * 0.22;
        gl_FragColor = vec4(uColor, alpha); // wide diffused blue-white cone
      }
    `,
    uniforms: {
      uFlicker: { value: 1.0 },
      uColor: { value: new THREE.Color(0xd0e0ff) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const nozzleOffsets = [-0.32, -0.12];
  nozzleOffsets.forEach(offsetX => {
    const inner = new THREE.Mesh(innerPlumeGeo, innerPlumeMat);
    inner.position.set(offsetX, 0, -4.0);
    vanguardModel.add(inner);

    const outer = new THREE.Mesh(outerPlumeGeo, outerPlumeMat);
    outer.position.set(offsetX, 0, -4.0);
    vanguardModel.add(outer);
  });

  // 7. Distant Planet Arc (Left-back sphere, only 35% upper-right limb visible)
  const planetGeo = new THREE.SphereGeometry(12.0, 32, 32);
  const planetMat = new THREE.MeshStandardMaterial({
    color: 0x18181c, // deep grey-charcoal
    roughness: 0.9,
    metalness: 0.1
  });
  planetMesh = new THREE.Mesh(planetGeo, planetMat);
  planetMesh.position.set(-15, -2, -25);
  scene.add(planetMesh);

  // Planet atmospheric rim glow in cold blue-white
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      uniform vec3 uColor;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float intensity = pow(0.7 - dot(normal, viewDir), 2.5);
        gl_FragColor = vec4(uColor, intensity * 0.9);
      }
    `,
    uniforms: {
      uColor: { value: new THREE.Color(0xd0e0ff) }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
  });

  planetAtmosphere = new THREE.Mesh(planetGeo, atmosMat);
  planetAtmosphere.position.copy(planetMesh.position);
  planetAtmosphere.scale.setScalar(1.025);
  scene.add(planetAtmosphere);

  // 8. Dynamic Overlay injection
  initCinematicOverlays();

  // 9. Post Processing Pipeline setup (Bypassed if EffectComposer scripts aren't loaded on subpages)
  if (typeof THREE.EffectComposer !== 'undefined') {
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.4, // bloom strength
      0.5, // bloom radius
      0.9  // bloom threshold
    );
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
  }

  // 10. Listeners
  window.addEventListener('resize', onWindowResize);
}

// Window resizing handler
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) {
    composer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 3D Battle Logic Update Loop
function gameLoop(time) {
  if (!renderer) return;

  const timeSec = time * 0.001;

  // A. Starfield Twinkle timer progress
  if (starfield && starfield.material.uniforms) {
    starfield.material.uniforms.uTime.value = timeSec;
  }

  // B. Thruster Plume 8-12fps Flicker updates
  if (time - lastFlickerTime > 100.0) { // update at ~10fps
    currentFlicker = 0.8 + Math.random() * 0.2;
    lastFlickerTime = time;
    if (innerPlumeMat && outerPlumeMat) {
      innerPlumeMat.uniforms.uFlicker.value = currentFlicker;
      outerPlumeMat.uniforms.uFlicker.value = currentFlicker;
    }
  }

  // C. Ship Micro-Animations
  // (1) slow continuous roll rotation on Z axis at 0.0003 rad/frame
  vanguardModel.rotation.z += 0.0003;

  // (2) gentle sinusoidal bob on Y axis amplitude 0.8 units at 0.0008 rad/frame
  bobAngle += 0.0008;
  vanguardModel.position.y = Math.sin(bobAngle) * 0.8;

  // (3) extremely slow forward drift on X at 0.00015 units/frame looping with reset
  driftX += 0.00015;
  if (driftX > 0.4) {
    driftX = -0.4;
  }
  vanguardModel.position.x = driftX;

  // D. Animate Film Grain Overlay
  updateFilmGrain(time);

  // E. Render scene (Bloom composer or Fallback)
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  requestAnimationFrame(gameLoop);
}

// Start Three.js Space Engine
init3D();
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
  if (typeof onWindowResize === 'function') {
    onWindowResize();
  }
});
