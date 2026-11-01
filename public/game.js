'use strict';

    /**
     * =========================================================================
     * 1. PROCEDURAL WEB AUDIO SYNTHESIZER
     * =========================================================================
     */
    class RetroAudio {
      constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
      }

      init() {
        if (this.initialized) return;
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx({ latencyHint: 'interactive' });
          this.initialized = true;
        } catch (e) {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.initialized = true;
          } catch (err) {
            console.warn('Web Audio not supported', err);
          }
        }
      }

      resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      toggleMute() {
        this.muted = !this.muted;
        return this.muted;
      }

      tone(freq, dur = 0.1, type = 'square', vol = 0.08, slide = 0) {
        if (this.muted) return;
        const now = performance.now();
        // Voice-limiting: throttle rapid identical sound triggers (< 45ms) to prevent audio buffer saturation
        const soundKey = `${freq}_${type}`;
        if (!this._lastSoundTimes) this._lastSoundTimes = {};
        if (this._lastSoundTimes[soundKey] && (now - this._lastSoundTimes[soundKey] < 45)) {
          return;
        }
        this._lastSoundTimes[soundKey] = now;
        try {
          this.init();
          this.resume();
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, t);
          if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
          gain.gain.setValueAtTime(vol, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + dur);
        } catch (e) {}
      }

      noise(dur = 0.2, vol = 0.15, startFreq = 1200, endFreq = 300, type = 'bandpass') {
        if (this.muted) return;
        try {
          this.init();
          this.resume();
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const bufferSize = Math.max(256, Math.floor(this.ctx.sampleRate * dur));
          const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = buffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = type;
          filter.frequency.setValueAtTime(Math.max(20, startFreq), t);
          filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
          filter.Q.value = 2.5;

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(vol, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

          noiseSrc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          noiseSrc.start(t);
          noiseSrc.stop(t + dur);
        } catch (e) {}
      }

      playFireballLaunch() {
        // High-energy fiery ignition whoosh + blaster plasma chirp
        // 1. Fiery wind / plasma whoosh noise sweep
        this.noise(0.24, 0.22, 1900, 380, 'bandpass');
        // 2. Rising fiery ignition burst
        this.tone(380, 0.08, 'sawtooth', 0.14, 280);
        // 3. Resonant fireball laser punch
        setTimeout(() => this.tone(540, 0.16, 'triangle', 0.16, -340), 30);
      }

      playMonsterDefeat(isGolem = false) {
        // Visceral arcade monster defeat: explosive crunch, shattering debris & death screech
        if (isGolem) {
          // Crystal Golem: Heavy stone-crack crunch + crystal shatter noise + sub-bass crumble
          this.noise(0.28, 0.32, 2200, 180, 'lowpass');
          this.tone(140, 0.22, 'sawtooth', 0.35, -95);
          setTimeout(() => this.tone(68, 0.25, 'triangle', 0.4, -35), 40);
          setTimeout(() => this.tone(580, 0.12, 'sine', 0.18, -280), 80);
        } else {
          // Baby Dragon: Fiery pop + arcade defeat chirp + kinetic thud
          this.noise(0.22, 0.28, 1600, 320, 'bandpass');
          this.tone(340, 0.18, 'sawtooth', 0.3, -220);
          setTimeout(() => this.tone(95, 0.22, 'triangle', 0.35, -45), 35);
          setTimeout(() => this.tone(480, 0.14, 'sine', 0.18, -320), 70);
        }
      }

      playJump() { this.tone(160, 0.15, 'square', 0.1, 320); }
      playWrench() { this.tone(440, 0.1, 'sawtooth', 0.12, -260); }
      playHeart() { this.playFireballLaunch(); }
      playEnemyDefeat() { this.playMonsterDefeat(false); }
      playKeyPickup() { this.tone(600, 0.2, 'sine', 0.15, 300); }
      playUnlock() { this.tone(480, 0.4, 'sine', 0.15, 480); }
      playDamage() { this.tone(90, 0.35, 'sawtooth', 0.2, -50); }
      playCoin() {
        this.tone(987, 0.08, 'sine', 0.15, 0); // B5
        setTimeout(() => this.tone(1318, 0.18, 'sine', 0.18, 0), 70); // E6
      }
      playTick() { this.tone(800, 0.04, 'square', 0.05, 0); }
      playCorrect() {
        this.tone(523, 0.1, 'sine', 0.15, 0);
        setTimeout(() => this.tone(659, 0.1, 'sine', 0.15, 0), 100);
        setTimeout(() => this.tone(784, 0.2, 'sine', 0.18, 0), 200);
      }
      playWrong() {
        this.tone(220, 0.15, 'sawtooth', 0.18, -40);
        setTimeout(() => this.tone(180, 0.25, 'sawtooth', 0.2, -60), 150);
      }
      playBossHit() { this.tone(110, 0.2, 'triangle', 0.2, 100); }
      playHeavyImpact() {
        this.tone(70, 0.18, 'sawtooth', 0.3, -45);
        setTimeout(() => this.tone(45, 0.22, 'triangle', 0.35, -20), 30);
      }
      playVictory() {
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.25, 'sine', 0.18, 0), i * 150);
        });
      }
    }
    const audio = new RetroAudio();
    window.__AUDIO__ = audio;

    /**
     * =========================================================================
     * 2. CLIENT PERSISTENCE (INDEXEDDB & SYNC QUEUE)
     * =========================================================================
     */
    class StorageManager {
      constructor() {
        this.dbName = 'PrincessReverseRescueDB';
        this.version = 1;
        this.db = null;
        this.init();
      }

      async init() {
        return new Promise((resolve) => {
          const req = indexedDB.open(this.dbName, this.version);
          req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
            if (!db.objectStoreNames.contains('queued_runs')) db.createObjectStore('queued_runs', { autoIncrement: true });
            if (!db.objectStoreNames.contains('cached_trivia')) db.createObjectStore('cached_trivia', { keyPath: 'id' });
          };
          req.onsuccess = (e) => {
            this.db = e.target.result;
            this.seedFallbackTrivia();
            resolve(this.db);
          };
          req.onerror = () => resolve(null);
        });
      }

      async queueRun(runData) {
        if (!this.db) return;
        const tx = this.db.transaction('queued_runs', 'readwrite');
        tx.objectStore('queued_runs').add({ ...runData, queuedAt: Date.now() });
      }

      async flushQueue() {
        if (!this.db || !navigator.onLine) return;
        const tx = this.db.transaction('queued_runs', 'readwrite');
        const store = tx.objectStore('queued_runs');
        const req = store.openCursor();
        req.onsuccess = async (e) => {
          const cursor = e.target.result;
          if (cursor) {
            try {
              const res = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cursor.value)
              });
              if (res.ok) cursor.delete();
            } catch (err) {}
            cursor.continue();
          }
        };
      }

      seedFallbackTrivia() {
        if (!this.db) return;
        const tx = this.db.transaction('cached_trivia', 'readwrite');
        const store = tx.objectStore('cached_trivia');
        const fallback = [
          { id: 101, difficulty: 'easy', category: 'Symbols', question: 'What does a shopping cart icon typically represent online?', options: ['Checkout / Cart', 'Search Query', 'User Profile', 'Settings'], correct_answer: 'Checkout / Cart' },
          { id: 102, difficulty: 'easy', category: 'Symbols', question: 'What does the three looping arrows symbol represent?', options: ['Recycling & Sustainability', 'Hazardous Materials', 'Traffic Roundabout', 'Wind Energy'], correct_answer: 'Recycling & Sustainability' },
          { id: 201, difficulty: 'medium', category: 'Math', question: 'What is 8 × 7?', options: ['56', '54', '64', '48'], correct_answer: '56' },
          { id: 202, difficulty: 'medium', category: 'Brands', question: 'Which car manufacturer has an emblem of four interlocking rings?', options: ['Audi', 'BMW', 'Subaru', 'Volvo'], correct_answer: 'Audi' },
          { id: 301, difficulty: 'hard', category: 'Math', question: 'What is 150 − 75?', options: ['75', '85', '65', '70'], correct_answer: '75' },
          { id: 302, difficulty: 'hard', category: 'Tech', question: 'In IEEE WIE, what does the acronym "WIE" stand for?', options: ['Women in Engineering', 'Wireless Internet Ethernet', 'World Innovation Engine', 'Web Interface Extension'], correct_answer: 'Women in Engineering' },
          { id: 401, difficulty: 'extreme', category: 'Computing', question: 'What is the decimal value of hexadecimal 0xFF?', options: ['255', '256', '128', '1024'], correct_answer: '255' }
        ];
        fallback.forEach(q => store.put(q));
      }
    }
    const storage = new StorageManager();

    // Online / Offline Listeners
    window.addEventListener('online', () => {
      const b = document.getElementById('hud-net-badge');
      if (b) { b.className = 'badge-status badge-online'; b.textContent = 'ONLINE'; }
      storage.flushQueue();
    });
    window.addEventListener('offline', () => {
      const b = document.getElementById('hud-net-badge');
      if (b) { b.className = 'badge-status badge-offline'; b.textContent = 'OFFLINE'; }
    });

    /**
     * =========================================================================
     * 3. THREE.JS 3D SCENE & ENGINE
     * =========================================================================
     */
    const canvas = document.getElementById('gameCanvas');
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05030f);
    scene.fog = new THREE.FogExp2(0x0b0620, 0.015);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x7a6adf, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x88ccff, 1.1);
    dirLight.position.set(20, 40, 30);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xff55a3, 1.6, 40);
    pointLight.position.set(0, 10, 10);
    scene.add(pointLight);

    // Dynamic Atmosphere & Glowing Horizon
    function createRadialTexture(stops) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      stops.forEach(([off, col]) => g.addColorStop(off, col));
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const glowTex = createRadialTexture([
      [0, 'rgba(255, 255, 255, 1)'],
      [0.25, 'rgba(255, 85, 163, 0.5)'],
      [1, 'rgba(168, 85, 247, 0)']
    ]);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const horizonGlow = new THREE.Sprite(glowMat);
    horizonGlow.position.set(0, 12, -80);
    horizonGlow.scale.set(120, 60, 1);
    scene.add(horizonGlow);

    // High-efficiency memory disposal to prevent GPU memory leaks and garbage collection stutter
    function disposeMesh(obj) {
      if (!obj) return;
      const target = obj.mesh || obj;
      if (!target || typeof target.traverse !== 'function') return;
      target.traverse(child => {
        if (child.geometry && !child.userData.isShared) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => {
            if (m && !m.userData.isShared) m.dispose();
          });
        }
      });
    }

    // High-performance shared projectile assets (Zero runtime allocation / zero GC stutter)
    const SHARED_HEART_CORE_GEO = new THREE.SphereGeometry(0.55, 8, 8);
    const SHARED_HEART_CORONA_GEO = new THREE.SphereGeometry(0.85, 8, 8);
    const SHARED_HEART_TRAIL_GEO = new THREE.CylinderGeometry(0.18, 0.42, 1.6, 8);
    SHARED_HEART_CORE_GEO.userData.isShared = true;
    SHARED_HEART_CORONA_GEO.userData.isShared = true;
    SHARED_HEART_TRAIL_GEO.userData.isShared = true;

    const SHARED_HEART_CORE_MAT = new THREE.MeshBasicMaterial({ color: 0xff2a85 });
    const SHARED_HEART_CORONA_MAT = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.75 });
    const SHARED_HEART_TRAIL_MAT = new THREE.MeshBasicMaterial({ color: 0xe879f9, transparent: true, opacity: 0.85 });
    SHARED_HEART_CORE_MAT.userData.isShared = true;
    SHARED_HEART_CORONA_MAT.userData.isShared = true;
    SHARED_HEART_TRAIL_MAT.userData.isShared = true;

    const SHARED_BOWSER_CORE_GEO = new THREE.SphereGeometry(0.8, 8, 8);
    const SHARED_BOWSER_CORONA_GEO = new THREE.SphereGeometry(1.2, 8, 8);
    SHARED_BOWSER_CORE_GEO.userData.isShared = true;
    SHARED_BOWSER_CORONA_GEO.userData.isShared = true;

    const SHARED_BOWSER_CORE_MAT = new THREE.MeshBasicMaterial({ color: 0xff3b00 });
    const SHARED_BOWSER_CORONA_MAT = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.6 });
    SHARED_BOWSER_CORE_MAT.userData.isShared = true;
    SHARED_BOWSER_CORONA_MAT.userData.isShared = true;

    // Cyber Track Grid Ground
    function createGridTexture() {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#070417';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.strokeStyle = '#ff55a3';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(128, 0); ctx.lineTo(128, 256);
      ctx.moveTo(0, 128); ctx.lineTo(256, 128);
      ctx.stroke();
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(60, 10);
      return tex;
    }
    const groundGeo = new THREE.PlaneGeometry(1200, 80);
    const groundMat = new THREE.MeshLambertMaterial({ map: createGridTexture() });
    const groundPlane = new THREE.Mesh(groundGeo, groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.set(300, -1, 0);
    scene.add(groundPlane);

    // =========================================================================
    // Floating Castle Vista High-Definition Parallax Backdrop
    // =========================================================================
    const bgTexLoader = new THREE.TextureLoader();
    const floatingCastleBgTex = bgTexLoader.load('assets/floating_castle_bg.jpg');
    floatingCastleBgTex.colorSpace = THREE.SRGBColorSpace;
    floatingCastleBgTex.minFilter = THREE.LinearFilter;
    floatingCastleBgTex.magFilter = THREE.LinearFilter;
    floatingCastleBgTex.wrapS = THREE.MirroredRepeatWrapping;
    floatingCastleBgTex.wrapT = THREE.ClampToEdgeWrapping;
    floatingCastleBgTex.repeat.set(1.25, 1.0);
    floatingCastleBgTex.generateMipmaps = false;

    const bgBackdropGeo = new THREE.PlaneGeometry(800, 240);
    const bgBackdropMat = new THREE.MeshBasicMaterial({
      map: floatingCastleBgTex,
      depthWrite: false,
      depthTest: true,
      fog: false
    });
    const bgBackdropPlane = new THREE.Mesh(bgBackdropGeo, bgBackdropMat);
    bgBackdropPlane.position.set(120, 24, -60);
    scene.add(bgBackdropPlane);

    // Floating Starfield Particles
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < starCount; i++) {
      starPos.push((Math.random() - 0.5) * 800, Math.random() * 80 + 5, (Math.random() - 0.5) * 200 - 40);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x99aaff, size: 0.6, transparent: true, opacity: 0.8 });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // High-Impact 3D Kinetic Combat Splatter Particle System
    const SP_COUNT = 400;
    const spPos = new Float32Array(SP_COUNT * 3).fill(-999);
    const spCol = new Float32Array(SP_COUNT * 3);
    const spVel = new Float32Array(SP_COUNT * 3);
    let spIdx = 0;
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    spGeo.setAttribute('color', new THREE.BufferAttribute(spCol, 3));
    const spMat = new THREE.PointsMaterial({
      size: 0.75,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const splatterPoints = new THREE.Points(spGeo, spMat);
    scene.add(splatterPoints);

    const _splatterColor = new THREE.Color();
    function emitSplatter(x2D, y2D, hexCol = 0xff1133, count = 22) {
      _splatterColor.setHex(hexCol);
      const originX = to3DX(x2D);
      const originY = to3DY(y2D);
      for (let i = 0; i < count; i++) {
        spIdx = (spIdx + 1) % SP_COUNT;
        spPos[spIdx * 3] = originX;
        spPos[spIdx * 3 + 1] = originY;
        spPos[spIdx * 3 + 2] = (Math.random() - 0.5) * 2.0;

        spCol[spIdx * 3] = _splatterColor.r;
        spCol[spIdx * 3 + 1] = _splatterColor.g;
        spCol[spIdx * 3 + 2] = _splatterColor.b;

        spVel[spIdx * 3] = (Math.random() - 0.5) * 14;
        spVel[spIdx * 3 + 1] = Math.random() * 9 + 3;
        spVel[spIdx * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      spGeo.attributes.position.needsUpdate = true;
      spGeo.attributes.color.needsUpdate = true;
    }

    function showCombatHit(text, col = '#ff0044') {
      // Disabled combat hit popups on screen per user request for clean, distraction-free gameplay
    }



    /**
     * =========================================================================
     * 4. 3D PROCEDURAL CHARACTER & ENTITY FACTORIES
     * =========================================================================
     */
    // Shadow Plane for Characters
    const shadowTex = createRadialTexture([
      [0, 'rgba(0, 0, 0, 0.7)'],
      [0.6, 'rgba(0, 0, 0, 0.3)'],
      [1, 'rgba(0, 0, 0, 0)']
    ]);
    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
    shadowMat.userData.isShared = true;

    // Princess Heroic Character Textures (Action Princess with Goggles, Crown, & Blaster)
    const princessTexLoader = new THREE.TextureLoader();
    const princessTextures = {
      idle: princessTexLoader.load('assets/princess/idle.png'),
      run1: princessTexLoader.load('assets/princess/run1.png'),
      run2: princessTexLoader.load('assets/princess/run2.png'),
      run3: princessTexLoader.load('assets/princess/run3.png'),
      run4: princessTexLoader.load('assets/princess/run4.png'),
      jump: princessTexLoader.load('assets/princess/jump.png'),
      crouch: princessTexLoader.load('assets/princess/crouch.png'),
      aim: princessTexLoader.load('assets/princess/aim.png'),
      shoot: princessTexLoader.load('assets/princess/shoot.png')
    };

    Object.values(princessTextures).forEach(t => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
    });

    const princessPlaneGeo = new THREE.PlaneGeometry(4.8, 4.8);

    // Heroic Action Princess 3D Mesh
    function createPeachMesh() {
      const group = new THREE.Group();

      // Dynamic Contact Shadow
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.6), shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.05;
      group.add(shadow);

      // Main High-Definition Action Princess Sprite Plane
      const spriteMat = new THREE.MeshBasicMaterial({
        map: princessTextures.idle,
        transparent: true,
        alphaTest: 0.02,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const spriteMesh = new THREE.Mesh(princessPlaneGeo, spriteMat);
      spriteMesh.position.set(0, 2.36, 0);
      group.add(spriteMesh);

      // Dummy objects for backward compatibility with existing animation helpers
      const dummyObj = new THREE.Group();
      group.add(dummyObj);

      group.userData = {
        spriteMesh,
        spriteMat,
        shadow,
        armR: dummyObj,
        legL: dummyObj,
        legR: dummyObj,
        armL: dummyObj
      };
      return group;
    }

    // Mario Character Texture (Authentic user-provided design: Red M-Cap, Striped Shirt, Blue Overalls & Work Boots)
    const marioTexLoader = new THREE.TextureLoader();
    const marioTexture = marioTexLoader.load('assets/mario.png');
    marioTexture.colorSpace = THREE.SRGBColorSpace;
    const marioSpriteGeo = new THREE.PlaneGeometry(1.9, 3.8);
    marioSpriteGeo.userData.isShared = true;
    const marioSpriteMat = new THREE.MeshBasicMaterial({
      map: marioTexture,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    marioSpriteMat.userData.isShared = true;

    // Prince Mario in 3D Iron Cage
    function createMarioCageMesh() {
      const group = new THREE.Group();

      // Ground Contact Shadow
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.05;
      group.add(shadow);

      // Mario High-Definition 3D Character Sprite
      const mario = new THREE.Mesh(marioSpriteGeo, marioSpriteMat);
      mario.position.set(0, 1.9, 0);
      group.add(mario);

      // 3D Iron Cage
      const ironMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
      const cageTop = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12), ironMat);
      cageTop.position.y = 4.2;
      group.add(cageTop);

      const cageBottom = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.4, 12), ironMat);
      cageBottom.position.y = 0.2;
      group.add(cageBottom);

      // Vertical Iron Bars
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.0), ironMat);
        bar.position.set(Math.cos(angle) * 1.9, 2.2, Math.sin(angle) * 1.9);
        group.add(bar);
      }

      // Golden Padlock
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.4 });
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.3), goldMat);
      lock.position.set(0, 2.0, 2.0);
      group.add(lock);

      const dummyObj = new THREE.Object3D();
      group.userData = { mario, armL: dummyObj, armR: dummyObj, lock, cageTop };
      return group;
    }

    // King Bowser 3D Procedural Model
    function createBowserMesh() {
      const group = new THREE.Group();

      // Bowser Ground Contact Shadow
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 4.0), shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.04;
      group.add(shadow);

      const skinMat = new THREE.MeshLambertMaterial({ color: 0x16a34a }); // Scaly Green
      const shellMat = new THREE.MeshLambertMaterial({ color: 0x15803d, emissive: 0xff3e14, emissiveIntensity: 0.25 }); // Magma Fissures
      const bellyMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
      const spikeMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
      const hornMat = new THREE.MeshLambertMaterial({ color: 0xfacc15 });

      // Torso & Spiked Shell
      const body = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 12), bellyMat);
      body.position.set(0, 3.2, 0);
      group.add(body);

      const shell = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 12), shellMat);
      shell.position.set(0, 3.4, -0.6);
      shell.scale.set(1.1, 1.2, 0.8);
      group.add(shell);

      // Shell Spikes
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 6), spikeMat);
          spike.position.set(i * 1.2, 3.4 + j * 1.2, -2.4);
          spike.rotation.x = -Math.PI / 2;
          group.add(spike);
        }
      }

      // Head & Horns
      const head = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.0), skinMat);
      head.position.set(0, 4.8, 1.6);
      
      const snout = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.4), bellyMat);
      snout.position.set(0, -0.3, 1.2);
      head.add(snout);

      // Horns
      [-0.9, 0.9].forEach(x => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.4, 6), hornMat);
        horn.position.set(x, 1.2, -0.3);
        horn.rotation.z = x > 0 ? -0.4 : 0.4;
        head.add(horn);
      });
      group.add(head);

      // Claws & Feet
      [-1.4, 1.4].forEach(x => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.5), skinMat);
        leg.position.set(x, 0.8, 0);
        group.add(leg);
      });

      // Eyes
      [-0.5, 0.5].forEach(x => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), new THREE.MeshLambertMaterial({ color: 0xff3e14, emissive: 0xff3e14, emissiveIntensity: 0.9 }));
        eye.position.set(x, 0.4, 1.1);
        head.add(eye);
      });

      group.userData = { head, body, shell, shadow };
      return group;
    }

    // High-Definition Custom Monster Textures (Official Crystal Golem & Baby Dragon Walk & Attack Sets)
    const monsterTexLoader = new THREE.TextureLoader();
    const monsterTextures = {
      golem: [
        monsterTexLoader.load('assets/monsters/golem_walk1.png'),
        monsterTexLoader.load('assets/monsters/golem_walk2.png'),
        monsterTexLoader.load('assets/monsters/golem_walk3.png'),
        monsterTexLoader.load('assets/monsters/golem_walk4.png'),
        monsterTexLoader.load('assets/monsters/golem_walk5.png')
      ],
      golemAttack: [
        monsterTexLoader.load('assets/monsters/golem_attack1.png'),
        monsterTexLoader.load('assets/monsters/golem_attack2.png'),
        monsterTexLoader.load('assets/monsters/golem_attack3.png'),
        monsterTexLoader.load('assets/monsters/golem_attack4.png'),
        monsterTexLoader.load('assets/monsters/golem_attack5.png')
      ],
      dragon: [
        monsterTexLoader.load('assets/monsters/dragon_walk1.png'),
        monsterTexLoader.load('assets/monsters/dragon_walk2.png'),
        monsterTexLoader.load('assets/monsters/dragon_walk3.png'),
        monsterTexLoader.load('assets/monsters/dragon_walk4.png')
      ],
      dragonAttack: [
        monsterTexLoader.load('assets/monsters/dragon_attack1.png'),
        monsterTexLoader.load('assets/monsters/dragon_attack2.png'),
        monsterTexLoader.load('assets/monsters/dragon_attack3.png'),
        monsterTexLoader.load('assets/monsters/dragon_attack4.png'),
        monsterTexLoader.load('assets/monsters/dragon_attack5.png')
      ]
    };
    [...monsterTextures.golem, ...monsterTextures.golemAttack, ...monsterTextures.dragon, ...monsterTextures.dragonAttack].forEach(t => {
      t.colorSpace = THREE.SRGBColorSpace;
    });

    const golemSpriteGeo = new THREE.PlaneGeometry(3.6, 3.8);
    const dragonSpriteGeo = new THREE.PlaneGeometry(3.4, 3.8);
    golemSpriteGeo.userData.isShared = true;
    dragonSpriteGeo.userData.isShared = true;

    const SHARED_GOLEM_SHADOW_GEO = new THREE.PlaneGeometry(2.6, 1.6);
    SHARED_GOLEM_SHADOW_GEO.userData.isShared = true;
    const SHARED_DRAGON_SHADOW_GEO = new THREE.PlaneGeometry(2.4, 1.5);
    SHARED_DRAGON_SHADOW_GEO.userData.isShared = true;
    const SHARED_GOLEM_EYE_GEO = new THREE.PlaneGeometry(0.9, 0.45);
    SHARED_GOLEM_EYE_GEO.userData.isShared = true;

    // 3D Crystal Golem Monster (Moss & Crystal Golem with glowing purple eyes and human-like walk cycle)
    function createGolemMesh() {
      const group = new THREE.Group();

      // Ground Contact Shadow
      const shadow = new THREE.Mesh(SHARED_GOLEM_SHADOW_GEO, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.04;
      group.add(shadow);

      // Main Crystal Golem Sprite Plane (individual material instance for independent leg animation)
      const spriteMat = new THREE.MeshBasicMaterial({
        map: monsterTextures.golem[0],
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const sprite = new THREE.Mesh(golemSpriteGeo, spriteMat);
      sprite.position.y = 1.9;
      group.add(sprite);

      // Glowing Purple Eye Corona (Additive flare with zero dynamic light shader recompilation)
      const eyeCoronaMat = new THREE.MeshBasicMaterial({
        color: 0xd946ef,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const eyeCorona = new THREE.Mesh(SHARED_GOLEM_EYE_GEO, eyeCoronaMat);
      eyeCorona.position.set(0, 2.3, 0.2);
      group.add(eyeCorona);

      group.userData = { sprite, spriteMat, shadow, type: 'golem', eyeCorona, eyeLight: eyeCorona };
      return group;
    }

    // 3D Baby Dragon Monster (Cute green winged dragon with horns & golden belly and human-like walk cycle)
    function createDragonMesh() {
      const group = new THREE.Group();

      // Ground Contact Shadow
      const shadow = new THREE.Mesh(SHARED_DRAGON_SHADOW_GEO, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.04;
      group.add(shadow);

      // Main Baby Dragon Sprite Plane (individual material instance for independent leg animation)
      const spriteMat = new THREE.MeshBasicMaterial({
        map: monsterTextures.dragon[0],
        transparent: true,
        alphaTest: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const sprite = new THREE.Mesh(dragonSpriteGeo, spriteMat);
      sprite.position.y = 1.9;
      group.add(sprite);

      group.userData = { sprite, spriteMat, shadow, type: 'dragon' };
      return group;
    }

    // Aliases for backwards compatibility with any existing reference
    const createGoombaMesh = createGolemMesh;
    const createKoopaMesh = createDragonMesh;

    // Shared Coin Geometries & Materials for Zero-Allocation, Maximum 60FPS Performance
    const coinTexLoader = new THREE.TextureLoader();
    const royalCoinTexture = coinTexLoader.load('assets/royal_gold_coin.png');
    royalCoinTexture.colorSpace = THREE.SRGBColorSpace;

    // Disc core and faces (matching the user's royal crown coin design)
    const coinCoreGeo = new THREE.CylinderGeometry(1.38, 1.38, 0.22, 32);
    const coinFaceGeo = new THREE.CircleGeometry(1.36, 32);
    const coinRimGeo = new THREE.TorusGeometry(1.36, 0.08, 12, 32);
    const coinShadowGeo = new THREE.PlaneGeometry(3.0, 3.0);
    coinCoreGeo.userData.isShared = true;
    coinFaceGeo.userData.isShared = true;
    coinRimGeo.userData.isShared = true;
    coinShadowGeo.userData.isShared = true;

    const coinCoreMat = new THREE.MeshStandardMaterial({
      color: 0xdf9a14,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0xd97706,
      emissiveIntensity: 0.25
    });
    const coinFaceMat = new THREE.MeshBasicMaterial({
      map: royalCoinTexture,
      transparent: true,
      side: THREE.FrontSide
    });
    const coinRimMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      metalness: 0.92,
      roughness: 0.16,
      emissive: 0xfacc15,
      emissiveIntensity: 0.45
    });
    coinCoreMat.userData.isShared = true;
    coinFaceMat.userData.isShared = true;
    coinRimMat.userData.isShared = true;

    // 3D Collectible Gold Coin Model (Embossed Royal Crown & Filigree Design)
    function createCoinMesh() {
      const group = new THREE.Group();

      // Golden Contact Shadow
      const shadow = new THREE.Mesh(coinShadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -1.25;
      group.add(shadow);

      // Gold Coin Cylinder Core / Beveled Edge
      const coinCore = new THREE.Mesh(coinCoreGeo, coinCoreMat);
      coinCore.rotation.x = Math.PI / 2;
      group.add(coinCore);

      // Front Face with Royal Crown & Filigree Design
      const frontFace = new THREE.Mesh(coinFaceGeo, coinFaceMat);
      frontFace.position.z = 0.115;
      group.add(frontFace);

      // Back Face with Royal Crown & Filigree Design
      const backFace = new THREE.Mesh(coinFaceGeo, coinFaceMat);
      backFace.position.z = -0.115;
      backFace.rotation.y = Math.PI;
      group.add(backFace);

      // Shiny Gold Beveled Edge / Outer Ring
      const rim = new THREE.Mesh(coinRimGeo, coinRimMat);
      group.add(rim);

      group.userData = { coinCore, frontFace, backFace, rim, shadow };
      return group;
    }

    /**
     * =========================================================================
     * 5. GAME ENGINE CORE & 3D WORLD COORDINATE CONVERTER
     * =========================================================================
     */
    // World Scale: 1 2D pixel = 0.08 3D units
    const S2D = 0.08;
    function to3DX(x) { return x * S2D; }
    function to3DY(y) { return (540 - y) * S2D; }

    // 1. Procedural Ancient Cobblestone Masonry & Emerald Moss Texture (Mainland ground)
    function createCobblestoneTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      // Dark weathered stone mortar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 256);

      // Cobblestone stone slabs matching ancient masonry in reference image
      const stones = [
        { x: 4, y: 4, w: 76, h: 56, col: '#475569' },
        { x: 86, y: 4, w: 82, h: 56, col: '#334155' },
        { x: 174, y: 4, w: 78, h: 56, col: '#475569' },

        { x: 4, y: 66, w: 120, h: 58, col: '#3b4b5e' },
        { x: 130, y: 66, w: 122, h: 58, col: '#475569' },

        { x: 4, y: 130, w: 74, h: 58, col: '#334155' },
        { x: 84, y: 130, w: 88, h: 58, col: '#475569' },
        { x: 178, y: 130, w: 74, h: 58, col: '#3b4b5e' },

        { x: 4, y: 194, w: 122, h: 58, col: '#475569' },
        { x: 132, y: 194, w: 120, h: 58, col: '#334155' }
      ];

      stones.forEach(s => {
        ctx.fillStyle = s.col;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(s.x, s.y, s.w, s.h, 6);
        else ctx.rect(s.x, s.y, s.w, s.h);
        ctx.fill();

        // Chiseled stone highlight (top-left)
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s.x + 3, s.y + s.h - 3);
        ctx.lineTo(s.x + 3, s.y + 3);
        ctx.lineTo(s.x + s.w - 3, s.y + 3);
        ctx.stroke();

        // Shadow bevel (bottom-right)
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s.x + s.w - 3, s.y + 3);
        ctx.lineTo(s.x + s.w - 3, s.y + s.h - 3);
        ctx.lineTo(s.x + 3, s.y + s.h - 3);
        ctx.stroke();

        // Emerald moss cluster on stone edges
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(s.x + 8, s.y + 8, 7, 0, Math.PI * 2);
        ctx.arc(s.x + 14, s.y + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(s.x + 8, s.y + 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }
    const cobblestoneTexture = createCobblestoneTexture();

    // 2. Procedural Celestial Rune Pedestal Texture for Floating Platforms (matching reference image)
    function createCelestialPedestalTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');

      // Deep weathered slate foundation
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 128);

      // Carved bronze/gold filigree border matching ornate floating chest in image
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 248, 120);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, 240, 112);

      // Inner slab bed
      ctx.fillStyle = '#334155';
      ctx.fillRect(12, 12, 232, 104);

      // Glowing Celestial Rune Filigree
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 10;

      // Central diamond rune emblem
      ctx.beginPath();
      ctx.moveTo(128, 20);
      ctx.lineTo(176, 64);
      ctx.lineTo(128, 108);
      ctx.lineTo(80, 64);
      ctx.closePath();
      ctx.stroke();

      // Glowing sapphire center core
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(128, 64, 10, 0, Math.PI * 2);
      ctx.fill();

      // Flanking runic wings
      ctx.beginPath();
      ctx.moveTo(20, 64); ctx.lineTo(72, 64);
      ctx.moveTo(184, 64); ctx.lineTo(236, 64);
      ctx.moveTo(46, 42); ctx.lineTo(72, 64); ctx.lineTo(46, 86);
      ctx.moveTo(210, 42); ctx.lineTo(184, 64); ctx.lineTo(210, 86);
      ctx.stroke();

      // Corner golden bronze rivets
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.arc(240, 16, 5, 0, Math.PI * 2);
      ctx.arc(16, 112, 5, 0, Math.PI * 2);
      ctx.arc(240, 112, 5, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }
    const celestialPedestalTexture = createCelestialPedestalTexture();

    // 2b. Front Panel Texture for Floating Celestial Pedestals (chest-like ornate bronze and cyan runes)
    function createFloatingPedestalFrontTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext('2d');

      // Bronze/Gold outer casing
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 256, 64);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(2, 2, 252, 60);

      // Inner ornate slate panel
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(6, 6, 244, 52);

      // Carved bronze inner frame
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(8, 8, 240, 48);

      // Glowing Cyan Runic Filigree along front
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 8;

      // Central Diamond Gem
      ctx.beginPath();
      ctx.moveTo(128, 14);
      ctx.lineTo(150, 32);
      ctx.lineTo(128, 50);
      ctx.lineTo(106, 32);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(128, 32, 6, 0, Math.PI * 2);
      ctx.fill();

      // Wing Filigree
      ctx.beginPath();
      ctx.moveTo(18, 32); ctx.lineTo(96, 32);
      ctx.moveTo(160, 32); ctx.lineTo(238, 32);
      ctx.moveTo(40, 20); ctx.lineTo(62, 32); ctx.lineTo(40, 44);
      ctx.moveTo(216, 20); ctx.lineTo(194, 32); ctx.lineTo(216, 44);
      ctx.stroke();

      // Corner gold rivets
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(12, 12, 4.5, 0, Math.PI * 2);
      ctx.arc(244, 12, 4.5, 0, Math.PI * 2);
      ctx.arc(12, 52, 4.5, 0, Math.PI * 2);
      ctx.arc(244, 52, 4.5, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }
    const floatingPedestalFrontTexture = createFloatingPedestalFrontTexture();

    // 2c. Procedural Mountain Stone Cliff Texture for Mainland Front Faces (weathered cliff rock with moss)
    function createStoneCliffTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');

      // Mortar background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 256, 256);

      const layers = [
        { y: 4, h: 56, stones: [{ x: 4, w: 120, col: '#334155' }, { x: 130, w: 122, col: '#475569' }] },
        { y: 66, h: 58, stones: [{ x: 4, w: 78, col: '#2d3748' }, { x: 88, w: 90, col: '#3b4b5e' }, { x: 184, w: 68, col: '#334155' }] },
        { y: 130, h: 58, stones: [{ x: 4, w: 140, col: '#3b4b5e' }, { x: 150, w: 102, col: '#2d3748' }] },
        { y: 194, h: 58, stones: [{ x: 4, w: 96, col: '#334155' }, { x: 106, w: 146, col: '#475569' }] }
      ];

      layers.forEach(layer => {
        layer.stones.forEach(s => {
          ctx.fillStyle = s.col;
          if (ctx.roundRect) ctx.roundRect(s.x, layer.y, s.w, layer.h, 4);
          else ctx.fillRect(s.x, layer.y, s.w, layer.h);
          ctx.fill();

          // Highlight
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(s.x + 2, layer.y + layer.h - 2);
          ctx.lineTo(s.x + 2, layer.y + 2);
          ctx.lineTo(s.x + s.w - 2, layer.y + 2);
          ctx.stroke();

          // Shadow
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.moveTo(s.x + s.w - 2, layer.y + 2);
          ctx.lineTo(s.x + s.w - 2, layer.y + layer.h - 2);
          ctx.lineTo(s.x + 2, layer.y + layer.h - 2);
          ctx.stroke();

          // Vertical fissure / crack detail
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(s.x + s.w * 0.45, layer.y + 4);
          ctx.lineTo(s.x + s.w * 0.5, layer.y + layer.h * 0.5);
          ctx.lineTo(s.x + s.w * 0.42, layer.y + layer.h - 4);
          ctx.stroke();

          // Creeping emerald moss
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(s.x + 10, layer.y + 8, 6, 0, Math.PI * 2);
          ctx.arc(s.x + 18, layer.y + 7, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }
    const stoneCliffTexture = createStoneCliffTexture();

    // 3. Procedural Ancient Runic Stone Monolith Texture for Obstacle Walls (matching reference image)
    function createRunicStoneTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 512;
      const ctx = c.getContext('2d');

      // Mortar background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 512);

      // Stacked ancient carved rune blocks matching reference image
      const blockH = 124;
      const blockColors = ['#475569', '#334155', '#475569', '#3b4b5e'];
      const runes = ['ᚱ', 'ᛖ', 'ᚹ', 'ᛟ'];

      for (let i = 0; i < 4; i++) {
        const by = i * 128 + 2;
        ctx.fillStyle = blockColors[i];
        ctx.fillRect(4, by, 248, blockH);

        // Chiseled stone highlight bevel
        ctx.strokeStyle = 'rgba(241, 245, 249, 0.5)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(6, by + blockH - 2);
        ctx.lineTo(6, by + 4);
        ctx.lineTo(250, by + 4);
        ctx.stroke();

        // Shadow bevel
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(250, by + 4);
        ctx.lineTo(250, by + blockH - 2);
        ctx.lineTo(6, by + blockH - 2);
        ctx.stroke();

        // Chiseled crack lines
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(14 + (i * 37) % 50, by + 8);
        ctx.lineTo(35 + (i * 29) % 40, by + 32);
        ctx.lineTo(28, by + 55);
        ctx.stroke();

        // Carved Glowing Ancient Rune Symbol in center of each block
        ctx.save();
        ctx.font = '900 62px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Deep chisel shadow behind rune
        ctx.fillStyle = '#0b1120';
        ctx.fillText(runes[i], 130, by + blockH / 2 + 3);

        // Radiant Emerald/Cyan Rune Glow (matching cosmic rune energy in image)
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 16;
        ctx.fillText(runes[i], 128, by + blockH / 2);

        ctx.fillStyle = '#e0f2fe';
        ctx.shadowBlur = 6;
        ctx.fillText(runes[i], 128, by + blockH / 2);
        ctx.restore();

        // Emerald moss clusters along stone edges
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(16, by + 8, 9, 0, Math.PI * 2);
        ctx.arc(26, by + 5, 7, 0, Math.PI * 2);
        ctx.arc(238, by + blockH - 8, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(16, by + 8, 6, 0, Math.PI * 2);
        ctx.arc(238, by + blockH - 8, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }
    const runicStoneTexture = createRunicStoneTexture();

    // Zero-lag texture pre-warming: pre-upload all textures to GPU VRAM so there's zero mid-game stall
    function prewarmAllTextures() {
      const allTex = [
        princessTextures.idle, princessTextures.run1, princessTextures.run2,
        princessTextures.run3, princessTextures.run4, princessTextures.jump,
        princessTextures.crouch, princessTextures.aim, princessTextures.shoot,
        ...monsterTextures.golem, ...monsterTextures.golemAttack,
        ...monsterTextures.dragon, ...monsterTextures.dragonAttack,
        royalCoinTexture, runicStoneTexture, marioTexture
      ];
      if (typeof stoneCliffTexture !== 'undefined' && stoneCliffTexture) allTex.push(stoneCliffTexture);
      if (typeof cobblestoneTexture !== 'undefined' && cobblestoneTexture) allTex.push(cobblestoneTexture);
      allTex.forEach(tex => {
        if (tex && renderer && typeof renderer.initTexture === 'function') {
          renderer.initTexture(tex);
        }
      });
    }
    prewarmAllTextures();

    // 3D Obstacle Wall Mesh (Level 1 Ancient Runic Stone Monolith applied to ALL levels)
    function createObstacleWallMesh(wall, stage = 1) {
      const group = new THREE.Group();
      const w3D = wall.w * S2D;
      const h3D = wall.h * S2D;
      const d3D = 3.6;

      // Level 1 Wall Theme applied to ALL levels: Ancient Runic Stone Monolith
      const coreMat = new THREE.MeshLambertMaterial({
        map: runicStoneTexture,
        color: 0xffffff,
        emissive: 0x1e293b,
        emissiveIntensity: 0.25
      });
      const edgeColor = 0x67e8f9;
      const bandMat = new THREE.MeshLambertMaterial({ color: 0x92400e, emissive: 0xd97706, emissiveIntensity: 0.35 });
      const capMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.35 });
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const beaconGeo = new THREE.OctahedronGeometry(0.28);
      const beaconLightCol = 0x38bdf8;

      // 1. Core Mesh
      const core = new THREE.Mesh(new THREE.BoxGeometry(w3D, h3D, d3D), coreMat);
      group.add(core);

      // 2. Outlines
      const edgeMat = new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: 0.75 });
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(w3D, h3D, d3D)),
        edgeMat
      );
      group.add(edges);

      // 3. Reinforcement Banding & Rivets
      const midBand = new THREE.Mesh(new THREE.BoxGeometry(w3D + 0.16, 0.38, d3D + 0.16), bandMat);
      midBand.position.set(0, 0, 0);
      group.add(midBand);

      const rivetMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0xb45309, emissiveIntensity: 0.5 });
      const rivetCount = Math.max(2, Math.floor(w3D / 0.55));
      for (let r = 0; r < rivetCount; r++) {
        const rx = -w3D / 2 + 0.28 + r * ((w3D - 0.56) / Math.max(1, rivetCount - 1));
        const rivetF = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), rivetMat);
        rivetF.position.set(rx, 0, d3D / 2 + 0.1);
        group.add(rivetF);
      }

      // 4. Solid Walking Top Cap
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(w3D + 0.22, 0.32, d3D + 0.22), capMat);
      topCap.position.set(0, h3D / 2, 0);
      group.add(topCap);

      // Emerald Grass Overhang Fringe (matching Level 1 wall on all levels)
      const grassTrimMat = new THREE.MeshLambertMaterial({ color: 0x16a34a });
      const grassTrim = new THREE.Mesh(new THREE.BoxGeometry(w3D + 0.26, 0.16, d3D + 0.26), grassTrimMat);
      grassTrim.position.set(0, h3D / 2 - 0.19, 0);
      group.add(grassTrim);

      // 5. Crown Beacon
      const diademCrownMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.45 });
      const diademBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 6), diademCrownMat);
      diademBase.position.set(0, h3D / 2 + 0.24, 0);
      group.add(diademBase);

      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(0, h3D / 2 + 0.46, 0);
      group.add(beaconMesh);

      group.userData = { core, edges, beacon: beaconMesh, stripes: bandMat };
      return group;
    }

    class GameEngine {
      constructor() {
        this.peach = {
          x: 100,
          y: 380,
          w: 28,
          h: 46,
          vx: 0,
          vy: 0,
          grounded: true,
          facing: 1,
          state: 'idle',
          invulnerableTimer: 0,
          walkAnim: 0,
          jumpsLeft: 1,
          maxJumps: 1,
          attackTimer: 0,
          wrenchTimer: 0
        };

        this.lives = 3;
        this.peachHp = 3;
        this.score = 0;
        this.coins = 0;
        this.currentLevelIndex = 1;
        this.level = null;
        this.activeInputMode = 'KEYBOARD';
        this.state = 'title'; // 'title', 'play', 'pause', 'trivia', 'gameover', 'victory'
        this.forestKeysCollected = 0;
        this.elapsedTime = 0;

        // Cached HUD & DOM Elements (Avoids per-frame DOM queries and layout thrashing)
        this.hudScoreEl = document.getElementById('hud-score-val');
        this.hudCoinsEl = document.getElementById('hud-coins-val');
        this.hudLivesEl = document.getElementById('hud-lives-val');
        this.hudLevelEl = document.getElementById('hud-level-val');
        this.cagePromptEl = document.getElementById('cage-prompt');
        this.bossFillEl = document.getElementById('boss-hp-fill');
        this.bossTextEl = document.getElementById('boss-hp-text');
        this.levelBannerEl = document.getElementById('ban');

        this.keys = {
          left: false,
          right: false,
          jump: false,
          wrench: false,
          heart: false,
          interact: false
        };

        // 3D Meshes & Groups
        this.peachMesh = createPeachMesh();
        scene.add(this.peachMesh);

        this.platformMeshes = [];
        this.enemyMeshes = [];
        this.itemMeshes = [];
        this.coinMeshes = [];
        this.cageMesh = null;
        this.bossMesh = null;
        this.heartBlastMeshes = [];
        this.fireballMeshes = [];
        this.wallMeshes = [];

        this.heartBlasts = [];
        this.fireballs = [];

        // Camera Dynamics & Mouse Parallax
        this.camTargetX = 0;
        this.camTargetY = 12;
        this.camTiltX = 0;
        this.camTiltY = 0;
        this.shakeTrauma = 0;

        this.setupParallaxListeners();
        this.initLevels();
        this.loadLevel(1);
      }

      updateLivesHUD() {
        const el = this.hudLivesEl || document.getElementById('hud-lives-val');
        if (el) {
          el.textContent = '❤'.repeat(Math.max(0, this.lives));
        }
      }

      triggerScreenShake(amt = 0.8) {
        // Disabled screen vibration / camera shake per user request for smooth, steady gameplay
        this.shakeTrauma = 0;
      }

      setupParallaxListeners() {
        window.addEventListener('mousemove', (e) => {
          const nx = (e.clientX / window.innerWidth - 0.5) * 2;
          const ny = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(this, { camTiltX: nx * 0.1, camTiltY: -ny * 0.08, duration: 0.4, ease: 'power2.out' });

          // 3D Tilt for active HUD cards
          const activeCard = document.querySelector('.card-3d');
          if (activeCard) {
            gsap.to(activeCard, {
              rotationY: nx * 10,
              rotationX: -ny * 10,
              duration: 0.3,
              ease: 'power2.out'
            });
          }
        });
      }

      initLevels() {
        this.levelConfigs = {
          1: {
            title: 'STAGE 1: FLOATING CASTLE REALM',
            length: 4600,
            bgColor: 0x07051a,
            fogColor: 0x0c0724,
            platforms: [
              { x: 0, y: 440, w: 900, h: 100 },
              { x: 500, y: 340, w: 160, h: 20 }, // Floating Land 1 (Elevated observation pedestal)
              { x: 860, y: 340, w: 180, h: 20 }, // Floating Land 2 (Seamless stepping stone, 20px overlap to P4)
              { x: 1020, y: 440, w: 820, h: 100 },
              { x: 1250, y: 340, w: 160, h: 20 },
              { x: 1600, y: 310, w: 180, h: 20 }, // Floating Land (Elevated observation platform)
              { x: 1760, y: 370, w: 210, h: 20 }, // Stepping stone seamlessly connecting P4 and P7
              { x: 1950, y: 440, w: 950, h: 100 },
              { x: 2300, y: 340, w: 160, h: 20 },
              { x: 2820, y: 350, w: 250, h: 20 }, // Floating Land 3 (Seamless stepping stone, 20px overlap to P10)
              { x: 3050, y: 440, w: 920, h: 100 },
              { x: 3400, y: 320, w: 160, h: 20 },
              { x: 3750, y: 300, w: 180, h: 20 }, // Floating Land 4 (Observation bough)
              { x: 3910, y: 370, w: 210, h: 20 }, // Stepping stone seamlessly connecting P10 and P13
              { x: 4100, y: 440, w: 700, h: 100 }
            ],
            enemies: [
              { type: 'goomba', x: 750, y: 408, w: 32, h: 32, vx: -1.2, alive: true },
              { type: 'koopa', x: 1400, y: 398, w: 34, h: 42, vx: -1.5, alive: true },
              { type: 'goomba', x: 2200, y: 408, w: 32, h: 32, vx: -1.4, alive: true },
              { type: 'koopa', x: 3300, y: 398, w: 34, h: 42, vx: -1.6, alive: true },
              // +4 New Monsters on Ground & Floating Lands
              { type: 'goomba', x: 530, y: 298, w: 32, h: 32, vx: -1.0, alive: true },
              { type: 'koopa', x: 880, y: 278, w: 34, h: 42, vx: -1.1, alive: true },
              { type: 'goomba', x: 2400, y: 298, w: 32, h: 32, vx: -1.2, alive: true },
              { type: 'koopa', x: 3780, y: 228, w: 34, h: 42, vx: -1.3, alive: true }
            ],
            hazards: [{ x: 900, y: 510, w: 120, h: 60 }, { x: 2900, y: 510, w: 150, h: 60 }],
            walls: [
              { id: 'w1_1', x: 760, y: 350, w: 32, h: 90, hp: 25, label: 'CYBER WALL 01' },
              { id: 'w1_2', x: 1500, y: 345, w: 32, h: 95, hp: 25, label: 'CYBER WALL 02' },
              { id: 'w1_3', x: 2550, y: 340, w: 36, h: 100, hp: 30, label: 'CYBER WALL 03' },
              { id: 'w1_4', x: 3650, y: 340, w: 36, h: 100, hp: 30, label: 'CYBER WALL 04' }
            ],
            keys: [],
            cage: { x: 4400, y: 370, w: 50, h: 70, rescued: false }
          },
          2: {
            title: 'STAGE 2: DANGEROUS FOREST',
            length: 5100,
            bgColor: 0x021208,
            fogColor: 0x052010,
            platforms: [
              { x: 0, y: 440, w: 800, h: 100 },
              { x: 750, y: 350, w: 220, h: 25 }, // Floating Land 1 (Stepping bough, 20px overlap to P3)
              { x: 950, y: 440, w: 700, h: 100 },
              { x: 1200, y: 330, w: 180, h: 25 },
              { x: 1550, y: 280, w: 270, h: 25 }, // Floating Land 2 (Canopy bough, 20px overlap to P6)
              { x: 1800, y: 440, w: 900, h: 100 },
              { x: 2100, y: 320, w: 180, h: 25 },
              { x: 2650, y: 340, w: 220, h: 25 }, // Floating Land 3 (Stepping bough, 20px overlap to P9)
              { x: 2850, y: 440, w: 850, h: 100 },
              { x: 3200, y: 330, w: 180, h: 25 },
              { x: 3650, y: 330, w: 270, h: 25 }, // Floating Land 4 (Over ravine, 20px overlap to P12)
              { x: 3900, y: 440, w: 800, h: 100 },
              { x: 4660, y: 380, w: 160, h: 25 }, // Stepping bough seamlessly connecting P12 and P14
              { x: 4800, y: 440, w: 600, h: 100 }
            ],
            enemies: [
              { type: 'koopa', x: 500, y: 398, w: 34, h: 42, vx: -1.6, alive: true },
              { type: 'koopa', x: 1400, y: 398, w: 34, h: 42, vx: -1.8, alive: true },
              { type: 'goomba', x: 2200, y: 408, w: 32, h: 32, vx: -1.5, alive: true },
              { type: 'koopa', x: 3400, y: 398, w: 34, h: 42, vx: -2.0, alive: true },
              // +4 New Monsters on Forest Boughs
              { type: 'goomba', x: 780, y: 298, w: 32, h: 32, vx: -1.2, alive: true },
              { type: 'koopa', x: 1580, y: 218, w: 34, h: 42, vx: -1.3, alive: true },
              { type: 'goomba', x: 2680, y: 298, w: 32, h: 32, vx: -1.4, alive: true },
              { type: 'koopa', x: 3680, y: 278, w: 34, h: 42, vx: -1.5, alive: true }
            ],
            hazards: [{ x: 800, y: 510, w: 150, h: 60 }, { x: 2700, y: 510, w: 150, h: 60 }, { x: 3700, y: 510, w: 200, h: 60 }],
            walls: [
              { id: 'w2_1', x: 650, y: 345, w: 34, h: 95, hp: 25, label: 'THORN WALL' },
              { id: 'w2_2', x: 1450, y: 340, w: 34, h: 100, hp: 30, label: 'MOSS BARRICADE' },
              { id: 'w2_3', x: 2350, y: 340, w: 36, h: 100, hp: 35, label: 'VINE BULWARK' },
              { id: 'w2_4', x: 3450, y: 345, w: 36, h: 95, hp: 35, label: 'ANCIENT RAMPART' },
              { id: 'w2_5', x: 4450, y: 340, w: 38, h: 100, hp: 40, label: 'PERIMETER WALL' }
            ],
            keys: [{ id: 1, x: 1300, y: 270, collected: false }, { id: 2, x: 3300, y: 260, collected: false }],
            cage: { x: 4950, y: 370, w: 50, h: 70, rescued: false }
          },
          3: {
            title: 'STAGE 3: CASTLE BATTLEMENTS',
            length: 5400,
            bgColor: 0x14040a,
            fogColor: 0x220812,
            platforms: [
              { x: 0, y: 440, w: 800, h: 100 },
              { x: 800, y: 360, w: 160, h: 25 }, // Floating Land 1 (Seamless zero-gap stepping stone, open overhead clearance)
              { x: 940, y: 380, w: 240, h: 40 },
              { x: 1160, y: 340, w: 220, h: 25 }, // Floating Land 2
              { x: 1360, y: 350, w: 400, h: 40 }, // P4
              { x: 1740, y: 370, w: 180, h: 25 }, // Stepping stone
              { x: 1900, y: 440, w: 800, h: 100 },
              { x: 2700, y: 360, w: 170, h: 25 }, // Floating Land 3 (Seamless zero-gap stepping stone, open overhead clearance)
              { x: 2850, y: 380, w: 330, h: 40 },
              { x: 3160, y: 340, w: 240, h: 25 }, // Floating Land 4
              { x: 3380, y: 350, w: 480, h: 40 }, // P10
              { x: 3840, y: 380, w: 180, h: 25 }, // Stepping stone
              { x: 4000, y: 440, w: 950, h: 100 },
              { x: 4940, y: 380, w: 120, h: 25 }, // Stepping stone
              { x: 5050, y: 440, w: 500, h: 100 }
            ],
            enemies: [
              { type: 'koopa', x: 450, y: 398, w: 34, h: 42, vx: -2.0, alive: true },
              { type: 'koopa', x: 2200, y: 398, w: 34, h: 42, vx: -2.2, alive: true },
              { type: 'goomba', x: 4300, y: 408, w: 32, h: 32, vx: -1.8, alive: true },
              // +4 New Monsters on Parapets & Bridges
              { type: 'goomba', x: 800, y: 308, w: 32, h: 32, vx: -1.4, alive: true },
              { type: 'koopa', x: 1120, y: 248, w: 34, h: 42, vx: -1.6, alive: true },
              { type: 'goomba', x: 2740, y: 308, w: 32, h: 32, vx: -1.5, alive: true },
              { type: 'koopa', x: 3120, y: 238, w: 34, h: 42, vx: -1.7, alive: true }
            ],
            hazards: [{ x: 750, y: 510, w: 1150, h: 60 }, { x: 2700, y: 510, w: 1300, h: 60 }],
            walls: [
              { id: 'w3_1', x: 600, y: 335, w: 36, h: 105, hp: 35, label: 'IRON PORTCULLIS' },
              { id: 'w3_2', x: 2350, y: 335, w: 38, h: 105, hp: 40, label: 'STONE RAMPART' },
              { id: 'w3_3', x: 4450, y: 335, w: 40, h: 105, hp: 45, label: 'FORTRESS GATE' },
              { id: 'w3_4', x: 5120, y: 345, w: 36, h: 95, hp: 50, label: 'CITADEL WALL' }
            ],
            keys: [],
            cage: { x: 5200, y: 370, w: 50, h: 70, rescued: false }
          },
          4: {
            title: "STAGE 4: BOWSER'S MAGMA CORE",
            length: 5200,
            bgColor: 0x1c0502,
            fogColor: 0x300904,
            platforms: [
              { x: 0, y: 440, w: 800, h: 100 },
              { x: 780, y: 340, w: 180, h: 25 }, // Floating Land 1 (Magma stepping stone)
              { x: 950, y: 440, w: 450, h: 60 },
              { x: 1380, y: 330, w: 180, h: 25 }, // Floating Land 2 (Magma stepping stone)
              { x: 1550, y: 440, w: 500, h: 60 },
              { x: 2020, y: 320, w: 180, h: 25 }, // Floating Land 3 (Magma stepping stone)
              { x: 2200, y: 440, w: 550, h: 60 },
              { x: 2740, y: 330, w: 150, h: 25 }, // Stepping stone over chasm
              { x: 2900, y: 440, w: 650, h: 60 },
              { x: 3380, y: 340, w: 220, h: 25 }, // Floating Land 4 (Pre-arena fortress bridge)
              { x: 3560, y: 380, w: 180, h: 25 }, // Pre-arena stepping stone (seamless 40px overlap to Bowser Arena)
              { x: 3700, y: 440, w: 1600, h: 100 } // Bowser Arena
            ],
            enemies: [
              { type: 'koopa', x: 500, y: 398, w: 34, h: 42, vx: -2.2, alive: true },
              { type: 'koopa', x: 1700, y: 398, w: 34, h: 42, vx: -2.4, alive: true },
              // +4 New Minion Defense Line
              { type: 'goomba', x: 800, y: 308, w: 32, h: 32, vx: -1.3, alive: true },
              { type: 'koopa', x: 1400, y: 288, w: 34, h: 42, vx: -1.6, alive: true },
              { type: 'goomba', x: 2040, y: 288, w: 32, h: 32, vx: -1.5, alive: true },
              { type: 'koopa', x: 3380, y: 268, w: 34, h: 42, vx: -1.8, alive: true }
            ],
            hazards: [{ x: 800, y: 510, w: 150, h: 60 }, { x: 1400, y: 510, w: 150, h: 60 }, { x: 2050, y: 510, w: 150, h: 60 }],
            walls: [
              { id: 'w4_1', x: 620, y: 335, w: 36, h: 105, hp: 40, label: 'MAGMA BASTION' },
              { id: 'w4_2', x: 1850, y: 335, w: 38, h: 105, hp: 45, label: 'OBSIDIAN WALL' },
              { id: 'w4_3', x: 3200, y: 330, w: 40, h: 110, hp: 50, label: 'VOLCANIC BULWARK' },
              { id: 'w4_4', x: 4100, y: 345, w: 42, h: 95, hp: 60, label: 'SHIELD BARRICADE' }
            ],
            keys: [],
            cage: { x: 5050, y: 370, w: 50, h: 70, rescued: false },
            boss: {
              x: 4700,
              y: 345,
              w: 90,
              h: 95,
              hp: 140,
              maxHp: 140,
              alive: true,
              attackTimer: 0,
              takeDamage: function(amt) {
                this.hp = Math.max(0, this.hp - amt);
                if (this.hp <= 0) this.alive = false;
              }
            }
          }
        };
      }

      loadLevel(idx, isCheckpoint = false) {
        this.currentLevelIndex = idx;
        if (!isCheckpoint) {
          // Exactly 3 lives granted on each level per specification
          this.lives = 3;
        }
        this.updateLivesHUD();
        const cfg = JSON.parse(JSON.stringify(this.levelConfigs[idx]));
        if (idx === 4 && this.levelConfigs[4].boss) {
          cfg.boss = { ...this.levelConfigs[4].boss };
          cfg.boss.takeDamage = this.levelConfigs[4].boss.takeDamage.bind(cfg.boss);
        }

        // Deep copy obstacle walls with fresh health states
        cfg.walls = JSON.parse(JSON.stringify(this.levelConfigs[idx].walls || []));
        cfg.walls.forEach(w => {
          w.alive = true;
          w.maxHp = w.hp || 30;
        });

        // =====================================================================
        // Platform Population:
        // - Each normal platform (main land): EXACTLY 4 monsters + 5 gold coins
        // - Each floating land: EXACTLY 1 monster + 2 gold coins
        // =====================================================================
        cfg.enemies = [];
        cfg.coins = [];

        cfg.platforms.forEach((p, pIdx) => {
          const isFloating = (p.y < 420 || p.h <= 40);
          const monsterCount = isFloating ? 1 : 4;
          const coinCount = isFloating ? 2 : 5;

          // Keep monsters away from platform edges
          let mStartX = isFloating ? (p.x + Math.max(10, p.w * 0.15)) : (p.x + Math.min(45, p.w * 0.1));
          let mEndX = isFloating ? (p.x + p.w - Math.max(10, p.w * 0.15)) : (p.x + p.w - Math.min(45, p.w * 0.1));

          if (pIdx === 0) {
            // Keep the initial spawn zone safe while standing still
            mStartX = Math.max(p.x + 420, p.x + Math.min(460, p.w * 0.42));
            mEndX = Math.min(p.x + p.w - 40, p.x + 920);
          } else if (idx === 4 && p.w >= 1200) {
            // Stage 4 Bowser Arena: minions patrol before Bowser (x <= 4450)
            mEndX = 4450;
          }

          const mStep = (mEndX - mStartX) / Math.max(1, monsterCount - 1);
          for (let m = 0; m < monsterCount; m++) {
            let type;
            if (isFloating) {
              // Floating platform: exactly 1 monster, randomized between Crystal Golem and Baby Dragon
              type = Math.random() < 0.5 ? 'golem' : 'dragon';
            } else {
              // Main land (normal platform): exactly 4 monsters (2 Crystal Golems and 2 Baby Dragons, 2-2 each)
              const mainLandPattern = ['golem', 'dragon', 'golem', 'dragon'];
              type = mainLandPattern[m % 4];
            }
            const mw = 34;
            const mh = 38;
            const mx = monsterCount === 1 ? (mStartX + mEndX) / 2 : mStartX + m * mStep;
            const my = p.y - mh;
            const vx = (m % 2 === 0) ? -1.1 : 1.1;

            cfg.enemies.push({
              type: type,
              x: mx,
              y: my,
              w: mw,
              h: mh,
              vx: vx,
              alive: true,
              platform: p,
              isFloating: isFloating,
              animOffset: m * 1.5 + pIdx
            });
          }

          // Populate Collectible Coins:
          // 1. Keep Peach's initial spawn area (x=120) completely free of coins
          // 2. NEVER generate coins at or after Mario's cage (c.x < cageX)
          const cageX = (cfg.cage && typeof cfg.cage.x === 'number') ? cfg.cage.x : Infinity;

          // If platform is entirely beyond Mario's cage, do not generate any coins on it
          if (p.x >= cageX) return;

          let cStart = p.x + Math.min(35, p.w * 0.12);
          let cEnd = p.x + p.w - Math.min(35, p.w * 0.12);

          if (pIdx === 0) {
            // Keep Peach's initial spawn area (x=120) completely free of coins
            cStart = p.x + 380;
            cEnd = Math.min(p.x + p.w - 50, p.x + 880);
          }

          // If platform reaches or contains Mario's cage, stop all coins safely before the cage
          if (cEnd >= cageX) {
            cEnd = cageX - 50;
            if (cStart >= cEnd) cStart = Math.max(p.x + 20, cEnd - 120);
          }

          if (cEnd > cStart) {
            const cStep = (cEnd - cStart) / Math.max(1, coinCount - 1);
            for (let c = 0; c < coinCount; c++) {
              const cx = coinCount === 1 ? (cStart + cEnd) / 2 : cStart + c * cStep;
              const cy = p.y - 40;
              if (cx < cageX - 20) {
                cfg.coins.push({
                  x: cx,
                  y: cy,
                  baseY: cy,
                  collected: false,
                  seed: c * 1.5 + pIdx
                });
              }
            }
          }
        });

        // Strictly enforce: zero coins after Mario's cage across all levels
        if (cfg.cage && typeof cfg.cage.x === 'number') {
          cfg.coins = cfg.coins.filter(c => c.x < cfg.cage.x - 20);
        }

        this.level = cfg;

        // Reset Peach Position
        this.peach.x = 120;
        this.peach.y = 380;
        this.peach.vx = 0;
        this.peach.vy = 0;
        this.peach.grounded = true;
        this.peach.jumpsLeft = 1;
        this.lastSafeGroundX = 120;
        this.lastSafeGroundY = 380;
        const cp = document.getElementById('cage-prompt');
        if (cp) cp.style.display = 'none';

        // Rebuild 3D Scene Elements for Level
        this.buildLevel3D();

        // Update Level HUD Banner
        const ban = document.getElementById('ban');
        if (ban) {
          ban.textContent = cfg.title;
          gsap.fromTo(ban, { opacity: 0, scale: 0.7, y: -20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.5)', onComplete: () => {
            gsap.to(ban, { opacity: 0, delay: 1.5, duration: 0.5 });
          }});
        }

        const lvlVal = document.getElementById('hud-level-val');
        if (lvlVal) lvlVal.textContent = `${idx}/4`;

        // Stage 4 Bowser HP Container
        const bossBar = document.getElementById('boss-hp-container');
        if (bossBar) {
          bossBar.style.display = idx === 4 ? 'block' : 'none';
          this.updateBossHPBar();
        }

        // Atmosphere, Sky & Sunlight Shift (Level 1 Azure Sky & Floating Castle Realm Backdrop applied to ALL levels)
        scene.background.setHex(0x60a5fa); // Radiant azure blue sky matching Level 1 background image
        scene.fog = new THREE.Fog(0x93c5fd, 140, 420);
        if (typeof bgBackdropPlane !== 'undefined' && bgBackdropPlane) bgBackdropPlane.visible = true;
        ambientLight.color.setHex(0xfffbeb); // Warm sunny ambient light
        ambientLight.intensity = 1.35;
        dirLight.color.setHex(0xfffae5); // Brilliant sunbeam directional light
        dirLight.intensity = 1.45;
        if (typeof pointLight !== 'undefined' && pointLight) {
          pointLight.intensity = 0.4;
          pointLight.color.setHex(0xbae6fd); // Soft sky bounce key light
        }
        if (typeof groundPlane !== 'undefined' && groundPlane) groundPlane.visible = false;
        if (typeof starPoints !== 'undefined' && starPoints) starPoints.visible = false;
        if (typeof horizonGlow !== 'undefined' && horizonGlow) horizonGlow.visible = false;
      }

      buildLevel3D() {
        // Clear previous meshes and release GPU memory to prevent memory leaks and GC pauses
        this.platformMeshes.forEach(m => { scene.remove(m); disposeMesh(m); });
        this.platformMeshes = [];
        this.enemyMeshes.forEach(m => { scene.remove(m.mesh); disposeMesh(m.mesh); });
        this.enemyMeshes = [];
        this.itemMeshes.forEach(item => { const m = item.mesh || item; scene.remove(m); disposeMesh(m); });
        this.itemMeshes = [];
        if (this.coinMeshes) {
          this.coinMeshes.forEach(cm => { scene.remove(cm.mesh); disposeMesh(cm.mesh); });
        }
        this.coinMeshes = [];
        if (this.heartBlasts) {
          this.heartBlasts.forEach(hb => { if (hb.mesh) { scene.remove(hb.mesh); disposeMesh(hb.mesh); } });
        }
        this.heartBlasts = [];
        if (this.fireballs) {
          this.fireballs.forEach(fb => { if (fb.mesh) { scene.remove(fb.mesh); disposeMesh(fb.mesh); } });
        }
        this.fireballs = [];
        if (this.wallMeshes) {
          this.wallMeshes.forEach(wm => { scene.remove(wm.mesh); disposeMesh(wm.mesh); });
        }
        this.wallMeshes = [];
        if (this.cageMesh) { scene.remove(this.cageMesh); disposeMesh(this.cageMesh); }
        if (this.bossMesh) { scene.remove(this.bossMesh); disposeMesh(this.bossMesh); }

        // 1. 3D Platforms (Level 1 Theme applied to ALL levels: Cobblestone & Mountain Stone for mainland, Ornate Celestial Pedestals for floating)
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x334155, emissive: 0x1e293b, emissiveIntensity: 0.15 });
        const groundLineMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.6 });

        this.level.platforms.forEach(p => {
          const isFloating = (p.y < 420 || p.h <= 40);
          const w3D = p.w * S2D;
          const h3D = p.h * S2D;
          const x3D = (p.x + p.w / 2) * S2D;
          const y3D = to3DY(p.y + p.h / 2);

          let mesh;
          if (isFloating) {
            // Floating Celestial Pedestal Slab (ornate bronze filigree & celestial runes)
            const floatMat = new THREE.MeshLambertMaterial({
              color: 0x1e293b,
              emissive: 0x0f172a,
              emissiveIntensity: 0.25
            });
            mesh = new THREE.Mesh(new THREE.BoxGeometry(w3D, h3D, 5.0), floatMat);
            mesh.position.set(x3D, y3D, 0);

            // Glowing Runic Walking Top Surface
            const platTop = new THREE.Mesh(
              new THREE.PlaneGeometry(w3D, 5.0),
              new THREE.MeshLambertMaterial({
                map: celestialPedestalTexture,
                emissive: 0x0284c7,
                emissiveIntensity: 0.45
              })
            );
            platTop.rotation.x = -Math.PI / 2;
            platTop.position.set(0, h3D / 2 + 0.02, 0);
            mesh.add(platTop);

            // Front face with ornate bronze border and cyan runes matching floating chest in image
            const frontPedestal = new THREE.Mesh(
              new THREE.PlaneGeometry(w3D, h3D),
              new THREE.MeshLambertMaterial({
                map: floatingPedestalFrontTexture,
                emissive: 0x0284c7,
                emissiveIntensity: 0.25
              })
            );
            frontPedestal.position.set(0, 0, 2.51);
            mesh.add(frontPedestal);

            // Ornate Bronze Filigree Edge Trim on front facing edge
            const trimMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, emissive: 0xb45309, emissiveIntensity: 0.4 });
            const trimTop = new THREE.Mesh(new THREE.BoxGeometry(w3D + 0.1, 0.12, 0.2), trimMat);
            trimTop.position.set(0, h3D / 2 - 0.05, 2.52);
            mesh.add(trimTop);

            const trimBottom = new THREE.Mesh(new THREE.BoxGeometry(w3D + 0.1, 0.1, 0.2), trimMat);
            trimBottom.position.set(0, -h3D / 2 + 0.05, 2.52);
            mesh.add(trimBottom);

            const edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(mesh.geometry),
              new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
            );
            mesh.add(edges);
          } else {
            // Mainland Ground Platform (Weathered Mountain Stone Cliff & Cobblestone Pavers)
            mesh = new THREE.Mesh(new THREE.BoxGeometry(w3D, h3D, 5.0), groundMat);
            mesh.position.set(x3D, y3D, 0);

            // Top Walking Surface: Cobblestone masonry with emerald moss seams in Stage 1 design
            const topTex = cobblestoneTexture.clone();
            topTex.repeat.set(Math.max(2, Math.round(w3D / 2.2)), 2.0);
            topTex.wrapS = topTex.wrapT = THREE.RepeatWrapping;

            const platTop = new THREE.Mesh(
              new THREE.PlaneGeometry(w3D, 5.0),
              new THREE.MeshLambertMaterial({
                map: topTex,
                color: 0xffffff,
                emissive: 0x1e293b,
                emissiveIntensity: 0.25
              })
            );
            platTop.rotation.x = -Math.PI / 2;
            platTop.position.set(0, h3D / 2 + 0.02, 0);
            mesh.add(platTop);

            // Front cliff face: mountain stone cliff pavers with moss matching Level 1 design
            const cliffTex = stoneCliffTexture.clone();
            cliffTex.repeat.set(Math.max(2, Math.round(w3D / 2.2)), Math.max(1, Math.round(h3D / 2.2)));
            cliffTex.wrapS = cliffTex.wrapT = THREE.RepeatWrapping;

            const frontCliff = new THREE.Mesh(
              new THREE.PlaneGeometry(w3D, h3D),
              new THREE.MeshLambertMaterial({
                map: cliffTex,
                color: 0xffffff,
                emissive: 0x1e293b,
                emissiveIntensity: 0.15
              })
            );
            frontCliff.position.set(0, 0, 2.51);
            mesh.add(frontCliff);

            // Emerald Moss Trim along top rim
            const mossTrimMat = new THREE.MeshLambertMaterial({ color: 0x16a34a, emissive: 0x15803d, emissiveIntensity: 0.3 });
            const mossTrim = new THREE.Mesh(new THREE.BoxGeometry(w3D + 0.06, 0.22, 0.16), mossTrimMat);
            mossTrim.position.set(0, h3D / 2 - 0.1, 2.5);
            mesh.add(mossTrim);

            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), groundLineMat);
            mesh.add(edges);
          }

          scene.add(mesh);
          this.platformMeshes.push(mesh);
        });

        // 2. 3D Enemies (Crystal Golem & Baby Dragon)
        this.level.enemies.forEach(e => {
          const em = (e.type === 'golem' || e.type === 'goomba') ? createGolemMesh() : createDragonMesh();
          scene.add(em);
          this.enemyMeshes.push({ data: e, mesh: em });
        });

        // 3. 3D Collectible Coins
        if (this.level.coins && this.level.coins.length > 0) {
          this.level.coins.forEach(c => {
            const cm = createCoinMesh();
            cm.position.set(to3DX(c.x), to3DY(c.y), 0);
            scene.add(cm);
            this.coinMeshes.push({ data: c, mesh: cm });
          });
        }

        // 4. 3D Collectible Keys (Stage 2)
        if (this.level.keys && this.level.keys.length > 0) {
          const keyMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.6 });
          this.level.keys.forEach(k => {
            const km = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 6, 10), keyMat);
            km.position.set(to3DX(k.x), to3DY(k.y), 0);
            scene.add(km);
            this.itemMeshes.push({ data: k, mesh: km });
          });
        }

        // 5. 3D Mario Cage (Firmly touching ground)
        if (this.level.cage) {
          this.cageMesh = createMarioCageMesh();
          this.cageMesh.position.set(to3DX(this.level.cage.x + this.level.cage.w / 2), to3DY(this.level.cage.y + this.level.cage.h), 0);
          scene.add(this.cageMesh);
        }

        // 6. 3D Bowser Boss (Stage 4 - Feet on ground)
        if (this.level.boss) {
          this.bossMesh = createBowserMesh();
          this.bossMesh.position.set(to3DX(this.level.boss.x + this.level.boss.w / 2), to3DY(this.level.boss.y + this.level.boss.h), 0);
          scene.add(this.bossMesh);
        }

        // 7. 3D Obstacle Walls (Themed Per Stage Barricades)
        if (this.level.walls && this.level.walls.length > 0) {
          this.level.walls.forEach(wall => {
            if (!wall.alive && wall.hp <= 0) return;
            const wm = createObstacleWallMesh(wall, this.currentLevelIndex);
            const x3D = (wall.x + wall.w / 2) * S2D;
            const y3D = to3DY(wall.y + wall.h / 2);
            wm.position.set(x3D, y3D, 0);
            scene.add(wm);
            this.wallMeshes.push({ data: wall, mesh: wm });
            wall.mesh = wm;
          });
        }
      }

      updateBossHPBar() {
        if (!this.level || !this.level.boss) return;
        const b = this.level.boss;
        const fill = document.getElementById('boss-hp-fill');
        const txt = document.getElementById('boss-hp-text');
        if (fill) fill.style.width = `${Math.max(0, (b.hp / b.maxHp) * 100)}%`;
        if (txt) txt.textContent = `${b.hp} / ${b.maxHp} HP`;
      }

      handleDamage(source) {
        if (this.state !== 'play') return;
        if (this.peach.invulnerableTimer > 0) return;
        audio.playDamage();

        // Screen Flash
        const fl = document.getElementById('screen-flash');
        if (fl) {
          fl.style.opacity = '0.55';
          setTimeout(() => fl.style.opacity = '0', 120);
        }

        // Knockback recoil ONLY for physical/enemy attacks, NOT when falling into void
        if (source !== 'hazard') {
          audio.playHeavyImpact();
          this.peach.vx = -this.peach.facing * 4.5;
          this.peach.vy = -4.0;
          emitSplatter(this.peach.x, this.peach.y, 0xff0022, 16);
          this.triggerScreenShake(0.8);
        }

        this.peach.invulnerableTimer = 100;
        this.peachHp--;

        // Trigger 12-Second Revival Trivia Modal (instant 0ms display)
        triviaRevivalSystem.triggerRevival(this.currentLevelIndex);
      }

      triggerVictory() {
        this.state = 'victory';
        audio.playVictory();
        const vs = document.getElementById('victory-screen');
        const sc = document.getElementById('victory-score-val');
        if (sc) sc.textContent = this.score;
        if (vs) vs.classList.add('active');

        // Log final run to server / indexedDB
        this.logRun(true);
      }

      async logRun(completed = false) {
        const username = document.getElementById('player-name-input')?.value || 'PeachOperative';
        const runData = {
          username: username,
          score: this.score,
          level_reached: this.currentLevelIndex,
          lives_used: Math.max(0, 3 - this.lives),
          duration: Math.max(1, Math.round(this.elapsedTime))
        };
        try {
          if (navigator.onLine) {
            await fetch('/api/run', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(runData)
            });
          } else {
            storage.queueRun(runData);
          }
        } catch (e) {
          storage.queueRun(runData);
        }
      }

      // Physics & Game Loop Update
      update(dt) {
        if (this.state !== 'play') return;
        this.elapsedTime += dt;

        // Invulnerability Countdown
        if (this.peach.invulnerableTimer > 0) {
          this.peach.invulnerableTimer--;
        }

        // Smooth, Controlled Horizontal Movement (Tuned for precise platform landings with gestures and keyboard)
        const isCamActive = typeof gestureController !== 'undefined' && gestureController && gestureController.enabled;
        const maxSpeed = 3.6;
        const accel = this.peach.grounded ? 2.0 : 1.6;
        // Strong air-braking when centered in gesture mode prevents sliding off platform edges upon landing
        const friction = this.peach.grounded ? 0.60 : (isCamActive ? 0.62 : 0.75);

        if (this.keys.left) {
          if (this.peach.vx > 0) this.peach.vx = 0; // Instant turn-around: no sluggish sliding
          this.peach.vx = Math.max(-maxSpeed, this.peach.vx - accel);
          this.peach.facing = -1;
          this.peach.state = 'run';
        } else if (this.keys.right) {
          if (this.peach.vx < 0) this.peach.vx = 0; // Instant turn-around: no sluggish sliding
          this.peach.vx = Math.min(maxSpeed, this.peach.vx + accel);
          this.peach.facing = 1;
          this.peach.state = 'run';
        } else {
          this.peach.vx *= friction;
          if (Math.abs(this.peach.vx) < 0.2) {
            this.peach.vx = 0;
            this.peach.state = 'idle';
          }
        }

        // Coyote Time (grace period to jump after stepping off a platform edge)
        if (this.peach.grounded) {
          this.peach.coyoteTimer = 10;
          this.peach.jumpsLeft = 1; // Single jump only - cannot jump in mid-air
          this.peach.jumpAirTime = 0;
        } else if (this.peach.coyoteTimer > 0) {
          this.peach.coyoteTimer--;
        }

        // Jump Buffering & Responsive Keypress Tracking (Buffer jump for 12 frames ~200ms)
        const jumpJustPressed = this.keys.jump && !this.prevJumpKey;
        this.prevJumpKey = !!this.keys.jump;

        if (jumpJustPressed) {
          this.peach.jumpBufferTimer = 12;
        } else if (this.peach.jumpBufferTimer > 0) {
          this.peach.jumpBufferTimer--;
        }

        // In keyboard mode allow hold-jump on landing, but disable hold-auto-bunnyhopping in gesture mode to prevent accidental leap-offs!
        if (!isCamActive && this.keys.jump && this.peach.grounded && this.peach.jumpHoldReady) {
          this.peach.jumpBufferTimer = 6;
          this.peach.jumpHoldReady = false;
        }
        if (!this.keys.jump) {
          this.peach.jumpHoldReady = true;
        }

        // Jump Execution (INSTANT Zero-Lag Ground Jump)
        if (this.peach.jumpBufferTimer > 0) {
          if (this.peach.coyoteTimer > 0 || this.peach.grounded) {
            this.peach.vy = -12.4;
            this.peach.grounded = false;
            this.peach.coyoteTimer = 0;
            this.peach.jumpBufferTimer = 0;
            this.peach.jumpsLeft = 0;
            this.peach.jumpAirTime = 0;
            audio.playJump();
          }
        }

        // Variable Jump Height: snappy short hop when released, with a 3-frame launch grace window
        this.peach.jumpAirTime = (this.peach.jumpAirTime || 0) + 1;
        if (!this.keys.jump && this.peach.vy < -3 && this.peach.jumpAirTime > 3) {
          this.peach.vy *= 0.72;
        }

        const prevX = this.peach.x;
        const prevY = this.peach.y;
        const pw = this.peach.w;
        const ph = this.peach.h;

        // Apply horizontal movement with stage bounds clamp
        this.peach.x += this.peach.vx;
        this.peach.x = Math.max(0, Math.min(this.level.length - pw, this.peach.x));

        // Solid Platform Wall Collision (All platforms, including floating platforms, are fully solid on all sides)
        for (const p of this.level.platforms) {
          if (this.peach.y + ph > p.y + 6 && this.peach.y < p.y + p.h - 1) {
            // Hitting left wall of platform
            if (prevX + pw <= p.x + 3 && this.peach.x + pw > p.x) {
              this.peach.x = p.x - pw;
              this.peach.vx = 0;
            }
            // Hitting right wall of platform
            else if (prevX >= p.x + p.w - 3 && this.peach.x < p.x + p.w) {
              this.peach.x = p.x + p.w;
              this.peach.vx = 0;
            }
          }
        }

        // Solid Obstacle Walls Horizontal Collision (Blocks Peach horizontally unless leaped over or destroyed)
        if (this.level.walls) {
          for (const wall of this.level.walls) {
            if (wall.hp <= 0) continue;
            if (this.peach.y + ph > wall.y + 4 && this.peach.y < wall.y + wall.h - 4) {
              if (prevX + pw <= wall.x + 2 && this.peach.x + pw > wall.x) {
                this.peach.x = wall.x - pw;
                this.peach.vx = 0;
              } else if (prevX >= wall.x + wall.w - 2 && this.peach.x < wall.x + wall.w) {
                this.peach.x = wall.x + wall.w;
                this.peach.vx = 0;
              }
            }
          }
        }

        // Apply gravity & vertical movement
        this.peach.vy += 0.48;
        if (this.peach.vy > 14) this.peach.vy = 14;
        this.peach.y += this.peach.vy;

        // Solid Platform Vertical Collision (Top Surface Landing & Underside Ceiling Bump)
        this.peach.grounded = false;
        for (const p of this.level.platforms) {
          // Check horizontal overlap with platform (Generous 6px ledge grip margin for effortless landings)
          if (this.peach.x + pw > p.x - 6 && this.peach.x < p.x + p.w + 6) {
            // 1. TOP LANDING: Solid landing onto ground or floating platforms, safe against terminal speeds
            if (this.peach.vy >= 0 && prevY + ph <= p.y + Math.max(16, this.peach.vy + 4) && this.peach.y + ph >= p.y) {
              this.peach.y = p.y - ph;
              this.peach.vy = 0;
              this.peach.grounded = true;
              this.peach.jumpsLeft = 1;
              break;
            }
            // 2. SOLID UNDERSIDE CEILING BUMP: All platforms (mainland and floating) are fully solid from below
            else if (this.peach.vy < 0 && prevY >= p.y + p.h - Math.max(14, Math.abs(this.peach.vy) + 3) && this.peach.y <= p.y + p.h) {
              this.peach.y = p.y + p.h;
              this.peach.vy = 1.0; // Bump head and bounce down
              audio.tone(200, 0.08, 'square', 0.06, -50); // Gentle mechanical bump sound
              break;
            }
          }
        }

        // Solid Obstacle Walls Top Landing Collision (Allows Peach to land on top as elevated parapets)
        if (this.level.walls && !this.peach.grounded) {
          for (const wall of this.level.walls) {
            if (wall.hp <= 0) continue;
            if (this.peach.x + pw > wall.x + 2 && this.peach.x < wall.x + wall.w - 2) {
              if (this.peach.vy >= 0 && prevY + ph <= wall.y + Math.max(14, this.peach.vy + 2) && this.peach.y + ph >= wall.y) {
                this.peach.y = wall.y - ph;
                this.peach.vy = 0;
                this.peach.grounded = true;
                this.peach.jumpsLeft = 1;
                break;
              }
            }
          }
        }

        // Track last safe grounded coordinates on solid ground platforms
        if (this.peach.grounded && this.peach.y <= 400) {
          this.lastSafeGroundX = this.peach.x;
          this.lastSafeGroundY = this.peach.y;
        }

        // Fall into chasm / lava hazard - Instant Smooth Safe Respawn (ZERO lag)
        if (this.peach.y > 470) {
          const safeX = this.lastSafeGroundX || 120;
          const safeY = this.lastSafeGroundY || 394;
          this.peach.x = safeX;
          this.peach.y = safeY;
          this.peach.vx = 0;
          this.peach.vy = 0;
          this.peach.grounded = true;
          this.peach.jumpsLeft = 1;

          // Camera snaps immediately to safe position without dragging through pit
          camera.position.x = to3DX(safeX + this.peach.w / 2) + 3.8;
          camera.position.y = to3DY(safeY + this.peach.h / 2) + 3.6;
          camera.position.z = 28;

          this.handleDamage('hazard');
        }

        // Attack Inputs
        if (this.keys.wrench) {
          audio.playWrench();
          this.peach.state = 'attack';
          this.performWrenchStrike();
          this.keys.wrench = false;
        }

        if (this.keys.heart) {
          this.fireHeartBlast();
          this.keys.heart = false;
        }

        // Update Heart Blasts
        for (let i = this.heartBlasts.length - 1; i >= 0; i--) {
          const hb = this.heartBlasts[i];
          hb.x += hb.vx;
          hb.life -= dt;
          if (hb.mesh) hb.mesh.position.set(to3DX(hb.x), to3DY(hb.y), 0);

          // Check hit against enemies
          for (const em of this.enemyMeshes) {
            const e = em.data;
            if (e.alive && Math.abs(hb.x - e.x) < 40 && Math.abs(hb.y - e.y) < 40) {
              e.alive = false;
              scene.remove(em.mesh);
              disposeMesh(em.mesh);
              audio.playMonsterDefeat(e.type === 'golem' || e.type === 'goomba');
              const splatterCol = (e.type === 'golem' || e.type === 'goomba') ? 0x06b6d4 : 0xf97316;
              emitSplatter(e.x, e.y, splatterCol, 26);
              this.score += 200;
              if (this.hudScoreEl) this.hudScoreEl.textContent = this.score;
              hb.life = 0;
            }
          }

          // Check hit against Bowser
          if (this.level.boss && this.level.boss.alive && Math.abs(hb.x - this.level.boss.x) < 80) {
            this.level.boss.takeDamage(10);
            this.updateBossHPBar();
            audio.playBossHit();
            audio.playHeavyImpact();
            emitSplatter(this.level.boss.x, this.level.boss.y + 20, 0xff5500, 28);
            hb.life = 0;

            if (!this.level.boss.alive) {
              audio.playVictory();
              emitSplatter(this.level.boss.x, this.level.boss.y + 20, 0xff3e14, 60);
              this.triggerScreenShake(2.0);
              showCombatHit('👑 KING BOWSER VANQUISHED! RESCUE MARIO!', '#ffd700');
              if (this.bossMesh) {
                gsap.to(this.bossMesh.position, { y: -10, duration: 2.0, ease: 'power2.in' });
              }
              const fill = document.getElementById('boss-hp-fill');
              if (fill) fill.style.width = '0%';
              const txt = document.getElementById('boss-hp-text');
              if (txt) txt.textContent = '0 / 140 HP (VANQUISHED)';
            }
          }

          // Permanent Obstacle Walls: Fireballs detonate against the permanent wall without damaging or destroying it
          if (this.level.walls && hb.life > 0) {
            for (const wall of this.level.walls) {
              if (wall.alive === false) continue;
              if (Math.abs(hb.x - (wall.x + wall.w / 2)) < wall.w / 2 + 18 &&
                  Math.abs(hb.y - (wall.y + wall.h / 2)) < wall.h / 2 + 20) {
                // Detonate fireball on impact against the permanent obstacle
                hb.life = 0;
                audio.playHeavyImpact();
                audio.tone(220, 0.12, 'square', 0.25, -50);
                emitSplatter(wall.x + (hb.vx > 0 ? 0 : wall.w), hb.y, 0x38bdf8, 22);
                this.triggerScreenShake(0.4);
                showCombatHit('🛡️ PERMANENT OBSTACLE!', '#38bdf8');
                break;
              }
            }
          }

          if (hb.life <= 0) {
            if (hb.mesh) scene.remove(hb.mesh);
            this.heartBlasts.splice(i, 1);
          }
        }

        // Update Bowser Fireballs (Stage 4)
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
          const fb = this.fireballs[i];
          fb.x += fb.vx * (dt * 60);
          fb.life -= dt;
          if (fb.mesh) fb.mesh.position.set(to3DX(fb.x), to3DY(fb.y), 0);

          // Check hit against obstacle walls (Shields Peach from fireballs!)
          if (this.level.walls) {
            let blockedByWall = false;
            for (const wall of this.level.walls) {
              if (wall.hp <= 0) continue;
              if (Math.abs(fb.x - (wall.x + wall.w / 2)) < wall.w / 2 + 14 &&
                  Math.abs(fb.y - (wall.y + wall.h / 2)) < wall.h / 2 + 18) {
                emitSplatter(fb.x, fb.y, 0xff5500, 22);
                audio.playHeavyImpact();
                showCombatHit('🛡️ WALL SHIELDED FIREBALL!', '#22d3ee');
                if (fb.mesh) scene.remove(fb.mesh);
                this.fireballs.splice(i, 1);
                blockedByWall = true;
                break;
              }
            }
            if (blockedByWall) continue;
          }

          // Check hit against Peach
          if (
            Math.abs(fb.x - this.peach.x) < 32 &&
            Math.abs(fb.y - this.peach.y) < 36
          ) {
            this.handleDamage('bowser_fireball');
            if (fb.mesh) scene.remove(fb.mesh);
            this.fireballs.splice(i, 1);
            continue;
          }

          if (fb.life <= 0) {
            if (fb.mesh) scene.remove(fb.mesh);
            this.fireballs.splice(i, 1);
          }
        }

        // Check and Collect 3D Coins (Optimized: single bob timestamp + cached DOM updates)
        if (this.coinMeshes) {
          const coinBob = this.elapsedTime * 4.2;
          for (let i = this.coinMeshes.length - 1; i >= 0; i--) {
            const cm = this.coinMeshes[i];
            const c = cm.data;
            if (c.collected) continue;

            // Continuous 3D spin and gentle hover bobbing
            cm.mesh.rotation.y += 0.05;
            cm.mesh.position.y = to3DY(c.baseY) + Math.sin(coinBob + c.seed) * 0.22;

            // Collision with Princess Peach (Scaled for enlarged 3D coins)
            if (
              Math.abs((this.peach.x + this.peach.w / 2) - c.x) < 38 &&
              Math.abs((this.peach.y + this.peach.h / 2) - c.y) < 45
            ) {
              c.collected = true;
              scene.remove(cm.mesh);
              this.coins++;
              this.score += 50;

              if (this.hudCoinsEl) this.hudCoinsEl.innerHTML = `<img class="hud-coin-img" src="assets/royal_gold_coin.png" alt="coin"> ${this.coins}`;
              if (this.hudScoreEl) this.hudScoreEl.textContent = this.score;

              audio.playCoin();
              emitSplatter(c.x, c.y, 0xfacc15, 18);
              showCombatHit('+50 🪙 COIN!', '#facc15');

              // Bonus: 1-UP Extra Life every 20 coins
              if (this.coins % 20 === 0) {
                this.lives = Math.min(5, this.lives + 1);
                if (this.hudLivesEl) this.hudLivesEl.textContent = '❤'.repeat(this.lives);
                audio.playUnlock();
                showCombatHit('★ 1-UP! EXTRA LIFE ★', '#4ade80');
              }
            }
          }
        }

        // Check Enemies Simple Classic Patrol & Platform Ground Contact
        this.enemyMeshes.forEach(em => {
          const e = em.data;
          if (!e.alive) return;

          const distToPeach = Math.hypot(this.peach.x - e.x, this.peach.y - e.y);

          // Directly bound to its assigned platform (guaranteeing exact count and ground contact)
          let currentPlatform = e.platform;
          if (!currentPlatform) {
            for (const p of this.level.platforms) {
              if (e.x + e.w >= p.x && e.x <= p.x + p.w) {
                currentPlatform = p;
                e.platform = p;
                break;
              }
            }
          }

          if (currentPlatform) {
            // Keep the monster firmly touching the top surface of the platform
            e.y = currentPlatform.y - e.h;

            // Slow, human-like deliberate walking pace ("let the monster move with their legs like humans and move slow")
            const isGolem = (e.type === 'golem' || e.type === 'goomba');
            const speed = isGolem ? 0.42 : 0.48;
            e.vx = (e.vx > 0 ? 1 : -1) * speed;

            // Classic authentic arcade colors
            if (em.mesh.userData.cap) em.mesh.userData.cap.material.color.setHex(0x92400e);
            if (em.mesh.userData.shell) {
              em.mesh.userData.shell.material.color.setHex(0x16a34a);
              em.mesh.userData.shell.material.emissiveIntensity = 0.2;
            }

            // Safe boundary on starting platform: Monsters do NOT enter Peach's initial spawn area (x <= 350)
            const isStartingPlat = (currentPlatform === this.level.platforms[0]);
            const minBoundary = isStartingPlat ? Math.max(currentPlatform.x + 8, 350) : (currentPlatform.x + 8);
            const maxBoundary = currentPlatform.x + currentPlatform.w - e.w - 8;

            // Combat & Attack Awareness:
            // When Peach moves towards monsters and is within attack range, they can attack/lunge slowly & menacingly
            if (distToPeach < 140 && this.peach.x > 260) {
              // Face and surge towards Peach for an attack, bounded by safety line
              const attackDir = (this.peach.x > e.x) ? 1 : -1;
              if (attackDir > 0 || e.x > minBoundary + 20) {
                e.vx = attackDir * speed * 1.15;
              }
            }

            // Patrol smoothly across platform and calmly reverse at edges
            e.x += e.vx;
            if (e.x <= minBoundary) {
              e.x = minBoundary;
              e.vx = Math.abs(e.vx);
            } else if (e.x >= maxBoundary) {
              e.x = maxBoundary;
              e.vx = -Math.abs(e.vx);
            }

            // Obstacle Wall Boundaries: monsters bounce when hitting active walls
            if (this.level.walls) {
              for (const wall of this.level.walls) {
                if (wall.hp <= 0) continue;
                if (Math.abs((e.y + e.h / 2) - (wall.y + wall.h / 2)) < 60 &&
                    e.x + e.w >= wall.x - 2 && e.x <= wall.x + wall.w + 2) {
                  e.vx = e.x < wall.x ? -Math.abs(e.vx) : Math.abs(e.vx);
                  e.x += e.vx * 1.5;
                }
              }
            }
          } else {
            // Fallback: move and reverse at level boundaries
            e.x += e.vx;
            if (e.x < 100 || e.x > this.level.length - 200) e.vx *= -1;
          }

          // Humanoid Leg Walk Cycle & Attack Animations:
          // 1. Accumulate distance walked for stride timing
          if (e.walkDistance === undefined) e.walkDistance = (e.animOffset || 0) * 12;
          e.walkDistance += Math.abs(e.vx);

          const isGolem = (e.type === 'golem' || e.type === 'goomba');
          const isAttacking = (distToPeach < 90 && this.peach.x > 260);

          let targetMap;
          const ud = em.mesh.userData;

          if (isAttacking) {
            // Dynamic attack animation when Peach enters combat range
            const attackFrames = isGolem ? monsterTextures.golemAttack : monsterTextures.dragonAttack;
            const atkIdx = Math.floor(this.elapsedTime * 7.5 + (e.animOffset || 0)) % attackFrames.length;
            targetMap = attackFrames[atkIdx];
          } else {
            // Smooth humanoid leg-stepping walk cycle
            const strideScale = 0.13;
            const walkFrames = isGolem ? monsterTextures.golem : monsterTextures.dragon;
            const frameIndex = Math.floor(e.walkDistance * strideScale) % walkFrames.length;
            targetMap = walkFrames[frameIndex] || walkFrames[0];
          }

          if (ud && ud.spriteMat && ud.spriteMat.map !== targetMap) {
            ud.spriteMat.map = targetMap;
          }

          // Facing direction
          if (ud && ud.sprite) {
            ud.sprite.scale.x = (e.vx >= 0) ? 1.0 : -1.0;
          }

          // 3. Humanoid stepping dynamics (weight transfer / foot-plant bobbing & hip sway)
          const stridePhase = e.walkDistance * 0.13 * Math.PI;
          const verticalBob = Math.abs(Math.sin(stridePhase)) * (isGolem ? 0.08 : 0.10);
          const torsoTilt = Math.sin(stridePhase) * (isGolem ? 0.04 : 0.055) * (e.vx >= 0 ? 1 : -1);

          em.mesh.position.set(to3DX(e.x + e.w / 2), to3DY(e.y + e.h) + verticalBob, 0);
          em.mesh.rotation.z = torsoTilt;

          // Crystal Golem purple eye corona pulses with heavy deliberate strides
          if (isGolem && ud && ud.eyeLight) {
            const glowVal = 0.45 + Math.abs(Math.cos(stridePhase)) * 0.4;
            if (ud.eyeLight.material) ud.eyeLight.material.opacity = glowVal;
            else if (ud.eyeLight.intensity !== undefined) ud.eyeLight.intensity = glowVal;
          }
          // Ground shadow scales subtly on foot plant
          if (ud && ud.shadow) {
            const shadowScale = 1.0 + (1.0 - (verticalBob / 0.11)) * 0.12;
            ud.shadow.scale.set(shadowScale, shadowScale, 1.0);
          }

          // Check collision with Peach
          if (
            Math.abs(this.peach.x - e.x) < 34 &&
            Math.abs(this.peach.y - e.y) < 38
          ) {
            // Stomp detection: Coming from above (falling or previous Y was above enemy top)
            const isStomp = (prevY + ph <= e.y + 16) || (this.peach.vy > 0 && this.peach.y + ph <= e.y + e.h * 0.85);
            if (isStomp) {
              // Violent Stomp Defeat: Heavy crunch & customized splatter!
              e.alive = false;
              scene.remove(em.mesh);
              disposeMesh(em.mesh);
              this.peach.vy = -10.5; // Stomp bounce upward!
              this.peach.grounded = false;
              this.peach.jumpsLeft = 1;
              audio.playMonsterDefeat(e.type === 'golem' || e.type === 'goomba');
              const splatterCol = (e.type === 'golem' || e.type === 'goomba') ? 0x06b6d4 : 0xf97316;
              emitSplatter(e.x, e.y, splatterCol, 26);
              this.triggerScreenShake(0.9);
              showCombatHit('CRUSHING STOMP!', '#ff2200');
              this.score += 150;
              if (this.hudScoreEl) this.hudScoreEl.textContent = this.score;
            } else {
              this.handleDamage('enemy');
            }
          }
        });

        // Check Collectibles (Keys)
        if (this.level.keys) {
          this.level.keys.forEach((k, i) => {
            if (!k.collected && Math.abs(this.peach.x - k.x) < 36 && Math.abs(this.peach.y - k.y) < 36) {
              k.collected = true;
              this.forestKeysCollected++;
              if (this.itemMeshes[i]) scene.remove(this.itemMeshes[i].mesh);
              audio.playKeyPickup();
              this.score += 300;
              document.getElementById('hud-score-val').textContent = this.score;
            }
          });
        }

        // Check Cage Rescue Interaction (E, Enter, or walking directly up to touch the cage)
        const cagePromptEl = document.getElementById('cage-prompt');
        if (this.level.cage && !this.level.cage.rescued) {
          const distToCage = Math.abs(this.peach.x - this.level.cage.x);
          const touchingCage = distToCage < 50 && Math.abs(this.peach.y - this.level.cage.y) < 80;

          // Interactive On-Screen Floating Prompt when near Mario's Cage
          if (cagePromptEl) {
            if (distToCage < 150) {
              cagePromptEl.style.display = 'block';
              if (this.currentLevelIndex === 2 && this.forestKeysCollected < 2) {
                cagePromptEl.textContent = `🗝️ KEYS REQUIRED (${this.forestKeysCollected}/2) TO UNLOCK CAGE!`;
                cagePromptEl.style.borderColor = '#f59e0b';
              } else if (this.currentLevelIndex === 4 && this.level.boss && this.level.boss.alive) {
                cagePromptEl.textContent = '⚔️ DEFEAT KING BOWSER FIRST TO FREE MARIO!';
                cagePromptEl.style.borderColor = '#ef4444';
              } else {
                cagePromptEl.textContent = '🔓 PRESS [E] OR TOUCH CAGE TO FREE MARIO!';
                cagePromptEl.style.borderColor = '#38bdf8';
              }
            } else {
              cagePromptEl.style.display = 'none';
            }
          }

          if ((distToCage < 95 && this.keys.interact) || touchingCage) {
            // Require keys in Stage 2
            if (this.currentLevelIndex === 2 && this.forestKeysCollected < 2) {
              const ban = document.getElementById('ban');
              ban.textContent = `KEYS REQUIRED (${this.forestKeysCollected}/2) TO UNLOCK CAGE!`;
              gsap.fromTo(ban, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, onComplete: () => gsap.to(ban, { opacity: 0, delay: 1.2 }) });
            }
            // Require Bowser vanquished in Stage 4
            else if (this.currentLevelIndex === 4 && this.level.boss && this.level.boss.alive) {
              const ban = document.getElementById('ban');
              ban.textContent = 'DEFEAT KING BOWSER FIRST TO FREE MARIO!';
              gsap.fromTo(ban, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, onComplete: () => gsap.to(ban, { opacity: 0, delay: 1.2 }) });
            } else {
              if (cagePromptEl) cagePromptEl.style.display = 'none';
              this.level.cage.rescued = true;
              audio.playUnlock();
              this.score += 1000;
              document.getElementById('hud-score-val').textContent = this.score;

              if (this.cageMesh && this.cageMesh.userData.lock) {
                scene.remove(this.cageMesh.userData.lock);
                gsap.to(this.cageMesh.userData.cageTop.position, { y: 8, duration: 1 });
                if (this.cageMesh.userData.mario) {
                  gsap.to(this.cageMesh.userData.mario.position, { y: 2.7, duration: 0.35, yoyo: true, repeat: 3, ease: 'power1.out' });
                }
              }

              const ban = document.getElementById('ban');
              if (ban) {
                ban.textContent = this.currentLevelIndex < 4 ? 'MARIO RESCUED! ADVANCING TO NEXT REALM...' : 'MARIO FREED! MISSION ACCOMPLISHED!';
                gsap.fromTo(ban, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, onComplete: () => gsap.to(ban, { opacity: 0, delay: 1.4 }) });
              }

              if (this.currentLevelIndex < 4) {
                setTimeout(() => this.loadLevel(this.currentLevelIndex + 1), 1600);
              } else {
                setTimeout(() => this.triggerVictory(), 1600);
              }
            }
            this.keys.interact = false;
          }
        } else if (cagePromptEl && cagePromptEl.style.display !== 'none') {
          cagePromptEl.style.display = 'none';
        }

        // Update Bowser Boss (Stage 4 - Enraged Magma Assault)
        if (this.level.boss && this.level.boss.alive) {
          const b = this.level.boss;
          b.attackTimer = (b.attackTimer || 0) + dt;
          if (b.attackTimer > 1.35) {
            b.attackTimer = 0;
            // Primary Molten Fireball
            this.spawnFireball(b.x - 30, b.y + 20);
            // Rapid Secondary Fireball Barrage
            setTimeout(() => {
              if (b.alive) this.spawnFireball(b.x - 45, b.y + 12);
            }, 260);
          }
        }

        // Update 3D Kinetic Combat Splatter Particles (optimized GPU buffer sync)
        let hasActiveSp = false;
        for (let i = 0; i < SP_COUNT; i++) {
          if (spPos[i * 3] > -500) {
            spPos[i * 3] += spVel[i * 3] * dt;
            spPos[i * 3 + 1] += spVel[i * 3 + 1] * dt;
            spPos[i * 3 + 2] += spVel[i * 3 + 2] * dt;
            spVel[i * 3 + 1] -= 22 * dt; // gravity
            if (spPos[i * 3 + 1] < -2) spPos[i * 3] = -999;
            else hasActiveSp = true;
          }
        }
        if (hasActiveSp || this._hadActiveSp) {
          spGeo.attributes.position.needsUpdate = true;
          this._hadActiveSp = hasActiveSp;
        }

        // Sync Peach 3D Model
        this.syncPeach3D();

        // Responsive Camera Tracking (ultra-smooth follow, expanded POV for obstacles & background)
        const targetCamX = to3DX(this.peach.x + this.peach.w / 2) + 3.8;
        const targetCamY = to3DY(this.peach.y + this.peach.h / 2) + 3.6;
        camera.position.x += (targetCamX - camera.position.x) * 0.45;
        camera.position.y += (targetCamY - camera.position.y) * 0.35;
        camera.position.z = 28;
        this.shakeTrauma = 0;

        camera.lookAt(camera.position.x + (this.camTiltX || 0) * 5, camera.position.y - 0.8 + (this.camTiltY || 0) * 5, 0);

        // Keep scene key light centered with the action
        if (typeof pointLight !== 'undefined' && pointLight) {
          pointLight.position.x = camera.position.x;
          pointLight.position.y = camera.position.y + 4;
        }

        // Mushroom Kingdom Vista Backdrop Parallax Tracking
        if (typeof bgBackdropPlane !== 'undefined' && bgBackdropPlane && bgBackdropPlane.visible) {
          bgBackdropPlane.position.x = camera.position.x * 0.55 + 50;
          bgBackdropPlane.position.y = camera.position.y * 0.35 + 8;
        }


      }

      syncPeach3D() {
        const p3D = this.peachMesh;
        // Position Princess's boot soles exactly on the walking platform surface
        p3D.position.set(to3DX(this.peach.x + this.peach.w / 2), to3DY(this.peach.y + this.peach.h), 0);
        p3D.rotation.y = 0;

        const ud = p3D.userData;
        if (!ud || !ud.spriteMat) return;

        // Flip sprite plane horizontally based on movement direction
        ud.spriteMesh.scale.x = (this.peach.facing >= 0) ? 1.0 : -1.0;

        // Decrement attack animation timers
        if (this.peach.attackTimer > 0) this.peach.attackTimer--;
        if (this.peach.wrenchTimer > 0) this.peach.wrenchTimer--;

        // Determine current active animation frame
        if (this.peach.attackTimer > 0) {
          // Blaster firing muzzle flash / laser discharge (Frame 9 & 8)
          ud.spriteMat.map = (this.peach.attackTimer > 7) ? princessTextures.shoot : princessTextures.aim;
          ud.spriteMesh.position.y = 2.36;
        } else if (this.peach.wrenchTimer > 0) {
          // Melee kinetic strike / wrench attack (Frame 8 & 7)
          ud.spriteMat.map = (this.peach.wrenchTimer > 6) ? princessTextures.aim : princessTextures.crouch;
          ud.spriteMesh.position.y = 2.36;
        } else if (!this.peach.grounded) {
          // Mid-air leaping / jumping pose (Frame 6)
          ud.spriteMat.map = princessTextures.jump;
          ud.spriteMesh.position.y = 2.45;
        } else if (this.peach.state === 'run' && Math.abs(this.peach.vx) > 0.08) {
          // 4-frame dynamic running cycle (Frames 2-5)
          this.peach.walkAnim += Math.max(0.12, Math.abs(this.peach.vx) * 0.045);
          const runCycle = [princessTextures.run1, princessTextures.run2, princessTextures.run3, princessTextures.run4];
          const frameIdx = Math.floor(this.peach.walkAnim * 1.5) % 4;
          ud.spriteMat.map = runCycle[frameIdx];
          ud.spriteMesh.position.y = 2.36;
        } else {
          // Idle stance with breathing hover (Frame 1)
          ud.spriteMat.map = princessTextures.idle;
          ud.spriteMesh.position.y = 2.36 + Math.sin(this.elapsedTime * 4.2) * 0.04;
        }

        if (ud._lastMap !== ud.spriteMat.map) {
          ud._lastMap = ud.spriteMat.map;
        }

        // Dynamic ground contact shadow
        if (ud.shadow) {
          if (this.peach.grounded) {
            ud.shadow.scale.set(1.0, 1.0, 1.0);
            ud.shadow.material.opacity = 0.8;
          } else {
            ud.shadow.scale.set(0.65, 0.65, 0.65);
            ud.shadow.material.opacity = 0.35;
          }
        }

        // Invulnerability Flashing
        if (this.peach.invulnerableTimer > 0) {
          p3D.visible = Math.floor(this.peach.invulnerableTimer / 4) % 2 === 0;
        } else {
          p3D.visible = true;
        }
      }

      performWrenchStrike() {
        this.peach.wrenchTimer = 14;
        const ud = this.peachMesh.userData;
        if (ud && ud.armR) {
          gsap.fromTo(ud.armR.rotation, { x: -Math.PI / 2 }, { x: Math.PI / 3, duration: 0.14, yoyo: true, repeat: 1 });
        }

        // Heavy Wrench Kinetic Strike with Blood-Red Splatter & Screen Shake
        const strikeRange = 65;
        this.enemyMeshes.forEach(em => {
          const e = em.data;
          const inFront = (e.x - this.peach.x) * this.peach.facing >= -20;
          if (e.alive && inFront && Math.abs(this.peach.x - e.x) < strikeRange && Math.abs(this.peach.y - e.y) < 50) {
            e.alive = false;
            scene.remove(em.mesh);
            disposeMesh(em.mesh);
            audio.playMonsterDefeat(e.type === 'golem' || e.type === 'goomba');
            const splatterCol = (e.type === 'golem' || e.type === 'goomba') ? 0x06b6d4 : 0xf97316;
            emitSplatter(e.x, e.y, splatterCol, 28);
            this.triggerScreenShake(1.1);
            showCombatHit('BRUTAL WRENCH CRUNCH!', '#ff0044');
            this.score += 250;
            if (this.hudScoreEl) this.hudScoreEl.textContent = this.score;
          }
        });

        // Hit Bowser
        const bossInFront = this.level.boss ? (this.level.boss.x - this.peach.x) * this.peach.facing >= -20 : false;
        if (this.level.boss && this.level.boss.alive && bossInFront && Math.abs(this.peach.x - this.level.boss.x) < strikeRange + 40) {
          this.level.boss.takeDamage(15);
          this.updateBossHPBar();
          audio.playBossHit();
          audio.playHeavyImpact();
          emitSplatter(this.level.boss.x, this.level.boss.y + 20, 0xff5500, 32);
          this.triggerScreenShake(1.4);
          showCombatHit('CRITICAL BOSS DAMAGE!', '#ff3e14');

          if (!this.level.boss.alive) {
            audio.playVictory();
            emitSplatter(this.level.boss.x, this.level.boss.y + 20, 0xff3e14, 60);
            this.triggerScreenShake(2.0);
            showCombatHit('👑 KING BOWSER VANQUISHED! RESCUE MARIO!', '#ffd700');
            if (this.bossMesh) {
              gsap.to(this.bossMesh.position, { y: -10, duration: 2.0, ease: 'power2.in' });
            }
            const fill = document.getElementById('boss-hp-fill');
            if (fill) fill.style.width = '0%';
            const txt = document.getElementById('boss-hp-text');
            if (txt) txt.textContent = '0 / 140 HP (VANQUISHED)';
          }
        }

        // Permanent Obstacle Walls: Wrench strikes clang against the permanent wall without destroying it
        if (this.level.walls) {
          const pw = this.peach.w;
          this.level.walls.forEach(wall => {
            if (wall.alive === false) return;
            const wallInFront = (wall.x + wall.w / 2 - this.peach.x) * this.peach.facing >= -15;
            const dist = Math.abs((this.peach.x + pw / 2) - (wall.x + wall.w / 2));
            if (wallInFront && dist < strikeRange + wall.w / 2 && Math.abs(this.peach.y - wall.y) < 70) {
              audio.playHeavyImpact();
              audio.tone(200, 0.12, 'sawtooth', 0.18, -40);
              emitSplatter(wall.x + wall.w / 2, wall.y + wall.h / 2, 0x94a3b8, 16);
              this.triggerScreenShake(0.4);
              showCombatHit('🛡️ PERMANENT OBSTACLE!', '#94a3b8');
            }
          });
        }
      }

      fireHeartBlast() {
        // High-performance projectile pooling: cap to 6 active blasts to prevent scene clutter
        if (this.heartBlasts.length >= 6) {
          const oldest = this.heartBlasts.shift();
          if (oldest.mesh) {
            scene.remove(oldest.mesh);
            disposeMesh(oldest.mesh);
          }
        }

        audio.playFireballLaunch();
        this.peach.attackTimer = 16;
        const fbGroup = new THREE.Group();
        const core = new THREE.Mesh(SHARED_HEART_CORE_GEO, SHARED_HEART_CORE_MAT);
        fbGroup.add(core);

        const corona = new THREE.Mesh(SHARED_HEART_CORONA_GEO, SHARED_HEART_CORONA_MAT);
        fbGroup.add(corona);

        // High-tech laser beam streak matching Princess's blaster
        const trail = new THREE.Mesh(SHARED_HEART_TRAIL_GEO, SHARED_HEART_TRAIL_MAT);
        trail.rotation.z = Math.PI / 2;
        trail.position.x = -this.peach.facing * 0.7;
        fbGroup.add(trail);

        fbGroup.position.set(to3DX(this.peach.x + this.peach.facing * 30), to3DY(this.peach.y + 20), 0);
        scene.add(fbGroup);

        this.heartBlasts.push({
          x: this.peach.x + this.peach.facing * 30,
          y: this.peach.y + 20,
          vx: this.peach.facing * 8.5,
          life: 1.8,
          mesh: fbGroup
        });
      }

      spawnFireball(x, y) {
        if (this.fireballs.length >= 5) {
          const oldest = this.fireballs.shift();
          if (oldest.mesh) {
            scene.remove(oldest.mesh);
            disposeMesh(oldest.mesh);
          }
        }
        audio.playDamage();
        const fbMesh = new THREE.Mesh(SHARED_BOWSER_CORE_GEO, SHARED_BOWSER_CORE_MAT);
        fbMesh.position.set(to3DX(x), to3DY(y), 0);
        scene.add(fbMesh);

        this.fireballs.push({
          x: x,
          y: y,
          vx: -5.5,
          life: 3.5,
          mesh: fbMesh
        });
      }
    }
    const engine = new GameEngine();

    /**
     * Unified Keyboard & Gesture Input Management
     * Ensures seamless co-existence of full keyboard controls (WASD, Arrows, Z, X, J, K, E, Space)
     * and single-finger webcam gesture sensor.
     */
    const keyboardState = {
      left: false,
      right: false,
      jump: false,
      wrench: false,
      heart: false,
      interact: false
    };

    function syncEngineKeys() {
      if (!engine || !engine.keys) return;
      const gc = window.gestureController || null;
      const gLeft = gc ? Boolean(gc.isLeft) : false;
      const gRight = gc ? Boolean(gc.isRight) : false;
      const gJump = gc ? Boolean(gc.isJump) : false;

      // Combine Keyboard + Webcam Gestures so keyboard is 100% responsive at all times
      engine.keys.left = Boolean(keyboardState.left || gLeft);
      engine.keys.right = Boolean(keyboardState.right || gRight);
      engine.keys.jump = Boolean(keyboardState.jump || gJump);

      if (keyboardState.wrench) {
        engine.keys.wrench = true;
        keyboardState.wrench = false;
      }
      if (keyboardState.heart) {
        engine.keys.heart = true;
        keyboardState.heart = false;
      }
      engine.keys.interact = Boolean(keyboardState.interact);

      // Keep bottom action pill responsive to keyboard inputs
      if (gc) {
        const gActive = gc.enabled;
        if (!gActive || gc.lostFrameCount >= 3 || gc.smoothX === null) {
          let actionText = gActive ? 'NO HAND  (STOPPED)' : 'NEUTRAL  (STOPPED)';
          if (engine.keys.left && engine.keys.jump) actionText = 'LEFT + JUMP';
          else if (engine.keys.right && engine.keys.jump) actionText = 'RIGHT + JUMP';
          else if (engine.keys.left) actionText = 'LEFT';
          else if (engine.keys.right) actionText = 'RIGHT';
          else if (engine.keys.jump) actionText = 'JUMP';
          else if (engine.keys.wrench) actionText = 'WRENCH ATTACK';
          else if (engine.keys.heart) actionText = 'FIREBALL BLAST';
          gc.updateActionVal(actionText);
        }
      }
    }

    function flushAllKeys() {
      keyboardState.left = false;
      keyboardState.right = false;
      keyboardState.jump = false;
      keyboardState.wrench = false;
      keyboardState.heart = false;
      keyboardState.interact = false;
      if (window.gestureController) {
        window.gestureController.isLeft = false;
        window.gestureController.isRight = false;
        window.gestureController.isJump = false;
      }
      if (engine && engine.keys) {
        engine.keys.left = false;
        engine.keys.right = false;
        engine.keys.jump = false;
        engine.keys.wrench = false;
        engine.keys.heart = false;
        engine.keys.interact = false;
      }
    }

    /**
     * =========================================================================
     * 6. 20-SECOND REVIVAL TRIVIA SYSTEM
     * =========================================================================
     */
    class TriviaRevivalSystem {
      constructor() {
        this.activeQuestion = null;
        this.countdownTimer = null;
        this.timeLeft = 20;
        this.modal = document.getElementById('trivia-modal');
        this.timerNum = document.getElementById('trivia-timer-num');
        this.countdownBar = document.getElementById('trivia-countdown-bar');
        this.qText = document.getElementById('trivia-question-text');
        this.optsGrid = document.getElementById('trivia-options-grid');
        this.catBadge = document.getElementById('trivia-category-badge');
        this.cache = { easy: [], medium: [], hard: [] };
        this.preFetchQuestions();
      }

      async preFetchQuestions() {
        try {
          const [easyRes, medRes, hardRes] = await Promise.all([
            fetch('/api/trivia?difficulty=easy'),
            fetch('/api/trivia?difficulty=medium'),
            fetch('/api/trivia?difficulty=hard')
          ]);
          this.cache.easy = await easyRes.json();
          this.cache.medium = await medRes.json();
          this.cache.hard = await hardRes.json();
        } catch (e) {}
      }

      triggerRevival(stageIdx) {
        engine.state = 'trivia';
        this.answered = false;
        this.timedOut = false;
        const diff = stageIdx === 1 ? 'easy' : stageIdx === 2 ? 'medium' : 'hard';

        let qData = null;
        const list = this.cache[diff];
        if (Array.isArray(list) && list.length > 0) {
          qData = list[Math.floor(Math.random() * list.length)];
        }

        if (!qData) {
          // Instant Fallback question matching user-configured dataset
          qData = {
            id: 999,
            difficulty: diff,
            category: diff === 'easy' ? 'Internet Culture & Memes' : diff === 'medium' ? 'Digital & Computer Symbols' : 'IEEE WIE & Engineering',
            question: diff === 'easy' 
              ? 'What is this viral spinning animal meme called?' 
              : diff === 'medium' 
                ? 'What does this symbol 🔄 usually mean?' 
                : 'Based on the IEEE WIE logo below, what is the correct full form of "WIE"?',
            options: diff === 'easy' 
              ? ['Pedro Raccoon', 'Dancing Dog', 'Banana Cat', 'Vibing Penguin'] 
              : diff === 'medium' 
                ? ['Delete', 'Refresh or reload', 'Download', 'Print'] 
                : ['Women in Electronics', 'Worldwide Institute of Engineers', 'Women in Engineering', 'World of Intelligent Enterprise'],
            correct_answer: diff === 'easy' 
              ? 'Pedro Raccoon' 
              : diff === 'medium' 
                ? 'Refresh or reload' 
                : 'Women in Engineering'
          };
        }

        this.activeQuestion = qData;
        this.renderQuestion(qData);
        this.modal.style.display = 'flex';
        this.startCountdown();
      }

      renderQuestion(q) {
        this.catBadge.textContent = `CATEGORY: ${q.category || 'GENERAL'}`;
        
        // Escape HTML to prevent injection
        const escapeHTML = (str) => {
          const div = document.createElement('div');
          div.textContent = str || '';
          return div.innerHTML;
        };

        // Comprehensive Unicode emoji & symbol pattern covering pictographs, symbols & variation selectors
        const emojiRegex = /(\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?|[\u2190-\u21FF\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF](?:\uFE0F|\uFE0E)?)/gu;
        const formattedQuestion = escapeHTML(q.question).replace(emojiRegex, '<span class="emoji-inline">$1</span>');
        this.qText.innerHTML = formattedQuestion;
        this.optsGrid.innerHTML = '';

        q.options.forEach(opt => {
          const btn = document.createElement('button');
          btn.className = 'trivia-opt-btn';
          btn.dataset.option = opt;
          const formattedOpt = escapeHTML(opt).replace(emojiRegex, '<span class="emoji-inline" style="font-size: 1.25em;">$1</span>');
          btn.innerHTML = `<span style="color: var(--secondary);">▶</span> <span>${formattedOpt}</span>`;
          btn.onclick = () => this.handleAnswer(opt, btn);
          this.optsGrid.appendChild(btn);
        });
      }

      startCountdown() {
        this.timeLeft = 20;
        if (this.countdownBar) this.countdownBar.style.width = '100%';
        if (this.timerNum) this.timerNum.textContent = '20';

        clearInterval(this.countdownTimer);
        const startTime = Date.now();
        const totalMs = 20000;

        this.countdownTimer = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, totalMs - elapsed);
          this.timeLeft = Math.ceil(remaining / 1000);
          if (this.timerNum) this.timerNum.textContent = this.timeLeft;
          if (this.countdownBar) this.countdownBar.style.width = `${(remaining / totalMs) * 100}%`;

          if (remaining <= 0) {
            clearInterval(this.countdownTimer);
            this.handleTimeout();
          }
        }, 100);
      }

      async handleAnswer(chosen, btn) {
        if (this.answered || this.timedOut) return;
        this.answered = true;
        clearInterval(this.countdownTimer);
        this.optsGrid.querySelectorAll('button').forEach(b => b.disabled = true);

        let isCorrect = false;
        try {
          if (navigator.onLine && this.activeQuestion && this.activeQuestion.id && this.activeQuestion.id !== 999 && typeof chosen === 'string' && chosen.trim()) {
            const res = await fetch('/api/trivia/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                questionId: this.activeQuestion.id,
                chosenAnswer: chosen,
                selectedOption: chosen
              })
            });
            const verdict = await res.json();
            isCorrect = verdict.correct;
          } else {
            isCorrect = (chosen.trim().toLowerCase() === (this.activeQuestion.correct_answer || '').trim().toLowerCase());
          }
        } catch (e) {
          isCorrect = (chosen.trim().toLowerCase() === (this.activeQuestion.correct_answer || '').trim().toLowerCase());
        }

        if (isCorrect) {
          if (btn) btn.classList.add('correct');
          audio.playCorrect();
          showCombatHit('CORRECT! REVIVED WITH FULL HEALTH!', '#4ade80');
          setTimeout(() => {
            this.modal.style.display = 'none';
            flushAllKeys();
            engine.state = 'play';
            engine.peach.invulnerableTimer = 160; // Extended invulnerability upon revival
          }, 1000);
        } else {
          if (btn) btn.classList.add('wrong');
          audio.playWrong();
          showCombatHit('WRONG ANSWER! -1 LIFE', '#ef4444');
          setTimeout(() => {
            this.handleTimeout();
          }, 1000);
        }
      }

      handleTimeout() {
        if (this.timedOut) return;
        this.timedOut = true;
        this.answered = true;
        clearInterval(this.countdownTimer);
        this.modal.style.display = 'none';
        flushAllKeys();

        // Deduct 1 life for wrong answer or timeout per specification
        engine.lives--;
        engine.updateLivesHUD();

        if (engine.lives <= 0) {
          engine.state = 'gameover';
          document.getElementById('gameover-score-val').textContent = engine.score;
          document.getElementById('gameover-screen').classList.add('active');
          engine.logRun(false);
        } else {
          // Restart Level from Checkpoint preserving deducted lives
          engine.state = 'play';
          engine.loadLevel(engine.currentLevelIndex, true);
        }
      }
    }
    const triviaRevivalSystem = new TriviaRevivalSystem();

    /**
     * =========================================================================
     * 7. MEDIAPIPE HANDS WEBCAM TRACKING & AUTOMATIC FALLBACK
     * =========================================================================
     */
    

    // Note: GestureController is loaded from gesture.js
    if (typeof window.GestureController !== 'undefined') {
      window.gestureController = new window.GestureController();
    }
    const gestureController = window.gestureController;



    /**
     * =========================================================================
     * 8. UNIFIED KEYBOARD LISTENERS & UI SCREEN CONTROLS
     * =========================================================================
     */
    window.addEventListener('keydown', (e) => {
      // If typing inside an input field (such as callsign), handle Enter and don't trigger game inputs
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (e.key === 'Enter') {
          const startBtn = document.getElementById('btn-start-game');
          if (startBtn) startBtn.click();
        }
        return;
      }

      audio.init();
      const code = e.code;
      const key = (e.key || '').toLowerCase();

      // Close Leaderboard if open on Escape
      if (code === 'Escape' || key === 'escape') {
        const lb = document.getElementById('leaderboard-screen');
        if (lb && lb.classList.contains('active')) {
          lb.classList.remove('active');
          return;
        }
      }

      // Horizontal Run (A / D, Left Arrow / Right Arrow)
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        keyboardState.left = true;
      } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        keyboardState.right = true;
      }

      // Jump (W, Spacebar, Up Arrow)
      if (code === 'KeyW' || code === 'Space' || code === 'ArrowUp' || key === 'w' || key === ' ' || key === 'arrowup') {
        keyboardState.jump = true;
      }

      // Attacks: Wrench Strike (Z / J / F) & Fireball Heart Blast (X / K / Q)
      if (code === 'KeyZ' || code === 'KeyJ' || code === 'KeyF' || key === 'z' || key === 'j' || key === 'f') {
        keyboardState.wrench = true;
      }
      if (code === 'KeyX' || code === 'KeyK' || code === 'KeyQ' || key === 'x' || key === 'k' || key === 'q') {
        keyboardState.heart = true;
      }

      // Interact / Rescue Mario (E / Enter)
      if (code === 'KeyE' || code === 'Enter' || key === 'e' || key === 'enter') {
        keyboardState.interact = true;
      }

      // Pause Menu (Escape / P)
      if (code === 'Escape' || code === 'KeyP' || key === 'escape' || key === 'p') {
        togglePause();
      }

      syncEngineKeys();
    });

    window.addEventListener('keyup', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }

      const code = e.code;
      const key = (e.key || '').toLowerCase();

      // Clear horizontal run
      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        keyboardState.left = false;
      }
      if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        keyboardState.right = false;
      }

      // Clear jump
      if (code === 'KeyW' || code === 'Space' || code === 'ArrowUp' || key === 'w' || key === ' ' || key === 'arrowup') {
        keyboardState.jump = false;
      }

      // Clear interact
      if (code === 'KeyE' || code === 'Enter' || key === 'e' || key === 'enter') {
        keyboardState.interact = false;
      }

      syncEngineKeys();
    });

    // Window blur safety: immediately clear keys so character never gets stuck running
    window.addEventListener('blur', () => {
      flushAllKeys();
    });

    function togglePause() {
      if (engine.state === 'play') {
        engine.state = 'pause';
        flushAllKeys();
        document.getElementById('pause-screen').classList.add('active');
      } else if (engine.state === 'pause') {
        engine.state = 'play';
        flushAllKeys();
        document.getElementById('pause-screen').classList.remove('active');
      }
    }

    // UI Button Handlers
    document.getElementById('btn-start-game').onclick = () => {
      audio.init();
      document.getElementById('title-screen').classList.remove('active');
      engine.state = 'play';
      // Keyboard controls are active by default. Webcam starts ONLY when clicked!
      gestureController.fallbackToKeyboard();
    };

    document.getElementById('btn-resume-game').onclick = () => togglePause();
    document.getElementById('btn-pause').onclick = () => togglePause();

    document.getElementById('btn-restart-game').onclick = () => {
      document.getElementById('pause-screen').classList.remove('active');
      engine.lives = 3;
      engine.score = 0;
      engine.coins = 0;
      document.getElementById('hud-lives-val').textContent = '❤❤❤';
      document.getElementById('hud-score-val').textContent = '0';
      const cVal = document.getElementById('hud-coins-val');
      if (cVal) cVal.innerHTML = '<img class="hud-coin-img" src="assets/royal_gold_coin.png" alt="coin"> 0';
      engine.loadLevel(1);
      engine.state = 'play';
    };

    document.getElementById('btn-gameover-restart').onclick = () => {
      document.getElementById('gameover-screen').classList.remove('active');
      engine.lives = 3;
      engine.score = 0;
      engine.coins = 0;
      document.getElementById('hud-lives-val').textContent = '❤❤❤';
      document.getElementById('hud-score-val').textContent = '0';
      const cVal = document.getElementById('hud-coins-val');
      if (cVal) cVal.innerHTML = '<img class="hud-coin-img" src="assets/royal_gold_coin.png" alt="coin"> 0';
      engine.loadLevel(1);
      engine.state = 'play';
    };

    document.getElementById('btn-victory-restart').onclick = () => {
      document.getElementById('victory-screen').classList.remove('active');
      engine.lives = 3;
      engine.score = 0;
      engine.coins = 0;
      document.getElementById('hud-lives-val').textContent = '❤❤❤';
      document.getElementById('hud-score-val').textContent = '0';
      const cVal = document.getElementById('hud-coins-val');
      if (cVal) cVal.innerHTML = '<img class="hud-coin-img" src="assets/royal_gold_coin.png" alt="coin"> 0';
      engine.loadLevel(1);
      engine.state = 'play';
    };

    // Leaderboard Modal Handlers
    async function loadLeaderboard() {
      const tbody = document.getElementById('leaderboard-body');
      tbody.innerHTML = '<tr><td colspan="5">Loading rankings...</td></tr>';
      document.getElementById('leaderboard-screen').classList.add('active');

      function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str || 'Anonymous';
        return div.innerHTML;
      }

      try {
        const res = await fetch('/api/leaderboard');
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const rankColors = ['#f59e0b', '#cbd5e1', '#d97706']; // Gold, Silver, Bronze
          tbody.innerHTML = rows.slice(0, 15).map((r, i) => {
            const rankColor = i < 3 ? rankColors[i] : 'var(--secondary)';
            const medal = i === 0 ? '👑 ' : (i === 1 ? '🥈 ' : (i === 2 ? '🥉 ' : ''));
            return `
            <tr>
              <td style="color: ${rankColor}; font-weight: 700;">${medal}#${i + 1}</td>
              <td style="color: #f1f5f9; font-weight: 600;">${escapeHTML(r.player_name || r.username)}</td>
              <td style="color: var(--gold); font-weight: 700;">${r.score.toLocaleString()}</td>
              <td style="color: #38bdf8;">Stage ${r.level_reached}</td>
              <td style="color: #94a3b8;">${r.duration}s</td>
            </tr>`;
          }).join('');
        } else {
          tbody.innerHTML = '<tr><td colspan="5">No runs logged yet. Be the first!</td></tr>';
        }
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5">Leaderboard offline. Local runs queued.</td></tr>';
      }
    }

    document.getElementById('btn-show-leaderboard').onclick = loadLeaderboard;
    document.getElementById('btn-pause-lb').onclick = loadLeaderboard;
    document.getElementById('btn-close-lb').onclick = () => {
      document.getElementById('leaderboard-screen').classList.remove('active');
    };

    // Calibration Drawer & Cam Toggle
    document.getElementById('btn-toggle-cam').onclick = () => {
      if (gestureController.enabled) {
        gestureController.fallbackToKeyboard();
      } else {
        gestureController.init();
      }
    };

    document.getElementById('btn-toggle-audio').onclick = (e) => {
      const isMuted = audio.toggleMute();
      e.target.textContent = isMuted ? '🔇 UNMUTE' : '🔊 MUTE';
    };

    /**
     * =========================================================================
     * 9. MAIN GAME LOOP (Smooth 60 FPS Fixed-Step WebGL Execution)
     * =========================================================================
     */
    let lastTime = performance.now();
    const FIXED_STEP = 1 / 60;
    let accumulator = 0;

    function animate(currentTime) {
      requestAnimationFrame(animate);
      const now = (typeof currentTime === 'number' && currentTime > 0) ? currentTime : performance.now();
      let dt = (now - lastTime) / 1000;
      if (dt > 0.1) dt = 0.1;
      lastTime = now;

      accumulator = Math.min(accumulator + dt, FIXED_STEP * 3);
      let updates = 0;
      while (accumulator >= FIXED_STEP && updates < 3) {
        engine.update(FIXED_STEP);
        accumulator -= FIXED_STEP;
        updates++;
      }

      // Animate Obstacle Wall Hazard Warning Beacons
      if (engine.wallMeshes) {
        const beaconScale = 1 + Math.sin(now * 0.008) * 0.18;
        for (let i = 0; i < engine.wallMeshes.length; i++) {
          const wm = engine.wallMeshes[i];
          if (wm.mesh && wm.mesh.userData && wm.mesh.userData.beacon) {
            wm.mesh.userData.beacon.scale.set(beaconScale, 1, beaconScale);
          }
        }
      }

      // Animate Prince Mario idle breathing inside cage
      if (engine.cageMesh && engine.cageMesh.userData && engine.cageMesh.userData.mario) {
        if (!engine.level.cage || !engine.level.cage.rescued) {
          engine.cageMesh.userData.mario.position.y = 1.9 + Math.sin(now * 0.0035) * 0.04;
        }
      }

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

    // Audio unlock listener on first user interaction
    window.addEventListener('pointerdown', () => {
      audio.init();
      if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    }, { once: true });

    // Global Test & Inspection Hooks
    window.__GAME_ENGINE__ = engine;
    window.__AUDIO__ = audio;
    window.__TRIVIA__ = triviaRevivalSystem;
    window.__GESTURE__ = gestureController;
    window.__GESTURE_CONTROLLER__ = gestureController;