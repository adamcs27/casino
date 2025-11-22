import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement) {
        this.controls = new PointerLockControls(camera, domElement);
        this.moveSpeed = 10.0;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isLocked = false;

        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            interact: false
        };

        this.setupEventListeners();

        this.controls.getObject().position.y = 2.0; // Taller camera

        // Reverted rotation order change to fix 180-degree lock
        // this.controls.getObject().rotation.order = 'YXZ';
        // if (camera) camera.rotation.order = 'YXZ';

        this.controls.addEventListener('lock', () => {
            this.isLocked = true;
            document.getElementById('interaction-prompt').style.display = 'none';
            document.getElementById('crosshair').style.display = 'block';
            document.getElementById('pause-menu').classList.add('hidden');
            this.controls.getObject().rotation.order = 'YXZ';
            if (camera) camera.rotation.order = 'YXZ';
        });

        this.controls.addEventListener('unlock', () => {
            this.isLocked = false;
            document.getElementById('crosshair').style.display = 'none';
            // Only show pause menu if NOT opening a game
            // We can check if the game overlay is hidden
            const gameOverlay = document.getElementById('game-overlay');
            if (gameOverlay && gameOverlay.classList.contains('hidden')) {
                document.getElementById('pause-menu').classList.remove('hidden');
            }
        });

        // Quit Button
        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
                document.body.innerHTML = `
                    <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:black;color:white;font-family:'Courier New';flex-direction:column;">
                        <h1>GAME OVER</h1>
                        <p>Thanks for playing Antigrav.</p>
                        <button onclick="location.reload()" style="margin-top:20px;padding:10px;cursor:pointer;">RESTART</button>
                    </div>
                `;
            });
        }

        this.createCigarette();
        this.createHeroin();
        this.createKnife();
        this.createLean();
    }

    knockOutGuard(guard) {
        if (guard.userData.isKnockedOut) return;

        // Store original position before knocking out
        if (!guard.userData.originalPosition) {
            guard.userData.originalPosition = guard.position.clone();
            guard.userData.originalRotation = guard.rotation.clone();
        }

        guard.userData.isKnockedOut = true;
        this.lastKnockedOutGuard = guard;

        // Simple fall animation
        let angle = 0;
        const fallInterval = setInterval(() => {
            angle += 0.1;
            guard.rotation.x = -angle; // Fall backward
            guard.position.y -= 0.05;
            if (angle > Math.PI / 2) {
                clearInterval(fallInterval);
                guard.rotation.x = -Math.PI / 2;
                guard.position.y = 0.2; // On floor
            }
        }, 20);

        // Trigger Heroin Respawn if active
        if (this.isHeroinActive) {
            this.triggerHeroinRespawn();
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
        document.addEventListener('mousedown', (event) => {
            if (this.isLocked && event.button === 0) {
                if (this.hasCigarette) this.takeDrag();
                if (this.hasLean) this.drinkLean();
                if (this.hasHeroin) this.useHeroin();
                if (this.hasKnife) this.stab();
            }
        });
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.input.forward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.input.left = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.backward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.right = true;
                break;
            case 'KeyE':
                this.input.interact = true;
                break;
            case 'KeyM':
                if (this.isLocked) {
                    document.exitPointerLock();
                } else {
                    this.lock();
                }
                break;
            case 'Digit1':
                this.toggleCigarette();
                break;
            case 'Digit2':
                this.toggleLean();
                break;
            case 'Digit3':
                this.toggleHeroin();
                break;
            case 'Digit4':
                this.toggleKnife();
                break;
            case 'Digit0':
                this.resetHeroinEffects();
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.input.forward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.input.left = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.input.backward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.input.right = false;
                break;
            case 'KeyE':
                this.input.interact = false;
                break;
        }
    }

    getObject() {
        return this.controls.getObject();
    }

    lock() {
        this.controls.lock();
    }

    unlock() {
        this.controls.unlock();
    }

    update(delta, collidables) {
        if (!this.isLocked) return;

        this.collidables = collidables; // Store for slap logic

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.input.forward) - Number(this.input.backward);
        this.direction.x = Number(this.input.right) - Number(this.input.left);
        this.direction.normalize();

        if (this.input.forward || this.input.backward) this.velocity.z -= this.direction.z * 150.0 * delta;
        if (this.input.left || this.input.right) this.velocity.x -= this.direction.x * 150.0 * delta;

        // Collision Detection
        // Collision Detection
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
        if (collidables) {
            // We check slightly ahead of the player
            const playerPos = this.controls.getObject().position.clone();

            // Check in 8 directions to ensure we don't get stuck or push through
            const directions = [
                new THREE.Vector3(0, 0, -1), // Forward
                new THREE.Vector3(0, 0, 1),  // Backward
                new THREE.Vector3(-1, 0, 0), // Left
                new THREE.Vector3(1, 0, 0),  // Right
                new THREE.Vector3(-0.7, 0, -0.7).normalize(),
                new THREE.Vector3(0.7, 0, -0.7).normalize(),
                new THREE.Vector3(-0.7, 0, 0.7).normalize(),
                new THREE.Vector3(0.7, 0, 0.7).normalize()
            ];

            for (const dir of directions) {
                // Transform local direction to world
                const worldDir = dir.clone().applyQuaternion(this.controls.getObject().quaternion);
                // Project to XZ plane for collision to avoid floor/ceiling issues
                worldDir.y = 0;
                worldDir.normalize();

                const raycaster = new THREE.Raycaster(playerPos, worldDir, 0, 1.0); // 1.0 radius check

                const intersects = raycaster.intersectObjects(collidables, false);
                const validHits = intersects.filter(hit => hit.object.isMesh && hit.object.userData.type !== 'smoke');

                if (validHits.length > 0) {
                    const hit = validHits[0];
                    // Skip collision if object is knocked out guard
                    let obj = hit.object;
                    let isKnockedOut = false;
                    while (obj) {
                        if (obj.userData && obj.userData.isKnockedOut) {
                            isKnockedOut = true;
                            break;
                        }
                        obj = obj.parent;
                    }
                    if (isKnockedOut) continue;

                    if (hit.distance < 0.8) {
                        // Push back
                        const push = worldDir.clone().multiplyScalar(hit.distance - 0.8);
                        this.controls.getObject().position.add(push);

                        // Kill velocity in that direction if moving towards it
                        this.velocity.multiplyScalar(0.5);
                    }
                }
            }
        }

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        // Fix Flying: Force Y position
        this.controls.getObject().position.y = 2.0;

        // FORCE CAMERA UPRIGHT (Fix for persistent rotation bug)
        this.controls.getObject().rotation.z = 0;
        // this.controls.getObject().rotation.x = 0; // REMOVED: This locks pitch!

        // Ensure Up vector is correct to prevent spiral/roll
        if (this.camera) {
            this.camera.up.set(0, 1, 0);
            this.camera.rotation.z = 0;
        }

        this.updateCigarette(delta);
        this.updateLean(delta);
        this.updateHeroin(delta);
        this.updateKnife(delta);
    }

    createCigarette() {
        this.cigaretteGroup = new THREE.Group();

        // Cigarette Body (White)
        const bodyGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.1;
        this.cigaretteGroup.add(body);

        // Filter (Orange)
        const filterGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.05, 8);
        const filterMat = new THREE.MeshStandardMaterial({ color: 0xffa500 });
        const filter = new THREE.Mesh(filterGeo, filterMat);
        filter.position.y = -0.025;
        this.cigaretteGroup.add(filter);

        // Tip (Red/Ash)
        const tipGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8);
        this.tipMat = new THREE.MeshBasicMaterial({ color: 0x555555 }); // Ash initially
        const tip = new THREE.Mesh(tipGeo, this.tipMat);
        tip.position.y = 0.205;
        this.cigaretteGroup.add(tip);

        // Tip Light
        this.cigLight = new THREE.PointLight(0xff4500, 0, 2);
        this.cigLight.position.y = 0.22;
        this.cigaretteGroup.add(this.cigLight);

        // Position relative to camera (bottom right)
        this.cigaretteGroup.position.set(0.2, -0.2, -0.4);
        this.cigaretteGroup.rotation.x = Math.PI / 4;
        this.cigaretteGroup.rotation.z = -Math.PI / 6;
        this.cigaretteGroup.visible = false;

        this.controls.getObject().add(this.cigaretteGroup);

        this.hasCigarette = false;
        this.isSmoking = false;
        this.smokeTimer = 0;

        // Smoke Particles
        this.smokeParticles = [];
    }

    createLean() {
        this.leanGroup = new THREE.Group();

        // Cup 1 (Outer)
        const cupGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.1, 16, 1, true);
        const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const cup1 = new THREE.Mesh(cupGeo, cupMat);
        this.leanGroup.add(cup1);

        // Cup 2 (Inner/Stacked)
        const cup2 = new THREE.Mesh(cupGeo, cupMat);
        cup2.position.y = 0.02;
        cup2.scale.set(0.95, 0.95, 0.95);
        this.leanGroup.add(cup2);

        // Purple Liquid
        const liquidGeo = new THREE.CircleGeometry(0.035, 16);
        const liquidMat = new THREE.MeshBasicMaterial({ color: 0x800080 }); // Purple
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.rotation.x = -Math.PI / 2;
        liquid.position.y = 0.04;
        this.leanGroup.add(liquid);

        this.leanGroup.position.set(0.3, -0.3, -0.5);
        this.leanGroup.rotation.set(0, -0.2, 0.1);
        this.leanGroup.visible = false;

        this.controls.getObject().add(this.leanGroup);

        this.hasLean = false;
        this.isDrinking = false;
        this.drinkTimer = 0;
    }

    toggleCigarette() {
        try {
            console.log("Toggling Cigarette");
            if (this.hasCigarette) {
                this.hasCigarette = false;
                if (this.cigaretteGroup) this.cigaretteGroup.visible = false;
                this.updateInventoryUI(0);
                return;
            }
            this.unequipAll();
            this.hasCigarette = true;
            if (this.cigaretteGroup) this.cigaretteGroup.visible = true;
            this.updateInventoryUI(1);
        } catch (e) { console.error("Error toggling cigarette:", e); }
    }

    toggleLean() {
        try {
            console.log("Toggling Lean");
            if (this.hasLean) {
                this.hasLean = false;
                if (this.leanGroup) this.leanGroup.visible = false;
                // Don't reset isDrinking or isLeanActive - let effects continue
                this.updateInventoryUI(0);
                return;
            }
            this.unequipAll();
            this.hasLean = true;
            if (this.leanGroup) this.leanGroup.visible = true;
            this.updateInventoryUI(2);
        } catch (e) { console.error("Error toggling lean:", e); }
    }

    toggleHeroin() {
        try {
            console.log("Toggling Heroin");
            if (this.hasHeroin) {
                this.hasHeroin = false;
                if (this.heroinGroup) this.heroinGroup.visible = false;
                // Don't reset isUsingHeroin, isHeroinActive, or heroinTimer - let effects continue
                this.updateInventoryUI(0);
                return;
            }
            this.unequipAll();
            this.hasHeroin = true;
            if (this.heroinGroup) this.heroinGroup.visible = true;
            this.updateInventoryUI(3);

            // Reset visual state (but preserve active effect states)
            if (!this.isUsingHeroin && !this.isHeroinActive) {
                this.heroinTimer = 0;
            }
            if (this.syringe) this.syringe.visible = false;
            if (this.lighter) this.lighter.visible = true;
            if (this.flame) this.flame.intensity = 0;
        } catch (e) { console.error("Error toggling heroin:", e); }
    }

    toggleKnife() {
        try {
            console.log("Toggling Knife");
            if (this.hasKnife) {
                this.hasKnife = false;
                if (this.knifeGroup) this.knifeGroup.visible = false;
                this.updateInventoryUI(0);
                return;
            }
            this.unequipAll();
            this.hasKnife = true;
            if (this.knifeGroup) this.knifeGroup.visible = true;
            this.updateInventoryUI(4);
        } catch (e) { console.error("Error toggling knife:", e); }
    }



    updateInventoryUI(activeId) {
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById(`item-${i}`);
            if (el) {
                if (i === activeId) el.classList.add('active');
                else el.classList.remove('active');
            }
        }
    }

    takeDrag() {
        if (!this.hasCigarette || this.isSmoking) return;
        this.isSmoking = true;
        this.smokeTimer = 0;
    }

    drinkLean() {
        if (!this.hasLean || this.isDrinking) return;
        this.isDrinking = true;
        this.drinkTimer = 0;
    }

    updateLean(delta) {
        if (!this.hasLean) return;

        if (this.isDrinking) {
            this.drinkTimer += delta;

            // Drink Animation
            if (this.drinkTimer < 0.5) {
                // Lift to mouth
                const t = this.drinkTimer / 0.5;
                this.leanGroup.position.y = THREE.MathUtils.lerp(-0.3, -0.15, t);
                this.leanGroup.position.z = THREE.MathUtils.lerp(-0.5, -0.3, t);
                this.leanGroup.position.x = THREE.MathUtils.lerp(0.3, 0, t);
                this.leanGroup.rotation.x = THREE.MathUtils.lerp(0, -0.5, t); // Tilt up
            } else if (this.drinkTimer < 1.5) {
                // Hold
            } else if (this.drinkTimer < 2.0) {
                // Lower
                const t = (this.drinkTimer - 1.5) / 0.5;
                this.leanGroup.position.y = THREE.MathUtils.lerp(-0.15, -0.3, t);
                this.leanGroup.position.z = THREE.MathUtils.lerp(-0.3, -0.5, t);
                this.leanGroup.position.x = THREE.MathUtils.lerp(0, 0.3, t);
                this.leanGroup.rotation.x = THREE.MathUtils.lerp(-0.5, 0, t);
            } else {
                this.isDrinking = false;
                this.isLeanActive = true; // Track Lean effect state

                // Trigger eyelid effect
                const eyelid = document.getElementById('lean-eyelid');
                const leanText = document.getElementById('lean-text');

                if (eyelid) {
                    eyelid.classList.add('sleepy-active');
                    if (leanText) leanText.classList.add('lean-text-active');

                    setTimeout(() => {
                        eyelid.classList.remove('sleepy-active');
                        if (leanText) leanText.classList.remove('lean-text-active');
                        this.isLeanActive = false; // End Lean effect
                    }, 8000); // Lasts 8 seconds
                }
            }
        }

        // Idle sway
        if (!this.isDrinking) {
            const time = performance.now() * 0.002;
            this.leanGroup.position.y = -0.3 + Math.sin(time) * 0.005;
            this.leanGroup.rotation.z = 0.1 + Math.cos(time) * 0.02;
        }
    }

    updateCigarette(delta) {
        if (!this.hasCigarette) return;

        // Smoke Particles
        if (this.isSmoking && this.smokeTimer > 0.5 && this.smokeTimer < 1.5) {
            // Spawn smoke
            if (Math.random() < 0.3) {
                const smokeGeo = new THREE.BoxGeometry(0.02, 0.02, 0.02);
                const smokeMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.6 });
                const smoke = new THREE.Mesh(smokeGeo, smokeMat);

                // Position at tip (need world position of tip)
                const tipPos = new THREE.Vector3(0, 0.22, 0);
                tipPos.applyMatrix4(this.cigaretteGroup.matrixWorld);

                smoke.position.copy(tipPos);

                // Calculate forward direction from camera
                const forward = new THREE.Vector3();
                this.controls.getObject().getWorldDirection(forward);

                // Velocity: Up + Forward + Random Spread
                const velocity = new THREE.Vector3(0, 0.3, 0); // Up
                velocity.add(forward.multiplyScalar(1.0)); // Forward push
                velocity.add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.1)); // Spread

                smoke.userData = { type: 'smoke', life: 1.0, velocity: velocity };

                this.controls.getObject().parent.add(smoke); // Add to scene/world, not camera
                this.smokeParticles.push(smoke);
            }
        }

        // Update particles
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.userData.life -= delta;
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
            p.material.opacity = p.userData.life * 0.6;
            if (p.userData.life <= 0) {
                p.parent.remove(p);
                this.smokeParticles.splice(i, 1);
            }
        }

        // Idle sway
        const time = performance.now() * 0.002;
        if (!this.isSmoking) {
            this.cigaretteGroup.position.y = -0.2 + Math.sin(time) * 0.005;
            this.cigaretteGroup.rotation.z = -Math.PI / 6 + Math.cos(time) * 0.02;
            this.cigaretteGroup.position.x = 0.2;
            this.cigaretteGroup.position.z = -0.4;
            this.cigaretteGroup.rotation.x = Math.PI / 4;
            this.tipMat.color.setHex(0x555555); // Ash
            this.cigLight.intensity = 0;
        } else {
            this.smokeTimer += delta;

            // Drag Animation Phases
            if (this.smokeTimer < 0.5) {
                // Move to mouth
                const t = this.smokeTimer / 0.5;
                this.cigaretteGroup.position.x = THREE.MathUtils.lerp(0.2, 0, t);
                this.cigaretteGroup.position.y = THREE.MathUtils.lerp(-0.2, -0.1, t);
                this.cigaretteGroup.position.z = THREE.MathUtils.lerp(-0.4, -0.2, t);
                this.cigaretteGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 4, Math.PI / 2, t);
                this.cigaretteGroup.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 6, t);
            } else if (this.smokeTimer < 1.5) {
                // Hold & Glow
                this.tipMat.color.setHex(0xff4500); // Red hot
                this.cigLight.intensity = 1.0;
            } else if (this.smokeTimer < 2.0) {
                // Move back
                const t = (this.smokeTimer - 1.5) / 0.5;
                this.cigaretteGroup.position.x = THREE.MathUtils.lerp(0, 0.2, t);
                this.cigaretteGroup.position.y = THREE.MathUtils.lerp(-0.1, -0.2, t);
                this.cigaretteGroup.position.z = THREE.MathUtils.lerp(-0.2, -0.4, t);
                this.cigaretteGroup.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, Math.PI / 4, t);
                this.cigaretteGroup.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 6, t);
                this.tipMat.color.setHex(0x555555); // Cooling down
                this.cigLight.intensity = 0;
            } else {
                this.isSmoking = false;
            }
        }
    }

    createHeroin() {
        this.heroinGroup = new THREE.Group();

        // Spoon (Silver)
        const spoonGeo = new THREE.SphereGeometry(0.03, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const spoonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
        const spoon = new THREE.Mesh(spoonGeo, spoonMat);
        spoon.rotation.x = Math.PI;
        this.heroinGroup.add(spoon);

        const handleGeo = new THREE.BoxGeometry(0.01, 0.005, 0.1);
        const handle = new THREE.Mesh(handleGeo, spoonMat);
        handle.position.set(0, 0, 0.06);
        this.heroinGroup.add(handle);

        // Lighter (Blue)
        this.lighter = new THREE.Group();
        const lighterBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.06, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x0000ff })
        );
        this.lighter.add(lighterBody);
        this.lighter.position.set(0, -0.1, 0);
        this.heroinGroup.add(this.lighter);

        // Lighter Flame
        this.flame = new THREE.PointLight(0xffaa00, 0, 1);
        this.flame.position.set(0, 0.04, 0);
        this.lighter.add(this.flame);

        // Syringe
        this.syringe = new THREE.Group();
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8),
            new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
        );
        barrel.rotation.x = Math.PI / 2;
        this.syringe.add(barrel);

        const needle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.001, 0.001, 0.05, 8),
            new THREE.MeshStandardMaterial({ color: 0xcccccc })
        );
        needle.rotation.x = Math.PI / 2;
        needle.position.z = -0.075;
        this.syringe.add(needle);

        this.syringe.position.set(0.1, 0.05, 0);
        this.syringe.visible = false;
        this.heroinGroup.add(this.syringe);

        this.heroinGroup.position.set(0.2, -0.2, -0.4);
        this.heroinGroup.visible = false;
        this.controls.getObject().add(this.heroinGroup);

        this.hasHeroin = false;
        this.isUsingHeroin = false;
        this.heroinTimer = 0;
    }

    createKnife() {
        this.knifeGroup = new THREE.Group();

        // Handle
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.03, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x3e2723 })
        );
        this.knifeGroup.add(handle);

        // Blade
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.005, 0.025, 0.15),
            new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
        );
        blade.position.z = -0.135;
        this.knifeGroup.add(blade);

        this.knifeGroup.position.set(0.3, -0.3, -0.5);
        this.knifeGroup.rotation.set(0, -0.2, 0);
        this.knifeGroup.visible = false;
        this.controls.getObject().add(this.knifeGroup);

        this.hasKnife = false;
        this.isStabbing = false;
        this.stabTimer = 0;

        // Blood Particles
        this.bloodParticles = [];
    }

    unequipAll() {
        console.log("Unequipping All");
        try {
            if (this.hasCigarette) {
                this.hasCigarette = false;
                if (this.cigaretteGroup) this.cigaretteGroup.visible = false;
            }

            if (this.hasLean) {
                this.hasLean = false;
                if (this.leanGroup) this.leanGroup.visible = false;
                // Don't reset isDrinking or isLeanActive - let effects continue
            }

            if (this.hasHand) this.toggleHand();

            if (this.hasHeroin) {
                this.hasHeroin = false;
                if (this.heroinGroup) this.heroinGroup.visible = false;
                // Don't reset isUsingHeroin, isHeroinActive, or heroinTimer - let effects continue
                // Only hide the visual items
                if (this.syringe) this.syringe.visible = false;
                if (this.lighter) this.lighter.visible = true;
                if (this.flame) this.flame.intensity = 0;
            }
            if (this.hasKnife) {
                this.hasKnife = false;
                if (this.knifeGroup) this.knifeGroup.visible = false;
                this.isStabbing = false;
                this.stabTimer = 0;
            }

            this.updateInventoryUI(0);
        } catch (e) { console.error("Error unequipping all:", e); }
    }


    useHeroin() {
        if (!this.hasHeroin || this.isUsingHeroin) return;
        this.isUsingHeroin = true;
        this.heroinTimer = 0;
        this.heroinHighTriggered = false;

        // Init Audio Context if needed
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playHeartbeat() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    playScream() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        // Sawtooth for a harsh scream-like sound
        osc.type = 'sawtooth';

        // Pitch drop
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.5);

        // Volume fade
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
    }

    stab() {
        if (!this.hasKnife || this.isStabbing) return;
        this.isStabbing = true;
        this.stabTimer = 0;

        // Raycast
        const raycaster = new THREE.Raycaster();
        const cam = this.controls.getObject();
        const start = new THREE.Vector3();
        const dir = new THREE.Vector3();
        cam.getWorldPosition(start);
        cam.getWorldDirection(dir);
        raycaster.set(start, dir);

        if (this.collidables) {
            const intersects = raycaster.intersectObjects(this.collidables, true);
            if (intersects.length > 0) {
                const hit = intersects[0];
                if (hit.distance < 2.0) {
                    let obj = hit.object;
                    while (obj) {
                        if (obj.userData && (obj.userData.type === 'guard' || obj.userData.type === 'security_guard')) {
                            this.spawnBlood(hit.point);
                            this.spawnBloodStain(obj.userData.parentGroup ? obj.userData.parentGroup.position : obj.position);
                            this.knockOutGuard(obj.userData.parentGroup || obj);
                            this.playScream();
                            break;
                        }
                        obj = obj.parent;
                    }
                }
            }
        }
    }

    spawnBloodStain(position) {
        const stainGeo = new THREE.CircleGeometry(0.5 + Math.random() * 0.5, 16);
        const stainMat = new THREE.MeshBasicMaterial({
            color: 0x660000,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1 // Prevent z-fighting with floor
        });
        const stain = new THREE.Mesh(stainGeo, stainMat);
        stain.rotation.x = -Math.PI / 2;
        stain.position.copy(position);
        stain.position.y = 0.02; // Slightly above floor

        this.controls.getObject().parent.add(stain);
    }

    spawnBlood(position) {
        for (let i = 0; i < 20; i++) {
            const blood = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.05, 0.05),
                new THREE.MeshBasicMaterial({ color: 0x880000 })
            );
            blood.position.copy(position);
            blood.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                life: 1.0
            };
            this.controls.getObject().parent.add(blood); // Add to scene
            this.bloodParticles.push(blood);
        }
    }

    updateHeroin(delta) {
        if (!this.hasHeroin) return;

        if (this.isUsingHeroin) {
            this.heroinTimer += delta;

            // Phase 1: Heat (0-2s)
            if (this.heroinTimer < 2.0) {
                this.flame.intensity = 1.0 + Math.random() * 0.5;
                this.heroinGroup.position.x = 0.2 + (Math.random() - 0.5) * 0.01; // Shake
            }
            // Phase 2: Inject (2-3s)
            else if (this.heroinTimer < 3.0) {
                this.flame.intensity = 0;
                this.lighter.visible = false;
                this.syringe.visible = true;

                const t = (this.heroinTimer - 2.0);
                this.heroinGroup.position.set(
                    THREE.MathUtils.lerp(0.2, 0, t),
                    THREE.MathUtils.lerp(-0.2, -0.3, t),
                    THREE.MathUtils.lerp(-0.4, -0.3, t)
                );
                this.heroinGroup.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 4, t);
            }
            // Phase 3: High (3s+)
            else {
                // Screen Effects
                const ui = document.getElementById('ui-layer');
                // Update Veins
                const veins = document.getElementById('heroin-veins');
                const heroinText = document.getElementById('heroin-text');

                // Trigger high if not yet triggered
                if (!this.heroinHighTriggered) {
                    this.isHeroinActive = true;
                    this.heroinHighTriggered = true;
                }

                if (this.isHeroinActive) {
                    if (veins) veins.style.opacity = 1;

                    // Check if guard is dead
                    let guardIsDead = false;
                    if (this.lastKnockedOutGuard && this.lastKnockedOutGuard.userData.isKnockedOut) {
                        guardIsDead = true;
                    }

                    // Show text only if guard is alive
                    if (heroinText) {
                        if (guardIsDead) {
                            heroinText.classList.remove('heroin-text-active');
                        } else {
                            heroinText.classList.add('heroin-text-active');
                        }
                    }

                    // Flash Effect
                    ui.classList.add('heroin-flash');
                    const hue = (performance.now() * 0.1) % 360;
                    ui.style.filter = `hue-rotate(${hue}deg) blur(1px)`;

                    // Effect duration logic:
                    // - If guard is dead: effect lasts 5 seconds (total 8s including 3s animation)
                    // - If guard is alive: effect lasts until guard is killed
                    this.heroinTimer += delta;
                    if (guardIsDead && this.heroinTimer > 8.0) {
                        // Guard already dead, end effect after 5 seconds of high
                        this.isHeroinActive = false;
                        this.isUsingHeroin = false;
                        this.heroinHighTriggered = false;

                        if (veins) veins.style.opacity = 0;
                        if (heroinText) heroinText.classList.remove('heroin-text-active');
                        ui.classList.remove('heroin-flash');
                        ui.style.filter = 'none';

                        // Reset heroin visual items
                        if (this.heroinGroup) {
                            this.heroinGroup.position.set(0.2, -0.2, -0.4);
                            this.heroinGroup.rotation.set(0, 0, 0);
                        }
                        if (this.lighter) this.lighter.visible = true;
                        if (this.syringe) this.syringe.visible = false;
                        if (this.flame) this.flame.intensity = 0;
                    }
                } else {
                    if (veins) veins.style.opacity = 0;
                    if (heroinText) heroinText.classList.remove('heroin-text-active');
                    ui.classList.remove('heroin-flash');
                    ui.style.filter = 'none';
                }

                // ui.style.transform = `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)`; // REMOVED shake
                // Camera Shake (Position only, no rotation)
                // Force Z rotation to 0 to prevent any spinning
                this.controls.getObject().rotation.z = 0;

                // Heartbeat (every 1s approx)
                if (Math.floor(this.heroinTimer) > Math.floor(this.heroinTimer - delta)) {
                    this.playHeartbeat();
                }
            }
        }
    }

    triggerHeroinRespawn() {
        // Start Fade Out
        const fadeOverlay = document.getElementById('fade-overlay');
        if (fadeOverlay) fadeOverlay.style.opacity = 1;

        // Wait for fade (1s), then reset
        setTimeout(() => {
            this.isUsingHeroin = false;
            this.isHeroinActive = false;
            this.resetHeroinEffects();

            // Reset Position and Rotation
            this.controls.getObject().position.set(0, 2.0, 0); // Center of room
            this.controls.getObject().rotation.set(0, 0, 0);
            if (this.camera) this.camera.rotation.set(0, 0, 0);

            // Reset Velocity
            this.velocity.set(0, 0, 0);

            // Reset Items
            if (this.heroinGroup) {
                this.heroinGroup.position.set(0.2, -0.2, -0.4);
                this.heroinGroup.rotation.set(0, 0, 0);
            }
            if (this.lighter) this.lighter.visible = true;
            if (this.syringe) this.syringe.visible = false;

            // Respawn Guard
            if (this.lastKnockedOutGuard) {
                const guard = this.lastKnockedOutGuard;
                guard.userData.isKnockedOut = false;

                // Restore original position and rotation
                if (guard.userData.originalPosition) {
                    guard.position.copy(guard.userData.originalPosition);
                }
                if (guard.userData.originalRotation) {
                    guard.rotation.copy(guard.userData.originalRotation);
                }

                this.lastKnockedOutGuard = null;
            }

            // Fade In
            if (fadeOverlay) fadeOverlay.style.opacity = 0;

            this.heroinHighTriggered = false;
        }, 1000);
    }

    resetHeroinEffects() {
        const ui = document.getElementById('ui-layer');
        const veins = document.getElementById('heroin-veins');
        const heroinText = document.getElementById('heroin-text'); // Get heroin text element

        if (ui && veins) {
            veins.style.opacity = 0;
            ui.classList.remove('heroin-flash');
            ui.style.filter = 'none';
            ui.style.transform = 'none';
            if (heroinText) heroinText.classList.remove('heroin-text-active'); // Deactivate heroin text
        }
        this.controls.getObject().rotation.z = 0;
    }

    updateKnife(delta) {
        // Update Blood (Always update regardless of weapon)
        for (let i = this.bloodParticles.length - 1; i >= 0; i--) {
            const p = this.bloodParticles[i];
            p.userData.life -= delta;
            p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
            p.userData.velocity.y -= 9.8 * delta; // Gravity
            if (p.position.y < 0) p.position.y = 0; // Floor

            if (p.userData.life <= 0) {
                p.parent.remove(p);
                this.bloodParticles.splice(i, 1);
            }
        }

        if (!this.hasKnife) return;

        if (this.isStabbing) {
            this.stabTimer += delta * 10;
            const t = Math.min(this.stabTimer, Math.PI);

            // Stab animation
            this.knifeGroup.position.z = -0.5 - Math.sin(t) * 0.4;

            if (this.stabTimer >= Math.PI) {
                this.isStabbing = false;
                this.knifeGroup.position.z = -0.5;
            }
        }
    }
}
