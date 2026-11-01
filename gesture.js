(function() {
  'use strict';

  class GestureController {
      constructor() {
        this.enabled = false;
        this.video = document.getElementById('webcam-video');
        this.landmarkCanvas = document.getElementById('landmark-canvas');
        this.ctx = this.landmarkCanvas ? this.landmarkCanvas.getContext('2d') : null;
        this.camera = null;
        this.hands = null;
        this.isProcessing = false;

        // Exponential Moving Average (EMA) Filter states for single-finger tracking
        this.smoothX = null;
        this.smoothY = null;
        this.smoothRelX = null;
        this.prevRawY = null;
        this.flickUpTimer = 0;

        // Hysteresis states (prevents boundary flickering / stutter)
        this.isLeft = false;
        this.isRight = false;
        this.isJump = false;

        // Snap tracking & burst animation
        this.wasSnapping = false;
        this.lastSnapTime = 0;
        this.snapBurstTimer = 0;
        this.snapX = 0;
        this.snapY = 0;

        // Calibration Thresholds (Optimized for quick, smooth response and pinpoint landing)
        this.deadzone = 0.09;
        this.jumpThreshold = 0.38;
        this.snapThreshold = 0.065;

        this.setupTuningListeners();
        this.setupUIButtons();
        this.fallbackToKeyboard();
      }

      setupUIButtons() {
        const closeBtn = document.getElementById('pip-close-btn');
        const turnOffBtn = document.getElementById('pip-active-toggle-btn');
        const camStateHeader = document.getElementById('pip-header-cam-state');

        // Close button inside PIP header closes webcam and hides card for fullscreen
        if (closeBtn) {
          closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fallbackToKeyboard();
          };
        }

        if (turnOffBtn) {
          turnOffBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fallbackToKeyboard();
          };
        }

        if (camStateHeader) {
          camStateHeader.style.cursor = 'pointer';
          camStateHeader.title = 'Click to turn off camera and return to fullscreen';
          camStateHeader.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.enabled) {
              this.fallbackToKeyboard();
            } else {
              this.init();
            }
          };
        }
      }

      setupTuningListeners() {
        const sDz = document.getElementById('slider-deadzone');
        const sJp = document.getElementById('slider-jump');
        const sPi = document.getElementById('slider-pinch');
        if (sDz) sDz.oninput = (e) => { this.deadzone = parseFloat(e.target.value); document.getElementById('lbl-deadzone').textContent = this.deadzone; this.updateHUDOverlay(); };
        if (sJp) sJp.oninput = (e) => { this.jumpThreshold = parseFloat(e.target.value); document.getElementById('lbl-jump').textContent = this.jumpThreshold; this.updateHUDOverlay(); };
        if (sPi) sPi.oninput = (e) => { this.snapThreshold = parseFloat(e.target.value); document.getElementById('lbl-pinch').textContent = this.snapThreshold; };
      }

      updateHUDOverlay(isOn) {
        if (!this._hudEl) this._hudEl = document.getElementById('pip-hud-overlay');
        if (!this._jumpLineEl) this._jumpLineEl = document.getElementById('pip-hud-jumpline');
        if (!this._centerBoxEl) this._centerBoxEl = document.getElementById('pip-hud-centerbox');
        if (!this._hudEl) return;
        if (isOn !== undefined) {
          this._hudEl.style.display = isOn ? 'block' : 'none';
        }
        const jumpPct = (this.jumpThreshold || 0.38) * 100;
        const dzSpan = (this.deadzone || 0.08) * 100;
        if (this._jumpLineEl) this._jumpLineEl.style.top = `${jumpPct}%`;
        if (this._centerBoxEl) {
          this._centerBoxEl.style.top = `${jumpPct}%`;
          this._centerBoxEl.style.left = `${50 - dzSpan}%`;
          this._centerBoxEl.style.width = `${dzSpan * 2}%`;
        }
      }

      drawGuides() {
        // Overlay guide styling is event-driven; no DOM reflow per frame
      }

      updateCamStateHeader(line1, line2, isActive) {
        if (!this._camStateEl) this._camStateEl = document.getElementById('pip-header-cam-state');
        if (this._camStateEl) {
          const key = `${line1}|${line2}|${isActive}`;
          if (this._lastCamStateKey !== key) {
            this._lastCamStateKey = key;
            if (isActive) this._camStateEl.classList.add('active');
            else this._camStateEl.classList.remove('active');
            this._camStateEl.innerHTML = `<span>${line1}</span><span>${line2}</span>`;
          }
        }
      }

      setCameraUIState(isOn) {
        const pip = document.getElementById('webcam-pip');
        const dot = document.getElementById('pip-header-dot');
        const overlay = document.getElementById('pip-offline-overlay');
        const turnOffBtn = document.getElementById('pip-active-toggle-btn');
        const actionVal = document.getElementById('pip-action-val');
        const toggleBtn = document.getElementById('btn-toggle-cam');

        if (isOn) {
          if (pip) {
            pip.style.display = 'flex'; // Appears in top-right corner when activated
            pip.classList.add('camera-active');
            pip.style.cursor = 'default';
            pip.title = 'Camera Active (Use gestures or click GESTURE ON/OFF to hide and return to keyboard)';
          }
          if (toggleBtn) {
            toggleBtn.classList.add('active');
            toggleBtn.innerHTML = '📷 GESTURE: ON';
            toggleBtn.style.borderColor = '#10b981';
            toggleBtn.style.color = '#10b981';
            toggleBtn.style.boxShadow = '0 0 14px rgba(16, 185, 129, 0.5)';
          }
          if (dot) dot.classList.add('active');
          this.updateCamStateHeader('No', 'Hand', false);
          if (overlay) overlay.style.display = 'none';
          if (turnOffBtn) turnOffBtn.style.display = 'none';
          if (actionVal) actionVal.textContent = 'NO HAND  (STOPPED)';
          this.updateHUDOverlay(true);
        } else {
          if (pip) {
            pip.style.display = 'none'; // Completely hidden for unobstructed full-screen experience!
            pip.classList.remove('camera-active');
          }
          if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.innerHTML = '📷 GESTURE ON/OFF';
            toggleBtn.style.borderColor = '';
            toggleBtn.style.color = '';
            toggleBtn.style.boxShadow = '';
          }
          if (dot) dot.classList.remove('active');
          this.updateCamStateHeader('Camera', 'Off', false);
          if (overlay) overlay.style.display = 'none';
          if (turnOffBtn) turnOffBtn.style.display = 'none';
          if (actionVal) actionVal.textContent = 'NEUTRAL  (STOPPED)';
          this.updateHUDOverlay(false);
          if (this.ctx && this.landmarkCanvas) {
            this.ctx.clearRect(0, 0, this.landmarkCanvas.width, this.landmarkCanvas.height);
          }
        }
      }

      updateActionVal(text) {
        if (!this._actionValEl) this._actionValEl = document.getElementById('pip-action-val');
        if (this._actionValEl && this._lastActionText !== text) {
          this._actionValEl.textContent = text;
          this._lastActionText = text;
        }
      }

      updatePipStatus(text) {
        this.updateActionVal(text);
      }

      async init() {
        this.enabled = true;
        this.setCameraUIState(true);
        this.updateBadge('CONNECTING SENSOR...', 'badge-input');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          this.fallbackToKeyboard();
          return;
        }

        try {
          // Probe camera access safely with standard robust constraints
          let stream = null;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 480, max: 640 },
                height: { ideal: 360, max: 480 },
                frameRate: { ideal: 60, min: 30 },
                facingMode: 'user'
              }
            });
          } catch (e1) {
            stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
          }

          if (!stream) {
            this.fallbackToKeyboard();
            return;
          }

          if (!window.Hands) {
            for (let retry = 0; retry < 12; retry++) {
              await new Promise(r => setTimeout(r, 200));
              if (window.Hands) break;
            }
          }

          if (!window.Hands) {
            if (stream) stream.getTracks().forEach(t => t.stop());
            this.fallbackToKeyboard();
            return;
          }

          if (!this.enabled) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          this.video.srcObject = stream;
          this.video.muted = true;
          this.video.playsInline = true;
          await this.video.play().catch(() => {});

          if (!this.enabled) {
            stream.getTracks().forEach(t => t.stop());
            this.video.srcObject = null;
            return;
          }

          if (!this.hands) {
            this.hands = new Hands({
              locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            // modelComplexity: 1 provides superior hand & finger detection accuracy
            this.hands.setOptions({
              maxNumHands: 1,
              modelComplexity: 1,
              minDetectionConfidence: 0.3,
              minTrackingConfidence: 0.3
            });
            this.hands.onResults((results) => this.onResults(results));
          }

          // Direct high-efficiency frame delivery loop
          if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
          let lastFrameSent = 0;
          const processFrame = async () => {
            if (!this.enabled) return;
            const now = performance.now();
            if (this.video.readyState >= 2 && !this.isProcessing && (now - lastFrameSent >= 28)) {
              lastFrameSent = now;
              this.isProcessing = true;
              try {
                await this.hands.send({ image: this.video });
              } catch (err) {
              } finally {
                this.isProcessing = false;
              }
            }
            if (this.enabled) {
              this.animFrameId = requestAnimationFrame(processFrame);
            }
          };
          this.animFrameId = requestAnimationFrame(processFrame);

          // Keep dummy camera object for tests that check gestureController.camera
          this.camera = {
            start: async () => {},
            stop: async () => {
              if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
              this.animFrameId = null;
            }
          };

          this.updateBadge('FINGER SENSOR ACTIVE', 'badge-online');
          this.setCameraUIState(true);
        } catch (e) {
          this.fallbackToKeyboard();
        }
      }

      fallbackToKeyboard() {
        this.enabled = false;
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
        if (this.camera && typeof this.camera.stop === 'function') {
          this.camera.stop().catch(() => {});
          this.camera = null;
        }
        if (this.video && this.video.srcObject) {
          this.video.srcObject.getTracks().forEach(t => t.stop());
          this.video.srcObject = null;
        }

        // Clean up keys and tracking state
        this.isLeft = false;
        this.isRight = false;
        this.isJump = false;
        syncEngineKeys();
        this.smoothX = null;
        this.smoothY = null;
        this.smoothRelX = null;
        this.prevRawY = null;
        this.flickUpTimer = 0;

        if (this.ctx && this.landmarkCanvas) {
          this.ctx.clearRect(0, 0, this.landmarkCanvas.width, this.landmarkCanvas.height);
        }

        this.updateBadge('KEYBOARD ACTIVE', 'badge-input');
        this.setCameraUIState(false);
      }

      updateBadge(text, cls) {
        const b = document.getElementById('hud-input-badge');
        if (b) {
          b.className = `badge-status ${cls}`;
          b.textContent = text;
        }
      }

      onResults(results) {
        if (!this.ctx || !this.landmarkCanvas) return;
        // Ignore stray in-flight frames if camera has been switched off
        if (!this.enabled && (!results || !results.multiHandLandmarks || results.multiHandLandmarks.length === 0)) {
          return;
        }
        const vw = this.video.videoWidth || 320;
        const vh = this.video.videoHeight || 240;
        if (this.landmarkCanvas.width !== vw) this.landmarkCanvas.width = vw;
        if (this.landmarkCanvas.height !== vh) this.landmarkCanvas.height = vh;

        this.ctx.clearRect(0, 0, this.landmarkCanvas.width, this.landmarkCanvas.height);
        this.drawGuides();

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
          // Debounce lost frames to prevent single-frame lighting/blur stutter
          this.lostFrameCount = (this.lostFrameCount || 0) + 1;
          if (this.lostFrameCount >= 3) {
            this.isLeft = false;
            this.isRight = false;
            this.isJump = false;
            syncEngineKeys();
            this.smoothX = null;
            this.smoothY = null;
            this.smoothRelX = null;
            this.prevRawY = null;
            this.flickUpTimer = 0;
            const dot = document.getElementById('pip-header-dot');
            if (dot && !dot.classList.contains('active')) dot.classList.add('active');
            this.updateCamStateHeader('No', 'Hand', false);
            if (!keyboardState.left && !keyboardState.right && !keyboardState.jump) {
              this.updateActionVal('NO HAND  (STOPPED)');
            }
          }
          return;
        }
        this.lostFrameCount = 0;

        const dot = document.getElementById('pip-header-dot');
        if (dot && !dot.classList.contains('active')) dot.classList.add('active');
        this.updateCamStateHeader('Finger', 'Active', true);

        const hand = results.multiHandLandmarks[0];
        const wrist = hand[0];
        const thumbTip = hand[4];
        const indexPip = hand[6];
        const indexTip = hand[8]; // SINGLE FINGER TIP
        const middleTip = hand[12];
        const ringTip = hand[16];
        const pinkyTip = hand[20];

        // Intelligently select active pointing fingertip (index by default, or middle if user points with it)
        let activeTip = indexTip;
        if (middleTip && indexPip && (indexTip.y > indexPip.y + 0.04) && (middleTip.y < hand[10].y)) {
          activeTip = middleTip;
        }

        // Raw mirrored coordinates (0.0 = left of mirrored screen, 1.0 = right of mirrored screen)
        const rawMirroredX = 1.0 - activeTip.x;
        const rawY = activeTip.y;
        const rawRelX = (1.0 - activeTip.x) - (1.0 - wrist.x); // Finger offset relative to wrist

        // Exponential Moving Average (EMA) Filter for smooth zero-jitter finger tracking
        if (this.smoothX === null) {
          this.smoothX = rawMirroredX;
          this.smoothY = rawY;
          this.smoothRelX = rawRelX;
        } else {
          const alpha = 0.85; // Snappy, ultra-low-latency tracking
          this.smoothX += alpha * (rawMirroredX - this.smoothX);
          this.smoothY += alpha * (rawY - this.smoothY);
          this.smoothRelX += alpha * (rawRelX - this.smoothRelX);
        }

        // Fast upward motion detection
        const dY = this.prevRawY !== null ? (rawY - this.prevRawY) : 0;
        this.prevRawY = rawY;
        if (dY < -0.04) {
          this.flickUpTimer = 6;
        } else if (this.flickUpTimer > 0) {
          this.flickUpTimer--;
        }

        // =====================================================================
        // SINGLE FINGER GESTURE DETECTION (Left, Right, Jump, Snap Fireball)
        // Rule: In the green block, DO NOT move (no left/right) and DO NOT jump.
        // Inside the green block, ONLY blast when snapping!
        // =====================================================================
        const deadzoneSpan = this.deadzone || 0.09;
        const leftBound = 0.5 - deadzoneSpan;   // Left edge of green block (e.g. 0.41)
        const rightBound = 0.5 + deadzoneSpan;  // Right edge of green block (e.g. 0.59)

        // The green block spans horizontally [leftBound, rightBound] and below the cyan jump line (>= jumpThreshold)
        const inGreenBlockH = (this.smoothX >= leftBound && this.smoothX <= rightBound);
        const inGreenBlockV = (this.smoothY >= this.jumpThreshold);
        const inGreenBlock = inGreenBlockH && inGreenBlockV;

        if (inGreenBlock) {
          // Strictly disabled while inside the green neutral block: No movement, no jump!
          this.isLeft = false;
          this.isRight = false;
          this.isJump = false;
        } else {
          // 1 & 2. FINGER LEFT & RIGHT (Clean, responsive steering with zero overshoot on platform landing)
          if (this.isLeft) {
            if (this.smoothX > leftBound + 0.02) {
              this.isLeft = false;
            }
          } else {
            if (this.smoothX < leftBound) {
              this.isLeft = true;
              this.isRight = false;
            }
          }

          if (this.isRight) {
            if (this.smoothX < rightBound - 0.02) {
              this.isRight = false;
            }
          } else {
            if (this.smoothX > rightBound) {
              this.isRight = true;
              this.isLeft = false;
            }
          }

          // Centered horizontally: immediately halt horizontal drift so Peach drops straight down onto platforms
          if (inGreenBlockH) {
            this.isLeft = false;
            this.isRight = false;
          }

          // 3. FINGER UP -> JUMP (Only when finger physically moves ABOVE the cyan jump line)
          const isAboveJumpLine = (this.smoothY < this.jumpThreshold);
          if (this.isJump) {
            if (!isAboveJumpLine && this.smoothY > this.jumpThreshold + 0.015) {
              this.isJump = false;
            }
          } else {
            if (isAboveJumpLine) {
              this.isJump = true;
            }
          }
        }

        syncEngineKeys();

        // 4. FINGER SNAP -> BLAST FIREBALL (Works anytime, including inside the green block!)
        const snapDistMiddle = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
        const snapDistIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const minSnapDist = Math.min(snapDistMiddle, snapDistIndex);

        const isSnapping = minSnapDist < this.snapThreshold;
        const now = performance.now();

        if (isSnapping && !this.wasSnapping && (now - this.lastSnapTime > 260)) {
          this.lastSnapTime = now;
          engine.keys.heart = true; // Blast Fireball!

          // Animated snap shockwave burst positioned exactly at contact point
          this.snapBurstTimer = 14;
          const snapRefX = (snapDistIndex < snapDistMiddle) ? indexTip.x : middleTip.x;
          const snapRefY = (snapDistIndex < snapDistMiddle) ? indexTip.y : middleTip.y;
          this.snapX = ((thumbTip.x + snapRefX) / 2) * this.landmarkCanvas.width;
          this.snapY = ((thumbTip.y + snapRefY) / 2) * this.landmarkCanvas.height;
        }
        this.wasSnapping = isSnapping;

        // =====================================================================
        // VISUAL FEEDBACK: CYBER HAND SKELETON + SINGLE FINGER POINTER RETICLE
        // =====================================================================
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4],
          [0, 5], [5, 6], [6, 7], [7, 8],
          [5, 9], [9, 10], [10, 11], [11, 12],
          [9, 13], [13, 14], [14, 15], [15, 16],
          [13, 17], [17, 18], [18, 19], [19, 20],
          [0, 17]
        ];

        this.ctx.save();
        this.ctx.strokeStyle = inGreenBlock ? 'rgba(34, 197, 94, 0.45)' : 'rgba(255, 42, 133, 0.45)';
        this.ctx.lineWidth = 1.6;
        for (let c = 0; c < connections.length; c++) {
          const p1 = hand[connections[c][0]], p2 = hand[connections[c][1]];
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x * vw, p1.y * vh);
          this.ctx.lineTo(p2.x * vw, p2.y * vh);
          this.ctx.stroke();
        }

        this.ctx.fillStyle = inGreenBlock ? '#86efac' : '#ff85be';
        for (let j = 0; j < hand.length; j++) {
          const pt = hand[j];
          this.ctx.beginPath();
          this.ctx.arc(pt.x * vw, pt.y * vh, 2.2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();

        const px = activeTip.x * this.landmarkCanvas.width;
        const py = activeTip.y * this.landmarkCanvas.height;

        // Dynamic cyber reticle color based on active state & neutral zone
        let reticleColor = inGreenBlock ? '#22c55e' : '#ff2a85';
        let reticleCore = inGreenBlock ? '#86efac' : '#ff85be';
        if (this.snapBurstTimer > 0) {
          reticleColor = '#ffd700';
          reticleCore = '#fff59d';
        }

        this.ctx.save();
        // Outer glowing cyber reticle ring (high-efficiency zero-blur GPU composition)
        this.ctx.beginPath();
        this.ctx.arc(px, py, 18, 0, Math.PI * 2);
        this.ctx.strokeStyle = reticleColor + '44';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(px, py, 14, 0, Math.PI * 2);
        this.ctx.strokeStyle = reticleColor;
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        // 4 Precision crosshair ticks
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(px, py - 19); this.ctx.lineTo(px, py - 14);
        this.ctx.moveTo(px, py + 14); this.ctx.lineTo(px, py + 19);
        this.ctx.moveTo(px - 19, py); this.ctx.lineTo(px - 14, py);
        this.ctx.moveTo(px + 14, py); this.ctx.lineTo(px + 19, py);
        this.ctx.stroke();

        // Glowing center core dot on index fingertip
        this.ctx.fillStyle = reticleCore;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Snap shockwave burst effect
        if (this.snapBurstTimer > 0) {
          this.snapBurstTimer--;
          const radius = (14 - this.snapBurstTimer) * 4.5;
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.arc(this.snapX, this.snapY, radius, 0, Math.PI * 2);
          this.ctx.strokeStyle = `rgba(255, 215, 0, ${this.snapBurstTimer / 14})`;
          this.ctx.lineWidth = 3.5;
          this.ctx.stroke();
          this.ctx.restore();
        }

        // Update Bottom Action Pill text matching reference specifications
        let actionText = 'NEUTRAL  (STOPPED)';
        if (engine.keys.heart || this.snapBurstTimer > 0) {
          actionText = 'SNAP (FIREBALL)';
        } else if (engine.keys.wrench) {
          actionText = 'WRENCH ATTACK';
        } else if (inGreenBlock && !keyboardState.left && !keyboardState.right && !keyboardState.jump) {
          actionText = 'NEUTRAL  (STOPPED)';
        } else if (engine.keys.left && engine.keys.jump) {
          actionText = 'LEFT + JUMP';
        } else if (engine.keys.right && engine.keys.jump) {
          actionText = 'RIGHT + JUMP';
        } else if (engine.keys.left) {
          actionText = 'LEFT';
        } else if (engine.keys.right) {
          actionText = 'RIGHT';
        } else if (engine.keys.jump) {
          actionText = 'JUMP';
        }

        this.updateActionVal(actionText);
      }
    }
    window.GestureController = GestureController;
  })();