// ASTRAL DUNGEON RPG - CORE GAME ENGINE
(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (ZERO-ASSET PROCEDURAL WEB AUDIO) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    playSwing() {
      this.init(); if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      filter.type = 'lowpass'; filter.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.19);
    }
    playHit() {
      this.init(); if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.15);
    }
    playBlock() {
      this.init(); if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.13);
    }
    playCoin() {
      this.init(); if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.23);
    }
    playChest() {
      this.init(); if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + 0.36);
      });
    }
    playHeal() {
      this.init(); if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.36);
    }
    playDeath() {
      this.init(); if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(now); osc.stop(now + 0.66);
    }
  }

  const sfx = new SoundFX();

  // --- GAME STATE ---
  const state = {
    mode: 'TITLE', // 'TITLE', 'PLAYING', 'GAMEOVER', 'VICTORY'
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    gold: 0,
    ruby: 0,
    sapphire: 0,
    potions: 2,
    level: 1,
    enemiesAlive: 0,
    totalEnemies: 0,
    chestsOpened: 0
  };

  // --- THREE.JS GLOBALS ---
  let scene, camera, renderer, clock;
  let hero = null;
  let dungeonGroup, enemies = [], interactables = [], lootPickups = [], torches = [];
  const keys = {};
  const mouse = { x: 0, y: 0, worldPos: new THREE.Vector3(), isDown: false, rightDown: false };
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Asset models cache
  const loadedAssets = {};

  function base64ToBuffer(b64) {
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr.buffer;
  }

  function parseAssetGLB(role, b64, callback) {
    const loader = new THREE.GLTFLoader();
    const buffer = base64ToBuffer(b64);
    loader.parse(buffer, '', (gltf) => {
      loadedAssets[role] = gltf;
      callback(gltf);
    }, (err) => {
      console.error('Failed to parse asset', role, err);
    });
  }

  // --- INITIALIZE ENGINE ---
  function initEngine() {
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);
    scene.fog = new THREE.FogExp2(0x060b14, 0.026);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 300);
    camera.position.set(0, 18, 20);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // --- LIGHTING ---
    const hemiLight = new THREE.HemisphereLight(0x283b5b, 0x0c1424, 1.4);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff1cf, 2.2);
    dirLight.position.set(25, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    dungeonGroup = new THREE.Group();
    scene.add(dungeonGroup);

    // Event listeners
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', e => e.preventDefault());

    // UI Buttons
    document.getElementById('start-btn').onclick = startGame;
    document.getElementById('restart-btn').onclick = restartGame;
    document.getElementById('victory-btn').onclick = restartGame;
    document.getElementById('btn-attack').onclick = () => hero && hero.attack();
    document.getElementById('btn-block').onclick = () => hero && hero.block();
    document.getElementById('btn-dodge').onclick = () => hero && hero.dodge();
    document.getElementById('btn-heal').onclick = () => usePotion();

    // Load assets sequentially then build world
    loadAllAssets(() => {
      buildDungeon();
      spawnHero();
      spawnSkeletons();
      spawnChestsAndBarrels();
      requestAnimationFrame(gameLoop);
    });
  }

  // --- ASSET LOADER PIPELINE ---
  function loadAllAssets(onComplete) {
    const assetKeys = Object.keys(window.__EMBEDDED_ASSETS__ || {});
    let loadedCount = 0;
    if (assetKeys.length === 0) {
      console.warn('No embedded assets found');
      onComplete();
      return;
    }

    assetKeys.forEach(key => {
      parseAssetGLB(key, window.__EMBEDDED_ASSETS__[key], (gltf) => {
        loadedCount++;
        if (loadedCount === assetKeys.length) {
          onComplete();
        }
      });
    });
  }

  // --- DUNGEON BUILDER ---
  function buildDungeon() {
    // Ground Foundation Floor
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x141f32,
      roughness: 0.85,
      metalness: 0.1
    });
    const mainFloor = new THREE.Mesh(groundGeo, groundMat);
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.receiveShadow = true;
    dungeonGroup.add(mainFloor);

    // Floor tile grid if GLB available
    const floorGLTF = loadedAssets['floor_tile'];
    if (floorGLTF) {
      for (let x = -20; x <= 20; x += 8) {
        for (let z = -20; z <= 20; z += 8) {
          const tile = floorGLTF.scene.clone();
          tile.position.set(x, 0, z);
          tile.scale.setScalar(2.0);
          tile.traverse(m => { if (m.isMesh) { m.receiveShadow = true; } });
          dungeonGroup.add(tile);
        }
      }
    }

    // Outer Walls (Arched wall GLB)
    const wallGLTF = loadedAssets['arched_wall'];
    if (wallGLTF) {
      // North walls (keep)
      for (let x = -24; x <= 24; x += 6) {
        const wN = wallGLTF.scene.clone();
        wN.position.set(x, 0, -25);
        wN.scale.setScalar(1.5);
        wN.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        dungeonGroup.add(wN);
      }
      // South wall: keep open at camera entrance so it doesn't occlude player view!
      // East & West walls
      for (let z = -24; z <= 24; z += 6) {
        const wE = wallGLTF.scene.clone();
        wE.position.set(25, 0, z);
        wE.rotation.y = -Math.PI / 2;
        wE.scale.setScalar(1.5);
        wE.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        dungeonGroup.add(wE);

        const wW = wallGLTF.scene.clone();
        wW.position.set(-25, 0, z);
        wW.rotation.y = Math.PI / 2;
        wW.scale.setScalar(1.5);
        wW.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        dungeonGroup.add(wW);
      }
    }

    // Pillars inside the hall
    const pillarGLTF = loadedAssets['pillar'];
    if (pillarGLTF) {
      const pillarCoords = [
        [-12, -12], [12, -12],
        [-12, 0], [12, 0],
        [-12, 12], [12, 12]
      ];
      pillarCoords.forEach(([px, pz]) => {
        const p = pillarGLTF.scene.clone();
        p.position.set(px, 0, pz);
        p.scale.setScalar(1.8);
        p.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        dungeonGroup.add(p);

        // Add mounted torch on pillar
        addTorch(px + 0.6, 2.8, pz);
      });
    }

    // Ruins decoration in corners
    const ruinsGLTF = loadedAssets['dungeon_ruins_pack'];
    if (ruinsGLTF) {
      const r1 = ruinsGLTF.scene.clone();
      r1.position.set(-20, 0, -20);
      r1.scale.setScalar(1.2);
      r1.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      dungeonGroup.add(r1);

      const r2 = ruinsGLTF.scene.clone();
      r2.position.set(20, 0, -20);
      r2.rotation.y = Math.PI / 2;
      r2.scale.setScalar(1.2);
      r2.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      dungeonGroup.add(r2);
    }
  }

  function addTorch(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const torchGLTF = loadedAssets['mounted_torch'];
    if (torchGLTF) {
      const tMesh = torchGLTF.scene.clone();
      tMesh.scale.setScalar(1.2);
      group.add(tMesh);
    }

    // Flickering PointLight
    const pLight = new THREE.PointLight(0xff9e00, 1.8, 12, 2);
    pLight.position.set(0, 0.4, 0);
    pLight.castShadow = true;
    group.add(pLight);

    torches.push({ light: pLight, baseIntensity: 1.8, timeOffset: Math.random() * 10 });
    dungeonGroup.add(group);
  }

  // --- HERO ENTITY ---
  class HeroEntity {
    constructor(gltf) {
      this.root = new THREE.Group();
      this.model = gltf.scene;
      this.model.scale.setScalar(1.6);
      this.model.traverse(m => {
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      this.root.add(this.model);
      scene.add(this.root);

      this.mixer = new THREE.AnimationMixer(this.model);
      this.actions = {};
      gltf.animations.forEach(clip => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

      this.currentAction = this.actions['Idle'] || this.actions['Unarmed_Idle'];
      if (this.currentAction) this.currentAction.play();

      this.pos = this.root.position;
      this.pos.set(0, 0, 16);
      this.velocity = new THREE.Vector3();
      this.heading = 0;
      this.speed = 7.0;

      // Combat flags
      this.isAttacking = false;
      this.isBlocking = false;
      this.isDodging = false;
      this.dodgeTimer = 0;
      this.attackCooldown = 0;
      this.comboStep = 0;
    }

    fadeTo(animName, duration = 0.15, clamp = false) {
      const next = this.actions[animName];
      if (!next || next === this.currentAction) return;
      if (clamp) {
        next.setLoop(THREE.LoopOnce);
        next.clampWhenFinished = true;
      } else {
        next.setLoop(THREE.LoopRepeat);
      }
      next.reset();
      next.play();
      if (this.currentAction) {
        this.currentAction.crossFadeTo(next, duration, true);
      }
      this.currentAction = next;
    }

    attack() {
      if (this.isAttacking || this.isDodging || state.stamina < 15) return;
      this.isAttacking = true;
      this.attackCooldown = 0.45;
      state.stamina = Math.max(0, state.stamina - 15);
      sfx.playSwing();

      const comboAnims = [
        '1H_Melee_Attack_Slice_Horizontal',
        '1H_Melee_Attack_Slice_Diagonal',
        '1H_Melee_Attack_Chop'
      ];
      const anim = comboAnims[this.comboStep % comboAnims.length];
      this.comboStep++;
      this.fadeTo(anim, 0.08, true);

      // Check hit in forward cone
      setTimeout(() => {
        this.executeHitbox();
      }, 150);

      setTimeout(() => {
        this.isAttacking = false;
        if (!this.isDodging && this.velocity.lengthSq() < 0.1) {
          this.fadeTo('Idle', 0.2);
        }
      }, 420);
    }

    executeHitbox() {
      const heroPos = this.root.position;
      const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);

      // Check damage to enemies
      enemies.forEach(enemy => {
        if (enemy.isDead) return;
        const diff = enemy.root.position.clone().sub(heroPos);
        const dist = diff.length();
        if (dist < 3.2) {
          diff.normalize();
          const dot = fwd.dot(diff);
          if (dot > 0.4) {
            enemy.takeDamage(35);
            sfx.playHit();
            spawnHitSpark(enemy.root.position.clone().add(new THREE.Vector3(0, 1.2, 0)));
          }
        }
      });

      // Check breakables (barrels)
      interactables.forEach(obj => {
        if (obj.broken) return;
        const dist = obj.mesh.position.distanceTo(heroPos);
        if (dist < 2.8) {
          obj.break();
        }
      });
    }

    block() {
      if (this.isDodging || state.stamina < 5) return;
      this.isBlocking = true;
      this.fadeTo('Block', 0.1, true);
    }

    stopBlock() {
      if (!this.isBlocking) return;
      this.isBlocking = false;
      if (this.velocity.lengthSq() > 0.1) {
        this.fadeTo('Running_A', 0.15);
      } else {
        this.fadeTo('Idle', 0.15);
      }
    }

    dodge() {
      if (this.isDodging || state.stamina < 25) return;
      this.isDodging = true;
      this.dodgeTimer = 0.4;
      state.stamina = Math.max(0, state.stamina - 25);
      sfx.playSwing();
      this.fadeTo('Dodge_Forward', 0.08, true);

      setTimeout(() => {
        this.isDodging = false;
        if (this.velocity.lengthSq() > 0.1) {
          this.fadeTo('Running_A', 0.15);
        } else {
          this.fadeTo('Idle', 0.15);
        }
      }, 400);
    }

    takeDamage(dmg) {
      if (this.isDodging) return; // i-frames
      if (this.isBlocking) {
        sfx.playBlock();
        state.stamina = Math.max(0, state.stamina - 15);
        dmg = Math.round(dmg * 0.2); // 80% damage reduction
      } else {
        sfx.playHit();
        this.fadeTo('Hit_A', 0.08, true);
        setTimeout(() => {
          if (!this.isAttacking && !this.isDodging) this.fadeTo('Idle', 0.15);
        }, 300);
      }

      state.hp = Math.max(0, state.hp - dmg);
      updateHUD();

      if (state.hp <= 0 && state.mode === 'PLAYING') {
        this.die();
      }
    }

    die() {
      state.mode = 'GAMEOVER';
      sfx.playDeath();
      this.fadeTo('Death_A', 0.2, true);
      document.getElementById('game-over-modal').classList.remove('hidden');
    }

    update(dt) {
      if (this.mixer) this.mixer.update(dt);
      if (state.mode !== 'PLAYING') return;

      // Stamina regeneration
      if (!this.isBlocking && !this.isDodging && state.stamina < state.maxStamina) {
        state.stamina = Math.min(state.maxStamina, state.stamina + 20 * dt);
      }

      // Movement Input
      let mx = 0, mz = 0;
      if (keys['w'] || keys['arrowup']) mz -= 1;
      if (keys['s'] || keys['arrowdown']) mz += 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;

      const inputLen = Math.hypot(mx, mz);
      if (inputLen > 0 && !this.isDodging) {
        mx /= inputLen; mz /= inputLen;
        this.velocity.set(mx * this.speed, 0, mz * this.speed);
        this.heading = Math.atan2(mx, mz);
        this.root.rotation.y = this.heading;

        if (!this.isAttacking && !this.isBlocking) {
          this.fadeTo('Running_A', 0.15);
        }
      } else if (this.isDodging) {
        // Dash forward in current facing direction
        const dodgeSpeed = 14.0;
        this.velocity.set(Math.sin(this.heading) * dodgeSpeed, 0, Math.cos(this.heading) * dodgeSpeed);
      } else {
        this.velocity.set(0, 0, 0);
        if (!this.isAttacking && !this.isBlocking) {
          this.fadeTo('Idle', 0.15);
        }
      }

      // Apply movement with dungeon bounds
      this.pos.x = Math.max(-23, Math.min(23, this.pos.x + this.velocity.x * dt));
      this.pos.z = Math.max(-23, Math.min(23, this.pos.z + this.velocity.z * dt));
    }
  }

  // --- SKELETON ENEMY ENTITY ---
  class SkeletonEntity {
    constructor(gltf, spawnPos) {
      this.root = new THREE.Group();
      this.model = THREE.SkeletonUtils.clone(gltf.scene);
      this.model.scale.setScalar(1.5);
      this.model.traverse(m => {
        if (m.isMesh) {
          m.castShadow = true;
          m.receiveShadow = true;
        }
      });
      this.root.add(this.model);
      scene.add(this.root);

      this.mixer = new THREE.AnimationMixer(this.model);
      this.actions = {};
      gltf.animations.forEach(clip => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

      this.currentAction = this.actions['Idle_Combat'] || this.actions['Idle'];
      if (this.currentAction) this.currentAction.play();

      this.root.position.copy(spawnPos);
      this.hp = 80;
      this.maxHp = 80;
      this.speed = 3.8;
      this.isDead = false;
      this.state = 'PATROL'; // 'PATROL', 'CHASE', 'ATTACK'
      this.attackTimer = 0;
      this.patrolAngle = Math.random() * Math.PI * 2;
    }

    fadeTo(animName, duration = 0.15, clamp = false) {
      const next = this.actions[animName];
      if (!next || next === this.currentAction) return;
      if (clamp) {
        next.setLoop(THREE.LoopOnce);
        next.clampWhenFinished = true;
      } else {
        next.setLoop(THREE.LoopRepeat);
      }
      next.reset();
      next.play();
      if (this.currentAction) {
        this.currentAction.crossFadeTo(next, duration, true);
      }
      this.currentAction = next;
    }

    takeDamage(dmg) {
      if (this.isDead) return;
      this.hp -= dmg;
      if (this.hp <= 0) {
        this.die();
      } else {
        this.fadeTo('Hit_A', 0.08, true);
        setTimeout(() => {
          if (!this.isDead) this.fadeTo('Running_A', 0.15);
        }, 280);
      }
    }

    die() {
      this.isDead = true;
      this.fadeTo('Death_A', 0.15, true);
      state.enemiesAlive--;
      updateHUD();

      // Drop loot (Gold coin + chance of Ruby or Potion)
      spawnLootDrop(this.root.position.clone());

      setTimeout(() => {
        scene.remove(this.root);
      }, 3500);

      // Check Victory Condition
      if (state.enemiesAlive <= 0 && state.mode === 'PLAYING') {
        setTimeout(() => {
          state.mode = 'VICTORY';
          sfx.playChest();
          document.getElementById('victory-modal').classList.remove('hidden');
        }, 1200);
      }
    }

    update(dt, heroPos) {
      if (this.mixer) this.mixer.update(dt);
      if (this.isDead || state.mode !== 'PLAYING') return;

      const diff = heroPos.clone().sub(this.root.position);
      diff.y = 0;
      const dist = diff.length();

      if (dist < 14.0) {
        // Aggro & Chase Hero
        this.state = 'CHASE';
        if (dist > 2.2) {
          diff.normalize();
          this.root.position.addScaledVector(diff, this.speed * dt);
          this.root.rotation.y = Math.atan2(diff.x, diff.z);
          this.fadeTo('Running_A', 0.15);
        } else {
          // Melee range -> Attack
          this.attackTimer += dt;
          this.root.rotation.y = Math.atan2(diff.x, diff.z);
          if (this.attackTimer > 1.4) {
            this.attackTimer = 0;
            this.fadeTo('1H_Melee_Attack_Slice_Diagonal', 0.08, true);
            sfx.playSwing();
            setTimeout(() => {
              if (!this.isDead && hero && this.root.position.distanceTo(hero.root.position) < 2.8) {
                hero.takeDamage(20);
              }
            }, 300);
          }
        }
      } else {
        // Idle / Wander
        this.fadeTo('Idle_Combat', 0.2);
      }
    }
  }

  // --- SPAWN ENTITIES ---
  function spawnHero() {
    const gltf = loadedAssets['hero_knight'];
    if (gltf) {
      hero = new HeroEntity(gltf);
    }
  }

  function spawnSkeletons() {
    const gltf = loadedAssets['enemy_skeleton_warrior'];
    if (!gltf) return;

    const spawnCoords = [
      new THREE.Vector3(0, 0, 6),   // Close front guard skeleton
      new THREE.Vector3(-8, 0, -2),  // Left flank
      new THREE.Vector3(8, 0, -2),   // Right flank
      new THREE.Vector3(-12, 0, -12),
      new THREE.Vector3(0, 0, -16)  // Boss skeleton at altar
    ];

    state.totalEnemies = spawnCoords.length;
    state.enemiesAlive = spawnCoords.length;

    spawnCoords.forEach(pos => {
      const sk = new SkeletonEntity(gltf, pos);
      enemies.push(sk);
    });
  }

  function spawnChestsAndBarrels() {
    // Gold Chests
    const chestGLTF = loadedAssets['chest'];
    if (chestGLTF) {
      const chestPositions = [
        new THREE.Vector3(0, 0, -22), // Master chest at back altar
        new THREE.Vector3(-18, 0, 16),
        new THREE.Vector3(18, 0, 16)
      ];

      chestPositions.forEach(pos => {
        const mesh = chestGLTF.scene.clone();
        mesh.position.copy(pos);
        mesh.scale.setScalar(1.6);
        mesh.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        dungeonGroup.add(mesh);

        interactables.push({
          type: 'CHEST',
          mesh: mesh,
          opened: false,
          open: function() {
            if (this.opened) return;
            this.opened = true;
            state.chestsOpened++;
            sfx.playChest();
            // Rotate lid
            mesh.traverse(child => {
              if (child.name.toLowerCase().includes('lid') || child.name.toLowerCase().includes('top')) {
                child.rotation.x = -Math.PI / 3;
              }
            });
            // Erupt coins & gems
            for (let i = 0; i < 6; i++) {
              spawnLootDrop(mesh.position.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0.5, (Math.random() - 0.5) * 2)));
            }
          }
        });
      });
    }

    // Breakable Barrels
    const barrelGLTF = loadedAssets['barrel'];
    if (barrelGLTF) {
      const barrelCoords = [
        [-8, 10], [-6, 12], [8, 10], [6, 12],
        [-16, -10], [16, -10], [-8, -18], [8, -18]
      ];
      barrelCoords.forEach(([bx, bz]) => {
        const bMesh = barrelGLTF.scene.clone();
        bMesh.position.set(bx, 0, bz);
        bMesh.scale.setScalar(1.5);
        bMesh.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
        dungeonGroup.add(bMesh);

        interactables.push({
          type: 'BARREL',
          mesh: bMesh,
          broken: false,
          break: function() {
            if (this.broken) return;
            this.broken = true;
            sfx.playHit();
            dungeonGroup.remove(this.mesh);
            spawnHitSpark(this.mesh.position.clone().add(new THREE.Vector3(0, 0.8, 0)));
            // Drop loot
            spawnLootDrop(this.mesh.position.clone());
          }
        });
      });
    }
  }

  // --- LOOT PICKUPS (COINS, GEMS, POTIONS) ---
  function spawnLootDrop(pos) {
    const roll = Math.random();
    let lootType = 'COIN';
    let assetKey = 'coin_stack';

    if (roll < 0.45) {
      lootType = 'COIN'; assetKey = 'coin_stack';
    } else if (roll < 0.7) {
      lootType = 'RUBY'; assetKey = 'ruby';
    } else if (roll < 0.88) {
      lootType = 'SAPPHIRE'; assetKey = 'sapphire';
    } else {
      lootType = 'POTION'; assetKey = 'health_potion';
    }

    const gltf = loadedAssets[assetKey];
    if (!gltf) return;

    const mesh = gltf.scene.clone();
    mesh.position.copy(pos);
    mesh.position.y = 0.5;
    mesh.scale.setScalar(lootType === 'COIN' ? 1.4 : 1.8);
    scene.add(mesh);

    lootPickups.push({
      type: lootType,
      mesh: mesh,
      active: true,
      time: Math.random() * 10
    });
  }

  function spawnHitSpark(pos) {
    const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(sparkGeo, sparkMat);
      p.position.copy(pos);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 4);
      scene.add(p);
      const startTime = performance.now();
      const interval = setInterval(() => {
        p.position.addScaledVector(vel, 0.02);
        vel.y -= 0.15;
        if (performance.now() - startTime > 400) {
          clearInterval(interval);
          scene.remove(p);
        }
      }, 20);
    }
  }

  function usePotion() {
    if (state.potions <= 0 || state.hp >= state.maxHp) return;
    state.potions--;
    state.hp = Math.min(state.maxHp, state.hp + 45);
    sfx.playHeal();
    updateHUD();
    if (hero) spawnHitSpark(hero.root.position.clone().add(new THREE.Vector3(0, 1.0, 0)));
  }

  function updateHUD() {
    document.getElementById('hp-bar').style.width = (state.hp / state.maxHp * 100) + '%';
    document.getElementById('hp-text').textContent = `${Math.round(state.hp)} / ${state.maxHp} HP`;
    document.getElementById('stam-bar').style.width = (state.stamina / state.maxStamina * 100) + '%';
    document.getElementById('stam-text').textContent = `${Math.round(state.stamina)} / ${state.maxStamina} STAMINA`;

    document.getElementById('gold-count').textContent = state.gold;
    document.getElementById('ruby-count').textContent = state.ruby;
    document.getElementById('sapphire-count').textContent = state.sapphire;
    document.getElementById('potion-count').textContent = state.potions;
  }

  // --- CONTROLS / INPUT ---
  function onKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    if (e.repeat) return;

    if (e.key === 'j' || e.key === 'J') {
      if (hero) hero.attack();
    } else if (e.key === 'k' || e.key === 'K') {
      if (hero) hero.block();
    } else if (e.key === ' ' || e.key === 'l' || e.key === 'L') {
      if (hero) hero.dodge();
    } else if (e.key === 'e' || e.key === 'E' || e.key === 'q' || e.key === 'Q') {
      usePotion();
    } else if (e.key === 'f' || e.key === 'F') {
      // Interact with nearest chest
      if (hero) {
        interactables.forEach(item => {
          if (item.type === 'CHEST' && !item.opened) {
            if (item.mesh.position.distanceTo(hero.root.position) < 3.2) {
              item.open();
            }
          }
        });
      }
    }
  }

  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
    if (e.key === 'k' || e.key === 'K') {
      if (hero) hero.stopBlock();
    }
  }

  function onMouseMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(groundPlane, mouse.worldPos);

    const crosshair = document.getElementById('crosshair');
    if (crosshair && state.mode === 'PLAYING') {
      crosshair.style.display = 'block';
      crosshair.style.left = e.clientX + 'px';
      crosshair.style.top = e.clientY + 'px';
    }
  }

  function onMouseDown(e) {
    if (e.button === 0) {
      if (hero && state.mode === 'PLAYING') hero.attack();
    } else if (e.button === 2) {
      if (hero && state.mode === 'PLAYING') hero.block();
    }
  }

  function onMouseUp(e) {
    if (e.button === 2) {
      if (hero && state.mode === 'PLAYING') hero.stopBlock();
    }
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function startGame() {
    state.mode = 'PLAYING';
    sfx.init();
    document.getElementById('title-modal').classList.add('hidden');
    document.getElementById('game-over-modal').classList.add('hidden');
    document.getElementById('victory-modal').classList.add('hidden');
  }

  function restartGame() {
    state.hp = state.maxHp;
    state.stamina = state.maxStamina;
    state.gold = 0;
    state.ruby = 0;
    state.sapphire = 0;
    state.potions = 2;
    state.chestsOpened = 0;

    if (hero) {
      hero.pos.set(0, 0, 16);
      hero.isAttacking = false;
      hero.isBlocking = false;
      hero.isDodging = false;
      hero.fadeTo('Idle', 0.1);
    }

    // Reset enemies
    enemies.forEach(sk => scene.remove(sk.root));
    enemies = [];
    spawnSkeletons();

    updateHUD();
    startGame();
  }

  // --- MAIN GAME LOOP (60 FPS) ---
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    const dt = Math.min(0.064, clock.getDelta());

    // Update Torch Light Flickering
    torches.forEach(t => {
      t.timeOffset += dt * 8;
      t.light.intensity = t.baseIntensity + Math.sin(t.timeOffset) * 0.35 + Math.cos(t.timeOffset * 1.7) * 0.2;
    });

    if (hero) {
      hero.update(dt);

      // Camera Follow Hero
      const targetCam = hero.root.position.clone().add(new THREE.Vector3(0, 15, 14));
      camera.position.lerp(targetCam, dt * 5.0);
      camera.lookAt(hero.root.position.clone().add(new THREE.Vector3(0, 1.2, 0)));

      // Update Enemies
      enemies.forEach(enemy => enemy.update(dt, hero.root.position));

      // Update Loot Pickups
      lootPickups.forEach(item => {
        if (!item.active) return;
        item.time += dt * 3.0;
        item.mesh.rotation.y += dt * 2.0;
        item.mesh.position.y = 0.5 + Math.sin(item.time) * 0.15;

        // Magnetism toward hero
        const dist = item.mesh.position.distanceTo(hero.root.position);
        if (dist < 2.5) {
          item.active = false;
          scene.remove(item.mesh);
          sfx.playCoin();
          if (item.type === 'COIN') state.gold += 25;
          else if (item.type === 'RUBY') state.ruby += 1;
          else if (item.type === 'SAPPHIRE') state.sapphire += 1;
          else if (item.type === 'POTION') state.potions += 1;
          updateHUD();
        }
      });
    }

    updateHUD();
    renderer.render(scene, camera);
  }

  // --- AUTOMATED TESTING HOOKS ---
  window.__ASTRAL_RPG__ = {
    getState: () => ({
      mode: state.mode,
      hp: state.hp,
      stamina: state.stamina,
      gold: state.gold,
      ruby: state.ruby,
      sapphire: state.sapphire,
      potions: state.potions,
      enemiesAlive: state.enemiesAlive,
      totalEnemies: state.totalEnemies,
      chestsCount: interactables.filter(i => i.type === 'CHEST').length,
      barrelsCount: interactables.filter(i => i.type === 'BARREL').length,
      heroLoaded: !!hero,
      assetsLoaded: Object.keys(loadedAssets).length
    }),
    start: startGame,
    restart: restartGame,
    attack: () => hero && hero.attack(),
    block: () => hero && hero.block(),
    dodge: () => hero && hero.dodge(),
    heal: usePotion,
    openNearestChest: () => {
      interactables.forEach(i => { if (i.type === 'CHEST' && !i.opened) i.open(); });
    }
  };

  // Boot on DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initEngine();
  } else {
    window.addEventListener('DOMContentLoaded', initEngine);
  }

})();
