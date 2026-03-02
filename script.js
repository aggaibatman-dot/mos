/* ══════════════════════════════════════════════════════════════
   MOSQUITO KINGDOM — script.js
   Interactive features, particle system, animations, Easter eggs
   ══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ═══════════════════════════════════════════
       CONSTANTS & STATE
       ═══════════════════════════════════════════ */
    const COLORS = {
        cyan: '#00f5ff',
        gold: '#ffd700',
        crimson: '#ff2e63',
        white: '#f0e6ff',
    };

    const state = {
        mouseX: window.innerWidth / 2,
        mouseY: window.innerHeight / 2,
        kingdomEntered: false,
        mPressCount: 0,
        mPressTimer: null,
        stormActive: false,
        soundOn: false,
        biteCount: 0,
        bowCount: 0,
        worshipPoints: 0,
        catchCount: 0,
        missCount: 0,
    };

    /* ═══════════════════════════════════════════
       UTILITY FUNCTIONS
       ═══════════════════════════════════════════ */
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);
    const rand = (min, max) => Math.random() * (max - min) + min;
    const isMobile = () => window.innerWidth <= 768 || 'ontouchstart' in window;

    /* ═══════════════════════════════════════════
       PAGE LOADER
       ═══════════════════════════════════════════ */
    function initLoader() {
        const loader = $('#page-loader');
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('loaded');
                startHeroAnimation();
            }, 2200);
        });
    }

    /* ═══════════════════════════════════════════
       HERO INTRO ANIMATION
       ═══════════════════════════════════════════ */
    function startHeroAnimation() {
        const items = $$('.hero-content .anim-hidden');
        items.forEach((el, i) => {
            setTimeout(() => {
                el.classList.add('anim-visible');
            }, 400 + i * 400);
        });
    }

    /* ═══════════════════════════════════════════
       CURSOR GLOW (Desktop only)
       ═══════════════════════════════════════════ */
    function initCursorGlow() {
        if (isMobile()) return;
        const glow = $('#cursor-glow');
        let posX = state.mouseX, posY = state.mouseY;

        document.addEventListener('mousemove', (e) => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
        });

        function updateGlow() {
            posX += (state.mouseX - posX) * 0.08;
            posY += (state.mouseY - posY) * 0.08;
            glow.style.left = posX + 'px';
            glow.style.top = posY + 'px';
            requestAnimationFrame(updateGlow);
        }
        updateGlow();
    }

    /* ═══════════════════════════════════════════
       PARTICLE / FIREFLY CANVAS
       ═══════════════════════════════════════════ */
    function initParticles() {
        const canvas = $('#particle-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = isMobile() ? 40 : 100;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = rand(0, canvas.width);
                this.y = rand(0, canvas.height);
                this.size = rand(1, 3);
                this.speedX = rand(-0.3, 0.3);
                this.speedY = rand(-0.3, 0.3);
                this.opacity = rand(0.2, 0.7);
                this.fadeDir = rand(0, 1) > 0.5 ? 1 : -1;
                this.fadeSpeed = rand(0.003, 0.012);
                this.color = [COLORS.cyan, COLORS.gold, COLORS.crimson, COLORS.white][Math.floor(rand(0, 4))];
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity += this.fadeDir * this.fadeSpeed;
                if (this.opacity >= 0.8) this.fadeDir = -1;
                if (this.opacity <= 0.1) this.fadeDir = 1;
                if (this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10) {
                    this.reset();
                }
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = this.color;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < particleCount; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    }

    /* ═══════════════════════════════════════════
       INTERACTIVE MOSQUITO SWARM (cursor follower)
       ═══════════════════════════════════════════ */
    function initMosquitoSwarm() {
        const swarmCount = isMobile() ? 8 : 20;
        const swarm = [];
        const container = document.body;

        class Mosquito {
            constructor() {
                this.el = document.createElement('div');
                this.el.className = 'swarm-mosquito';
                this.el.innerHTML = '🦟';
                this.el.style.cssText = `
                    position: fixed;
                    font-size: ${rand(10, 18)}px;
                    pointer-events: none;
                    z-index: 9000;
                    transition: none;
                    will-change: transform;
                    filter: drop-shadow(0 0 4px rgba(0,245,255,0.5));
                    opacity: 0;
                `;
                container.appendChild(this.el);
                this.x = rand(0, window.innerWidth);
                this.y = rand(0, window.innerHeight);
                this.scattered = false;
                this.scatterVx = 0;
                this.scatterVy = 0;
                this.scatterTimer = 0;
                this.angle = rand(0, Math.PI * 2);
                this.orbitRadius = rand(20, 80);
                this.orbitSpeed = rand(0.01, 0.04);
                this.visible = false;
            }

            update(targetX, targetY) {
                if (this.scattered && this.scatterTimer > 0) {
                    this.x += this.scatterVx;
                    this.y += this.scatterVy;
                    this.scatterVx *= 0.96;
                    this.scatterVy *= 0.96;
                    this.scatterTimer--;
                    if (this.scatterTimer <= 0) this.scattered = false;
                } else {
                    this.angle += this.orbitSpeed;
                    const tx = targetX + Math.cos(this.angle) * this.orbitRadius;
                    const ty = targetY + Math.sin(this.angle) * this.orbitRadius;
                    this.x += (tx - this.x) * 0.04;
                    this.y += (ty - this.y) * 0.04;
                }

                if (!this.visible) { this.el.style.opacity = '0.8'; this.visible = true; }

                const rotation = Math.atan2(targetY - this.y, targetX - this.x) * (180 / Math.PI);
                this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${rotation}deg)`;
            }

            scatter() {
                this.scattered = true;
                this.scatterVx = rand(-12, 12);
                this.scatterVy = rand(-12, 12);
                this.scatterTimer = Math.floor(rand(30, 60));
            }
        }

        for (let i = 0; i < swarmCount; i++) swarm.push(new Mosquito());

        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            state.mouseX = touch.clientX;
            state.mouseY = touch.clientY;
        }, { passive: true });

        document.addEventListener('click', () => { swarm.forEach((m) => m.scatter()); });
        document.addEventListener('touchstart', () => { swarm.forEach((m) => m.scatter()); }, { passive: true });

        function animateSwarm() {
            swarm.forEach((m) => m.update(state.mouseX, state.mouseY));
            requestAnimationFrame(animateSwarm);
        }
        animateSwarm();
    }

    /* ═══════════════════════════════════════════
       ENTER THE KINGDOM BUTTON
       ═══════════════════════════════════════════ */
    function initEnterKingdom() {
        const btn = $('#enter-kingdom-btn');
        const overlay = $('#welcome-overlay');

        btn.addEventListener('click', () => {
            if (state.kingdomEntered) return;
            state.kingdomEntered = true;

            btn.classList.add('ripple-active');

            const hero = $('#hero');
            hero.style.transition = 'transform 1.5s ease, filter 1.5s ease';
            hero.style.transform = 'scale(1.2)';
            hero.style.filter = 'brightness(0.3) blur(4px)';

            setTimeout(() => { overlay.classList.remove('hidden'); }, 800);

            setTimeout(() => {
                overlay.classList.add('fade-out');
                hero.style.transform = 'scale(1)';
                hero.style.filter = 'none';
            }, 4000);

            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.classList.remove('fade-out');
                $('#dashboard').scrollIntoView({ behavior: 'smooth' });
                // Show welcome toast
                showToast('👑 Royal Announcement', 'The Mosquito Queen has entered the Kingdom!');
            }, 5200);
        });
    }

    /* ═══════════════════════════════════════════
       SCROLL REVEAL (IntersectionObserver)
       ═══════════════════════════════════════════ */
    function initScrollReveal() {
        const reveals = $$('.scroll-reveal');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        const statFills = entry.target.querySelectorAll('.stat-bar-fill');
                        statFills.forEach((bar) => { bar.style.width = bar.dataset.width + '%'; });
                        const statVal = entry.target.querySelector('.stat-value');
                        if (statVal && statVal.dataset.target) {
                            animateCounter(statVal, parseInt(statVal.dataset.target));
                        }
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );
        reveals.forEach((el) => observer.observe(el));

        const dashPanel = $('#dashboard .dashboard-card');
        if (dashPanel) {
            const panelObs = new IntersectionObserver((entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        const fills = dashPanel.querySelectorAll('.stat-bar-fill');
                        fills.forEach((bar) => { bar.style.width = bar.dataset.width + '%'; });
                    }
                });
            }, { threshold: 0.2 });
            panelObs.observe(dashPanel);
        }
    }

    /* ═══════════════════════════════════════════
       ANIMATED COUNTER
       ═══════════════════════════════════════════ */
    function animateCounter(el, target) {
        const duration = 2000;
        const start = performance.now();
        const initial = parseInt(el.textContent.replace(/,/g, '')) || 0;

        function step(time) {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.floor(initial + (target - initial) * ease).toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ═══════════════════════════════════════════
       CERTIFICATE MODAL
       ═══════════════════════════════════════════ */
    function initCertificate() {
        const btn = $('#generate-cert-btn');
        const modal = $('#certificate-modal');
        const closeBtn = $('#close-cert');
        const downloadBtn = $('#download-cert-btn');

        btn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            addWorship(10);
            fireConfetti();
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });

        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });

        downloadBtn.addEventListener('click', () => { window.print(); });
    }

    /* ═══════════════════════════════════════════
       EASTER EGG — PRESS M x3 (Storm)
       ═══════════════════════════════════════════ */
    function initEasterEgg() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // M x3 for storm
            if (key === 'm') {
                state.mPressCount++;
                clearTimeout(state.mPressTimer);
                state.mPressTimer = setTimeout(() => { state.mPressCount = 0; }, 1200);
                if (state.mPressCount >= 3) {
                    state.mPressCount = 0;
                    toggleStormMode();
                    addWorship(15);
                }
            }

            // Q for royal announcement toast
            if (key === 'q') {
                const announcements = [
                    '👑 The Queen demands a snack break!',
                    '🦟 Buzz alert: Catherine is thinking about you (in a scary way).',
                    '⚡ Breaking: Mosquito Queen rated "too iconic" by royal historians.',
                    '🌙 The night sky just rearranged itself into Catherine\'s initials.',
                    '🏰 Warning: Unauthorized lack of admiration detected.',
                    '✨ Catherine\'s charisma broke the scale again. Technicians give up.',
                    '👑 Reminder: Bowing is not optional, it\'s a lifestyle.',
                ];
                showToast('📢 Royal Announcement', announcements[Math.floor(rand(0, announcements.length))]);
                addWorship(3);
            }

            // C for confetti
            if (key === 'c') {
                fireConfetti();
                addWorship(2);
            }

            // B for buzzing name chant
            if (key === 'b') {
                triggerNameChant();
                addWorship(5);
            }
        });
    }

    /* ═══════════════════════════════════════════
       STORM MODE
       ═══════════════════════════════════════════ */
    function toggleStormMode() {
        const overlay = $('#storm-overlay');
        if (state.stormActive) {
            overlay.classList.add('hidden');
            state.stormActive = false;
            return;
        }

        state.stormActive = true;
        overlay.classList.remove('hidden');

        const canvas = $('#storm-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const stormMosquitoes = [];
        const count = isMobile() ? 60 : 200;

        class StormMosquito {
            constructor() {
                this.x = rand(0, canvas.width);
                this.y = rand(0, canvas.height);
                this.size = rand(2, 5);
                this.speedX = rand(-6, 6);
                this.speedY = rand(-6, 6);
                this.opacity = rand(0.3, 0.9);
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
                this.speedX += rand(-0.3, 0.3);
                this.speedY += rand(-0.3, 0.3);
                this.speedX = Math.max(-8, Math.min(8, this.speedX));
                this.speedY = Math.max(-8, Math.min(8, this.speedY));
            }
            draw() {
                ctx.save();
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = COLORS.crimson;
                ctx.shadowColor = COLORS.crimson;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < count; i++) stormMosquitoes.push(new StormMosquito());

        let lightningTimer = 0;
        let lightningOpacity = 0;

        function animateStorm() {
            if (!state.stormActive) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            lightningTimer++;
            if (lightningTimer > rand(40, 120)) {
                lightningOpacity = 0.8;
                lightningTimer = 0;
                drawLightning(ctx, canvas.width, canvas.height);
            }
            if (lightningOpacity > 0) {
                ctx.save();
                ctx.globalAlpha = lightningOpacity;
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
                lightningOpacity -= 0.06;
            }

            stormMosquitoes.forEach((m) => { m.update(); m.draw(); });
            requestAnimationFrame(animateStorm);
        }
        animateStorm();

        setTimeout(() => {
            if (state.stormActive) {
                overlay.classList.add('hidden');
                state.stormActive = false;
            }
        }, 6000);
    }

    function drawLightning(ctx, w, h) {
        ctx.save();
        ctx.strokeStyle = 'rgba(200,180,255,0.9)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#a080ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        let x = rand(w * 0.2, w * 0.8);
        let y = 0;
        ctx.moveTo(x, y);
        while (y < h * 0.7) {
            x += rand(-30, 30);
            y += rand(10, 40);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    /* ═══════════════════════════════════════════
       SOUND TOGGLE
       ═══════════════════════════════════════════ */
    function initSoundToggle() {
        const btn = $('#sound-toggle');
        btn.addEventListener('click', () => {
            state.soundOn = !state.soundOn;
            btn.classList.toggle('active', state.soundOn);

            if (state.soundOn) {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioCtx.createOscillator();
                    oscillator.type = 'sine';
                    oscillator.frequency.value = 90;
                    const gainNode = audioCtx.createGain();
                    gainNode.gain.value = 0;
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 300;
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                    oscillator.start();
                    gainNode.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 1);
                    const lfo = audioCtx.createOscillator();
                    lfo.type = 'sine';
                    lfo.frequency.value = 0.3;
                    const lfoGain = audioCtx.createGain();
                    lfoGain.gain.value = 5;
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    lfo.start();
                    btn._audioCtx = audioCtx;
                    btn._oscillator = oscillator;
                    btn._gainNode = gainNode;
                    btn._lfo = lfo;
                } catch (err) { console.warn('Web Audio not supported:', err); }
            } else {
                if (btn._gainNode && btn._audioCtx) {
                    btn._gainNode.gain.linearRampToValueAtTime(0, btn._audioCtx.currentTime + 0.5);
                    setTimeout(() => {
                        try { btn._oscillator.stop(); btn._lfo.stop(); btn._audioCtx.close(); } catch (e) { }
                    }, 600);
                }
            }
        });
    }

    /* ═══════════════════════════════════════════
       PARALLAX ON SCROLL
       ═══════════════════════════════════════════ */
    function initParallax() {
        const heroContent = $('.hero-content');
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const vh = window.innerHeight;
            if (heroContent && scrollY < vh) {
                const factor = scrollY / vh;
                heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
                heroContent.style.opacity = 1 - factor * 1.2;
            }
        }, { passive: true });
    }

    /* ═══════════════════════════════════════════
       BUTTON HOVER VIBRATION
       ═══════════════════════════════════════════ */
    function initButtonEffects() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes subtleVibrate {
                0%, 100% { transform: scale(1.05) translateX(0); }
                20% { transform: scale(1.05) translateX(-2px); }
                40% { transform: scale(1.05) translateX(2px); }
                60% { transform: scale(1.05) translateX(-1px); }
                80% { transform: scale(1.05) translateX(1px); }
            }
        `;
        document.head.appendChild(style);
    }

    /* ═══════════════════════════════════════════
       AUTO THEME SHIFT (subtle after 10s)
       ═══════════════════════════════════════════ */
    function initAutoThemeShift() {
        setTimeout(() => {
            document.documentElement.style.setProperty('--cyan', '#40ffdd');
            document.documentElement.style.transition = 'all 3s ease';
            setTimeout(() => {
                document.documentElement.style.setProperty('--cyan', '#00f5ff');
            }, 6000);
        }, 10000);
    }

    /* ═══════════════════════════════════════════
       TOOLTIPS ON ABILITIES
       ═══════════════════════════════════════════ */
    function initTooltips() {
        $$('.ability-card').forEach((card) => {
            card.style.position = 'relative';
            const tip = document.createElement('div');
            tip.textContent = 'Bestowed by the Mosquito Queen';
            tip.style.cssText = `
                position: absolute; bottom: 100%; left: 50%;
                transform: translateX(-50%) translateY(8px);
                background: rgba(26,0,43,0.95); border: 1px solid rgba(0,245,255,0.3);
                color: #00f5ff; font-size: 0.7rem; padding: 4px 10px;
                border-radius: 6px; white-space: nowrap; pointer-events: none;
                opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease;
                z-index: 10; font-family: var(--font-body); letter-spacing: 0.5px;
            `;
            card.appendChild(tip);
            card.addEventListener('mouseenter', () => {
                tip.style.opacity = '1';
                tip.style.transform = 'translateX(-50%) translateY(-4px)';
            });
            card.addEventListener('mouseleave', () => {
                tip.style.opacity = '0';
                tip.style.transform = 'translateX(-50%) translateY(8px)';
            });
        });
    }

    /* ═══════════════════════════════════════════
       TOUCH RIPPLE (Mobile)
       ═══════════════════════════════════════════ */
    function initTouchRipple() {
        if (!isMobile()) return;
        const style = document.createElement('style');
        style.textContent = `@keyframes touchRipple { to { transform: translate(-50%,-50%) scale(8); opacity: 0; } }`;
        document.head.appendChild(style);

        document.addEventListener('touchstart', (e) => {
            const ripple = document.createElement('div');
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            ripple.style.cssText = `
                position: fixed; left: ${x}px; top: ${y}px;
                width: 20px; height: 20px; border-radius: 50%;
                background: radial-gradient(circle, rgba(0,245,255,0.3), transparent);
                pointer-events: none; z-index: 9999;
                transform: translate(-50%,-50%) scale(0);
                animation: touchRipple 0.6s ease forwards;
            `;
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        }, { passive: true });
    }

    /* ═══════════════════════════════════════════
       SHOOTING STARS
       ═══════════════════════════════════════════ */
    function initShootingStars() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shootingStar {
                0% { opacity: 1; transform: translate(0,0) rotate(-30deg) scaleX(1); }
                70% { opacity: 1; }
                100% { opacity: 0; transform: translate(300px,200px) rotate(-30deg) scaleX(0.2); }
            }
        `;
        document.head.appendChild(style);

        setInterval(() => {
            if (!state.stormActive && Math.random() > 0.5) {
                const star = document.createElement('div');
                const duration = rand(0.8, 1.5);
                star.style.cssText = `
                    position: fixed; left: ${rand(10, 90)}%; top: ${rand(0, 30)}%;
                    width: 2px; height: 2px; background: ${COLORS.white};
                    border-radius: 50%; pointer-events: none; z-index: 1;
                    box-shadow: 0 0 6px ${COLORS.cyan}, -20px 0 10px ${COLORS.cyan};
                    animation: shootingStar ${duration}s linear forwards;
                `;
                document.body.appendChild(star);
                setTimeout(() => star.remove(), duration * 1000 + 100);
            }
        }, 3000);
    }

    /* ═══════════════════════════════════════════
       TILT EFFECT ON GLASS PANELS (Desktop)
       ═══════════════════════════════════════════ */
    function initTiltEffect() {
        if (isMobile()) return;
        $$('.glass-panel, .glass-panel-inner').forEach((panel) => {
            panel.addEventListener('mousemove', (e) => {
                const rect = panel.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const tiltX = ((y - cy) / cy) * -3;
                const tiltY = ((x - cx) / cx) * 3;
                panel.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-4px)`;
            });
            panel.addEventListener('mouseleave', () => { panel.style.transform = ''; });
        });
    }

    /* ═══════════════════════════════════════════
       FLOATING EMBERS
       ═══════════════════════════════════════════ */
    function initEmbers() {
        const count = isMobile() ? 5 : 15;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes emberRise {
                0% { opacity: 0; transform: translateY(0) translateX(0); }
                10% { opacity: 0.6; }
                90% { opacity: 0.4; }
                100% { opacity: 0; transform: translateY(-100vh) translateX(${rand(-60, 60)}px); }
            }
        `;
        document.head.appendChild(style);

        for (let i = 0; i < count; i++) {
            const ember = document.createElement('div');
            const size = rand(3, 6);
            ember.style.cssText = `
                position: fixed; left: ${rand(5, 95)}%; bottom: -10px;
                width: ${size}px; height: ${size}px;
                background: ${[COLORS.gold, COLORS.crimson, COLORS.cyan][Math.floor(rand(0, 3))]};
                border-radius: 50%; pointer-events: none; z-index: 1;
                opacity: 0; filter: blur(1px);
                animation: emberRise ${rand(8, 18)}s ${rand(0, 10)}s ease-in-out infinite;
            `;
            document.body.appendChild(ember);
        }
    }

    /* ═══════════════════════════════════════════
       TEXT SCRAMBLE ON SECTION TITLES
       ═══════════════════════════════════════════ */
    function initTextScramble() {
        const chars = '!<>-_\\/[]{}—=+*^?#__✦✧★';
        function scramble(el) {
            const original = el.textContent;
            const length = original.length;
            let iteration = 0;
            const interval = setInterval(() => {
                el.textContent = original.split('').map((char, i) => {
                    if (i < iteration) return original[i];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');
                iteration += 0.5;
                if (iteration >= length) { el.textContent = original; clearInterval(interval); }
            }, 30);
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    scramble(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        $$('.section-title').forEach((el) => observer.observe(el));
    }

    /* ═══════════════════════════════════════════
       GLITCH TEXT ON HERO
       ═══════════════════════════════════════════ */
    function initGlitchEffect() {
        const title = $('.title-kingdom');
        if (!title) return;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glitchSkew {
                0% { transform: skew(0deg); } 20% { transform: skew(-1deg); }
                40% { transform: skew(0.5deg); } 60% { transform: skew(-0.3deg); }
                80% { transform: skew(0.8deg); } 100% { transform: skew(0deg); }
            }
        `;
        document.head.appendChild(style);
        setInterval(() => {
            title.style.animation = 'glitchSkew 0.4s ease, titleShimmer 4s ease infinite';
            setTimeout(() => { title.style.animation = 'titleShimmer 4s ease infinite'; }, 400);
        }, 8000);
    }

    /* ═══════════════════════════════════════════
       TOAST NOTIFICATION SYSTEM
       ═══════════════════════════════════════════ */
    function showToast(title, message) {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<div class="toast-title">${title}</div><div>${message}</div>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    /* ═══════════════════════════════════════════
       CONFETTI CANNON
       ═══════════════════════════════════════════ */
    function fireConfetti() {
        const canvas = $('#confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const confetti = [];
        const colors = [COLORS.cyan, COLORS.gold, COLORS.crimson, '#ff69b4', '#7b68ee', '#00ff7f'];

        for (let i = 0; i < 120; i++) {
            confetti.push({
                x: canvas.width / 2 + rand(-200, 200),
                y: canvas.height + 10,
                vx: rand(-8, 8),
                vy: rand(-18, -8),
                size: rand(4, 10),
                color: colors[Math.floor(rand(0, colors.length))],
                rotation: rand(0, 360),
                rotSpeed: rand(-8, 8),
                gravity: 0.3,
                opacity: 1,
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;

            confetti.forEach((c) => {
                c.vy += c.gravity;
                c.x += c.vx;
                c.y += c.vy;
                c.vx *= 0.99;
                c.rotation += c.rotSpeed;
                c.opacity -= 0.005;
                if (c.opacity <= 0) return;
                alive = true;

                ctx.save();
                ctx.globalAlpha = c.opacity;
                ctx.translate(c.x, c.y);
                ctx.rotate((c.rotation * Math.PI) / 180);
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
                ctx.restore();
            });

            if (alive) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        animate();
    }

    /* ═══════════════════════════════════════════
       NAME CHANT OVERLAY
       ═══════════════════════════════════════════ */
    function triggerNameChant() {
        const overlay = $('#chant-overlay');
        overlay.classList.remove('hidden');

        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                const chant = document.createElement('div');
                chant.className = 'chant-name';
                chant.textContent = ['Catherine D\'Silva', 'Mosquito Queen', '👑 Catherine 👑', '🦟 The Queen 🦟'][Math.floor(rand(0, 4))];
                chant.style.left = rand(5, 85) + '%';
                chant.style.fontSize = rand(1, 3) + 'rem';
                chant.style.animationDuration = rand(5, 10) + 's';
                overlay.appendChild(chant);
                setTimeout(() => chant.remove(), 10000);
            }, i * 300);
        }

        setTimeout(() => { overlay.classList.add('hidden'); }, 12000);
    }

    /* ═══════════════════════════════════════════
       MOSQUITO BITE COUNTER
       ═══════════════════════════════════════════ */
    function initBiteCounter() {
        const btn = $('#bite-btn');
        const countEl = $('#bite-count');
        const reactionEl = $('#bite-reaction');

        const reactions = [
            'Ouch! 🦟', 'Bzzzz! Another one!', 'The Queen approves! 👑',
            'Stop scratching!', 'Itchy yet? 😏', 'Catherine sends more!',
            'You\'re doomed!', 'Resistance is futile! 🦟', 'Mosquito power!',
            'Your blood type: Royal ✨', '*dramatic mosquito noises*',
            'Catherine says: You\'re welcome 💅', 'That\'s gonna leave a mark!',
            'The swarm grows stronger!', 'You asked for this! 😂',
        ];

        btn.addEventListener('click', () => {
            state.biteCount++;
            countEl.textContent = state.biteCount;
            countEl.classList.add('bump');
            setTimeout(() => countEl.classList.remove('bump'), 150);

            reactionEl.textContent = reactions[Math.floor(rand(0, reactions.length))];
            addWorship(1);

            // Milestone toasts
            if (state.biteCount === 10) showToast('🦟 Achievement', 'You earned: Mosquito Snack');
            if (state.biteCount === 50) showToast('🦟 Achievement', 'You earned: Blood Donor Extraordinaire');
            if (state.biteCount === 100) showToast('👑 Achievement', 'Catherine personally thanks you for 100 bites!');
        });
    }

    /* ═══════════════════════════════════════════
       BOW DOWN BUTTON
       ═══════════════════════════════════════════ */
    function initBowDown() {
        const btn = $('#bow-btn');
        const countEl = $('#bow-count');

        btn.addEventListener('click', () => {
            state.bowCount++;
            countEl.textContent = state.bowCount;
            addWorship(3);

            // Screen bow effect
            document.body.style.transition = 'transform 0.5s ease';
            document.body.style.transform = 'perspective(600px) rotateX(8deg)';
            setTimeout(() => {
                document.body.style.transform = 'none';
            }, 600);

            if (state.bowCount === 1) showToast('🙇 First Bow', 'The Queen acknowledges your reverence.');
            if (state.bowCount === 10) showToast('🙇 Loyal Subject', 'Catherine considers sparing you.');
            if (state.bowCount % 25 === 0) fireConfetti();
        });
    }

    /* ═══════════════════════════════════════════
       WORSHIP METER
       ═══════════════════════════════════════════ */
    function addWorship(points) {
        state.worshipPoints = Math.min(state.worshipPoints + points, 100);
        const fill = $('#worship-fill');
        const level = $('#worship-level');

        if (fill) fill.style.width = state.worshipPoints + '%';

        const levels = [
            { min: 0, label: 'Peasant 🧹' },
            { min: 10, label: 'Commoner 🏠' },
            { min: 25, label: 'Knight 🗡️' },
            { min: 40, label: 'Noble 🎩' },
            { min: 55, label: 'Duke/Duchess 💎' },
            { min: 70, label: 'Royal Advisor 📜' },
            { min: 85, label: 'Queen\'s Champion 🏆' },
            { min: 95, label: 'Supreme Devotee 👑' },
        ];

        const current = levels.reduce((acc, l) => (state.worshipPoints >= l.min ? l : acc), levels[0]);
        if (level) level.textContent = current.label;
    }

    /* ═══════════════════════════════════════════
       MOSQUITO FACTS
       ═══════════════════════════════════════════ */
    function initFacts() {
        const facts = [
            'Mosquitoes have been around for over 200 million years — just like Catherine\'s reign. 🦟',
            'A mosquito\'s wings beat 300-600 times per second. Catherine\'s ego beats faster. 👑',
            'Only female mosquitoes bite. The Queen relates. 💅',
            'Mosquitoes are attracted to body heat and CO₂. Catherine attracts attention and drama. ✨',
            'There are over 3,500 species of mosquitoes. Catherine rules them ALL. 🏰',
            'Mosquitoes can fly up to 1.5 miles per hour. Catherine conquers kingdoms faster. ⚡',
            'The word "mosquito" means "little fly" in Spanish. Nothing about Catherine is little. 🌙',
            'Fun fact: This entire website was not a joke. Bow down. 🙇',
            'Mosquitoes navigate using the Earth\'s magnetic field. Catherine navigates using pure charisma. 🧭',
            'A mosquito can drink up to 3 times its weight in blood. Catherine drinks up all the spotlight. 🎭',
            'Mosquitoes can sense you from 150 feet away. Catherine\'s influence? Global. 🌍',
            'The oldest known mosquito fossil is 79 million years old. Catherine is timeless. ♾️',
        ];

        const factText = $('#fact-text');
        const factNumber = $('#fact-number');
        const factTotal = $('#fact-total');
        const btn = $('#next-fact-btn');
        let currentFact = -1;

        factTotal.textContent = facts.length;

        btn.addEventListener('click', () => {
            currentFact = (currentFact + 1) % facts.length;
            factText.style.opacity = 0;
            setTimeout(() => {
                factText.textContent = facts[currentFact];
                factNumber.textContent = currentFact + 1;
                factText.style.opacity = 1;
            }, 300);
            addWorship(1);
        });
    }

    /* ═══════════════════════════════════════════
       ROYAL QUIZ
       ═══════════════════════════════════════════ */
    function initQuiz() {
        const questions = [
            {
                q: 'What is Catherine D\'Silva\'s official royal title?',
                opts: ['Supreme Guardian of the Night Realm', 'Princess of Mosquitoes', 'Queen of the Flies', 'Night Janitor'],
                correct: 0,
            },
            {
                q: 'What happens when you press M three times?',
                opts: ['Nothing', 'Mosquito Storm Mode 🌩️', 'The page closes', 'Free pizza arrives'],
                correct: 1,
            },
            {
                q: 'How many species of mosquitoes does Catherine rule?',
                opts: ['Just 3', 'About 200', 'ALL 3,500+ species', 'She lost count'],
                correct: 2,
            },
            {
                q: 'What is Catherine\'s Buzz Power Level?',
                opts: ['42', 'Over 9000!', '9,999', 'Unmeasurable'],
                correct: 2,
            },
            {
                q: 'Is this website a joke?',
                opts: ['Yes, obviously', 'Maybe', 'No, it is a royal decree', 'I\'m scared to answer'],
                correct: 2,
            },
        ];

        const questionEl = $('#quiz-question');
        const optionsEl = $('#quiz-options');
        const resultEl = $('#quiz-result');
        const scoreEl = $('#quiz-score');
        const scoreVal = $('#quiz-score-value');
        const totalEl = $('#quiz-total');
        const startBtn = $('#quiz-start-btn');
        let current = 0;
        let score = 0;

        totalEl.textContent = questions.length;

        startBtn.addEventListener('click', () => {
            current = 0;
            score = 0;
            scoreEl.classList.add('hidden');
            resultEl.classList.add('hidden');
            startBtn.style.display = 'none';
            showQuestion();
        });

        function showQuestion() {
            if (current >= questions.length) {
                finishQuiz();
                return;
            }
            const q = questions[current];
            questionEl.textContent = q.q;
            optionsEl.innerHTML = '';

            q.opts.forEach((opt, i) => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.textContent = opt;
                btn.addEventListener('click', () => {
                    // Disable all options
                    optionsEl.querySelectorAll('.quiz-option').forEach((o) => { o.style.pointerEvents = 'none'; });
                    if (i === q.correct) {
                        btn.classList.add('correct');
                        score++;
                        addWorship(5);
                    } else {
                        btn.classList.add('wrong');
                        optionsEl.children[q.correct].classList.add('correct');
                    }
                    setTimeout(() => {
                        current++;
                        showQuestion();
                    }, 1200);
                });
                optionsEl.appendChild(btn);
            });
        }

        function finishQuiz() {
            optionsEl.innerHTML = '';
            scoreVal.textContent = score;
            scoreEl.classList.remove('hidden');

            const messages = [
                { min: 0, msg: '🧹 Peasant! You know nothing about the Queen!' },
                { min: 2, msg: '🗡️ Average loyalty. The Queen is watching you…' },
                { min: 4, msg: '👑 Impressive! The Queen may spare your life!' },
                { min: 5, msg: '🏆 Perfect score! You are worthy of the Queen\'s presence!' },
            ];

            const result = messages.reduce((acc, m) => (score >= m.min ? m : acc), messages[0]);
            questionEl.textContent = result.msg;
            startBtn.style.display = '';
            startBtn.querySelector('.btn-text').textContent = '🔄 Retake Quiz';

            if (score === questions.length) fireConfetti();
        }
    }

    /* ═══════════════════════════════════════════
       CATCH THE MOSQUITO GAME
       ═══════════════════════════════════════════ */
    function initCatchGame() {
        const gameArea = $('#game-area');
        const mosquito = $('#catch-mosquito');
        const catchCount = $('#catch-count');
        const missCount = $('#miss-count');
        const taunt = $('#game-taunt');

        const taunts = [
            'Too slow! 🦟', 'Missed! Catherine laughs at you!', 'Not even close! 😂',
            'The mosquito dodged!', 'Try harder, peasant!', 'LOL nope.',
            'Were you even trying? 🤔', 'Swing and a miss!',
            'The Queen\'s mosquito is too fast! ⚡', 'Better luck never!',
        ];

        const catchMessages = [
            'Lucky catch! 🎉', 'Wait, how?!', 'Catherine is NOT pleased. 😤',
            'Beginner\'s luck!', 'The mosquito let you win.',
        ];

        function moveMosquito() {
            const areaRect = gameArea.getBoundingClientRect();
            const maxX = areaRect.width - 40;
            const maxY = areaRect.height - 40;
            mosquito.style.left = rand(20, maxX) + 'px';
            mosquito.style.top = rand(20, maxY) + 'px';
        }

        // Move the mosquito when you get close
        mosquito.addEventListener('mouseenter', () => {
            if (Math.random() > 0.15) { // 85% dodge chance
                moveMosquito();
                state.missCount++;
                missCount.textContent = state.missCount;
                taunt.textContent = taunts[Math.floor(rand(0, taunts.length))];
            }
        });

        mosquito.addEventListener('click', (e) => {
            e.stopPropagation();
            state.catchCount++;
            catchCount.textContent = state.catchCount;
            taunt.textContent = catchMessages[Math.floor(rand(0, catchMessages.length))];
            addWorship(5);
            moveMosquito();
            if (state.catchCount === 5) showToast('🦟 Game', 'You caught 5 mosquitoes! The Queen is mildly annoyed.');
        });

        gameArea.addEventListener('click', () => {
            state.missCount++;
            missCount.textContent = state.missCount;
            taunt.textContent = taunts[Math.floor(rand(0, taunts.length))];
            moveMosquito();
        });

        // Move randomly every few seconds
        setInterval(moveMosquito, 2500);
    }

    /* ═══════════════════════════════════════════
       ANNOYING POPUP MOSQUITO
       ═══════════════════════════════════════════ */
    function initPopupMosquito() {
        const popup = $('#popup-mosquito');
        const closeBtn = $('#popup-mosquito-close');

        const messages = [
            'Bzzzz! The Queen demands your attention! 🦟',
            'Hey! Have you bowed to Catherine today? 👑',
            'Don\'t ignore the Mosquito Queen! She\'s watching! 👁️',
            'This is a royal interruption. Carry on... after bowing. 🙇',
            'You\'ve been scrolling too long without worshipping! ⚡',
        ];

        function showPopup() {
            if (state.stormActive) return;
            popup.querySelector('.popup-mosquito-text').textContent =
                messages[Math.floor(rand(0, messages.length))];

            if (!isMobile()) {
                popup.style.left = rand(10, 60) + '%';
                popup.style.top = rand(15, 60) + '%';
            }
            popup.classList.remove('hidden');
        }

        closeBtn.addEventListener('click', () => {
            popup.classList.add('hidden');
            addWorship(2);
            showToast('🙇 Good subject!', 'The Queen appreciates your compliance.');
        });

        // Show popup randomly every 30-60 seconds
        setTimeout(() => {
            showPopup();
            setInterval(() => {
                if (Math.random() > 0.5) showPopup();
            }, rand(30000, 60000));
        }, 20000);
    }

    /* ═══════════════════════════════════════════
       RANDOM ROYAL TOASTS
       ═══════════════════════════════════════════ */
    function initRandomToasts() {
        const toasts = [
            ['👑 Royal Update', 'Catherine just did something amazing. She breathed.'],
            ['🦟 Breaking News', 'Mosquito swarm loyalty index reached new highs!'],
            ['⚡ System Alert', 'Your devotion levels are dropping. Interact more!'],
            ['🌙 Night Report', 'The Mosquito Queen rules another night successfully.'],
            ['✨ Fun Fact', 'This website has more animations than your future.'],
            ['🏰 Kingdom News', 'All borders expanded. Catherine\'s influence grows.'],
            ['👑 Reminder', 'Have you generated your Royal Certificate yet?'],
            ['🦟 Buzz Alert', 'Catherine can hear you NOT worshipping. Fix that.'],
        ];

        setTimeout(() => {
            setInterval(() => {
                if (Math.random() > 0.6 && !state.stormActive) {
                    const t = toasts[Math.floor(rand(0, toasts.length))];
                    showToast(t[0], t[1]);
                }
            }, 25000);
        }, 15000);
    }

    /* ═══════════════════════════════════════════
       KBD HIGHLIGHT IN FOOTER
       ═══════════════════════════════════════════ */
    function initKBDHighlight() {
        const kbds = $$('footer kbd');
        setInterval(() => {
            kbds.forEach((kbd) => {
                kbd.style.boxShadow = '0 0 10px rgba(0,245,255,0.5)';
                setTimeout(() => { kbd.style.boxShadow = 'none'; }, 500);
            });
        }, 5000);
    }

    /* ═══════════════════════════════════════════
       RESIZE HANDLER
       ═══════════════════════════════════════════ */
    function initResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (state.stormActive) {
                    const canvas = $('#storm-canvas');
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                }
            }, 200);
        });
    }

    /* ═══════════════════════════════════════════
       ROAST CARD TAP ANIMATION (Mobile)
       ═══════════════════════════════════════════ */
    function initRoastInteraction() {
        $$('.roast-card').forEach((card) => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(1.05) rotate(2deg)';
                setTimeout(() => { card.style.transform = ''; }, 300);
                addWorship(1);
            });
        });
    }

    /* ═══════════════════════════════════════════
       INIT EVERYTHING
       ═══════════════════════════════════════════ */
    function init() {
        initLoader();
        initCursorGlow();
        initParticles();
        initMosquitoSwarm();
        initEnterKingdom();
        initScrollReveal();
        initCertificate();
        initEasterEgg();
        initSoundToggle();
        initParallax();
        initButtonEffects();
        initAutoThemeShift();
        initTooltips();
        initTouchRipple();
        initShootingStars();
        initTiltEffect();
        initEmbers();
        initTextScramble();
        initGlitchEffect();
        initResizeHandler();
        initKBDHighlight();
        // New features
        initBiteCounter();
        initBowDown();
        initFacts();
        initQuiz();
        initCatchGame();
        initPopupMosquito();
        initRandomToasts();
        initRoastInteraction();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
