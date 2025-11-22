import * as THREE from 'three';
import { Player } from './Player.js';
import { Environment } from './Environment.js';
import { OutsideEnvironment } from './OutsideEnvironment.js';
import { InteractionManager } from './InteractionManager.js';
import { CasinoGames } from './CasinoGames.js';

export class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.03); // Dark fog for atmosphere

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: false }); // False for retro look
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio * 0.5); // Lower resolution for pixelated look
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Hard shadows

        this.clock = new THREE.Clock();

        // Initialize components
        this.currentLocation = 'inside'; // Track current location
        this.environment = new Environment(this.scene);
        this.outsideEnvironment = null;
        this.player = new Player(this.camera, document.body);
        this.casinoGames = new CasinoGames(this.player);
        this.interactionManager = new InteractionManager(this.camera, this.scene);

        // Add player to scene
        this.scene.add(this.player.getObject());

        // Debug menu
        this.debugMenuVisible = false;
        this.debugMenu = document.getElementById('debug-menu');
        this.debugCoords = document.getElementById('debug-coords');
        this.lastDebugCoords = null; // Store last coordinates

        // Debug menu toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                this.debugMenuVisible = !this.debugMenuVisible;
                this.debugMenu.style.display = this.debugMenuVisible ? 'block' : 'none';
            }

            // Copy coordinates with Shift+O
            if ((e.key === 'o' || e.key === 'O') && e.shiftKey && this.lastDebugCoords) {
                navigator.clipboard.writeText(this.lastDebugCoords).then(() => {
                    console.log('Coordinates copied to clipboard:', this.lastDebugCoords);
                    // Brief visual feedback
                    const originalText = this.debugCoords.innerText;
                    this.debugCoords.innerText = 'Copied!';
                    setTimeout(() => {
                        this.debugCoords.innerText = originalText;
                    }, 500);
                }).catch(err => {
                    console.error('Failed to copy coordinates:', err);
                });
            }
        });

        // Event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Click to lock pointer and start music
        document.addEventListener('click', () => {
            if (!this.casinoGames.isGameOpen) {
                this.player.lock();
            }
            // Start music on first interaction
            if (this.bgMusic && !this.bgMusic.isPlaying && !this.musicStarted) {
                this.playNextTrack();
                this.musicStarted = true;
            }
        });

        // Skip song listener
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyT') {
                this.playNextTrack();
            }
        });

        this.setupAudio();
    }

    setupAudio() {
        // Audio Listener
        const listener = new THREE.AudioListener();
        this.camera.add(listener);

        // Global Audio source
        this.bgMusic = new THREE.Audio(listener);
        this.audioLoader = new THREE.AudioLoader();

        this.playlist = [
            './src/Music/SpotiDownloader.com - Can u balll - qualowww.mp3',
            './src/Music/SpotiDownloader.com - Dame Tu Cosita (feat. Cutty Ranks) - El Chombo.mp3',
            './src/Music/SpotiDownloader.com - Free Lilquan - Lilqua 50.mp3',
            './src/Music/Good Looking.mp3',
            './src/Music/Nightcall.mp3',
            './src/Music/That Ain\'t On The News.mp3'
        ];

        // Shuffle the playlist
        this.shufflePlaylist();

        this.currentTrackIndex = 0;
        this.musicStarted = false;

        this.bgMusic.onEnded = () => {
            this.playNextTrack();
        };
    }

    shufflePlaylist() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.playlist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playlist[i], this.playlist[j]] = [this.playlist[j], this.playlist[i]];
        }
    }

    playNextTrack() {
        if (!this.playlist || this.playlist.length === 0) return;

        // Stop current track if playing
        if (this.bgMusic.isPlaying) {
            this.bgMusic.stop();
        }

        // Increment index for the next track (unless called from onEnded which already increments)
        // But wait, onEnded increments it. If we call it manually via 'T', we need to increment it too.
        // Let's handle the increment logic carefully.
        // If called manually, we want to skip to the NEXT one.
        // If called from onEnded, it was already incremented.
        // Simplest way: Just always increment here, but we need to know if it was manual or auto.
        // actually, let's just increment it here and remove the increment from onEnded to avoid double skips.

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;

        const file = this.playlist[this.currentTrackIndex];
        console.log("Playing track:", file);

        // Update Radio UI
        const nowPlayingText = document.getElementById('now-playing-text');
        if (nowPlayingText) {
            const songTitle = file.split('/').pop().replace('.mp3', '').replace('SpotiDownloader.com - ', '');
            nowPlayingText.innerText = songTitle;
            // Reset animation
            nowPlayingText.style.animation = 'none';
            nowPlayingText.offsetHeight; /* trigger reflow */
            nowPlayingText.style.animation = 'scrollText 10s linear infinite';
        }

        this.audioLoader.load(file, (buffer) => {
            this.bgMusic.setBuffer(buffer);
            this.bgMusic.setLoop(false);
            this.bgMusic.setVolume(0.5);
            this.bgMusic.play();
        }, undefined, (err) => {
            console.error("Error loading music:", err);
            // Skip to next track on error
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
            // Avoid infinite loop if all fail
        });
    }

    playSpecificTrack(trackName) {
        // Find track index by name
        const trackIndex = this.playlist.findIndex(track => track.includes(trackName));
        if (trackIndex === -1) {
            console.warn(`Track "${trackName}" not found in playlist`);
            return;
        }

        // Stop current track if playing
        if (this.bgMusic.isPlaying) {
            this.bgMusic.stop();
        }

        // Set to the specific track
        this.currentTrackIndex = trackIndex;
        const file = this.playlist[this.currentTrackIndex];
        console.log("Playing specific track:", file);

        // Update Radio UI
        const nowPlayingText = document.getElementById('now-playing-text');
        if (nowPlayingText) {
            const songTitle = file.split('/').pop().replace('.mp3', '').replace('SpotiDownloader.com - ', '');
            nowPlayingText.innerText = songTitle;
            // Reset animation
            nowPlayingText.style.animation = 'none';
            nowPlayingText.offsetHeight; /* trigger reflow */
            nowPlayingText.style.animation = 'scrollText 10s linear infinite';
        }

        this.audioLoader.load(file, (buffer) => {
            this.bgMusic.setBuffer(buffer);
            this.bgMusic.setLoop(false);
            this.bgMusic.setVolume(0.5);
            this.bgMusic.play();
        });
    }

    start() {
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        if (this.player.isLocked) {
            this.player.update(delta, this.scene.children);
            this.interactionManager.update();

            // Update debug menu coordinates
            if (this.debugMenuVisible) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
                const intersects = raycaster.intersectObjects(this.scene.children, true);

                if (intersects.length > 0) {
                    const point = intersects[0].point;
                    const coordText = `X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}, Z: ${point.z.toFixed(2)}`;
                    this.debugCoords.innerText = coordText;
                    this.lastDebugCoords = coordText; // Store for clipboard
                } else {
                    this.debugCoords.innerText = 'No intersection';
                    this.lastDebugCoords = null;
                }
            }

            if (this.interactionManager.canInteract && this.player.input.interact) {
                const target = this.interactionManager.target;
                if (target) {
                    // Door interaction
                    if (target.userData.type === 'door') {
                        this.handleDoorTeleport(target.userData.location);
                    }
                    // Other interactions
                    else if (target.userData.interactable) {
                        if (target.userData.type !== 'security_guard' && target.userData.type !== 'guard') {
                            this.casinoGames.openGame(target.userData.type, target.userData);
                            this.player.unlock();
                        }
                    }
                }
                this.player.input.interact = false; // Reset
            }
        }

        this.renderer.render(this.scene, this.camera);

        // Music Speed Control
        if (this.bgMusic && this.bgMusic.isPlaying) {
            // Heroin speeds up to 2x, Lean slows to 1x
            if (this.player.isHeroinActive) {
                if (this.bgMusic.playbackRate !== 2.0) {
                    this.bgMusic.setPlaybackRate(2.0);
                }
            } else if (this.player.isLeanActive) {
                if (this.bgMusic.playbackRate !== 1.0) {
                    this.bgMusic.setPlaybackRate(1.0);
                }
            } else {
                if (this.bgMusic.playbackRate !== 1.0) {
                    this.bgMusic.setPlaybackRate(1.0);
                }
            }
        }
    }

    handleDoorTeleport(fromLocation) {
        // Start fade out
        const fadeOverlay = document.getElementById('fade-overlay');
        if (fadeOverlay) fadeOverlay.style.opacity = 1;

        // Wait for fade, then teleport
        setTimeout(() => {
            const playerObj = this.player.controls.getObject();

            if (fromLocation === 'inside') {
                // Going outside
                this.currentLocation = 'outside';

                // Clear inside environment (remove all meshes except player and their items)
                const objectsToRemove = [];
                this.scene.traverse((obj) => {
                    if (obj.isMesh) {
                        // Check if object is player or a child of player
                        let isPlayerOrChild = false;
                        let current = obj;
                        while (current) {
                            if (current === playerObj || current === this.player.camera) {
                                isPlayerOrChild = true;
                                break;
                            }
                            current = current.parent;
                        }
                        if (!isPlayerOrChild) {
                            objectsToRemove.push(obj);
                        }
                    }
                });
                objectsToRemove.forEach(obj => {
                    if (obj.parent) obj.parent.remove(obj);
                });

                // Create outside environment
                this.outsideEnvironment = new OutsideEnvironment(this.scene);

                // Play Nightcall when going outside (only if not already playing)
                if (this.musicStarted) {
                    const currentTrack = this.playlist[this.currentTrackIndex];
                    const isNightcallPlaying = currentTrack && currentTrack.includes('Nightcall');

                    if (!isNightcallPlaying) {
                        this.playSpecificTrack('Nightcall');
                    }
                }

                // Teleport player outside casino
                playerObj.position.set(0, 2.0, 5);
                playerObj.rotation.set(0, Math.PI, 0); // Face away from casino
                if (this.player.camera) {
                    this.player.camera.rotation.set(0, 0, 0);
                }
            } else {
                // Going inside
                this.currentLocation = 'inside';

                // Clear outside environment
                if (this.outsideEnvironment) {
                    this.outsideEnvironment.clear();
                    this.outsideEnvironment = null;
                }

                // Clear any remaining objects (except player and their items)
                const objectsToRemove = [];
                this.scene.traverse((obj) => {
                    if (obj.isMesh) {
                        // Check if object is player or a child of player
                        let isPlayerOrChild = false;
                        let current = obj;
                        while (current) {
                            if (current === playerObj || current === this.player.camera) {
                                isPlayerOrChild = true;
                                break;
                            }
                            current = current.parent;
                        }
                        if (!isPlayerOrChild) {
                            objectsToRemove.push(obj);
                        }
                    }
                });
                objectsToRemove.forEach(obj => {
                    if (obj.parent) obj.parent.remove(obj);
                });

                // Recreate inside environment
                this.environment = new Environment(this.scene);

                // Teleport player inside casino
                playerObj.position.set(9, 2.0, 0);
                playerObj.rotation.set(0, -Math.PI / 2, 0); // Face into casino
                if (this.player.camera) {
                    this.player.camera.rotation.set(0, 0, 0);
                }
            }

            // Reset velocity
            this.player.velocity.set(0, 0, 0);

            // Fade in
            if (fadeOverlay) fadeOverlay.style.opacity = 0;
        }, 1000);
    }
}
