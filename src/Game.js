import * as THREE from 'three';
import { Player } from './Player.js';
import { Environment } from './Environment.js';
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
        this.player = new Player(this.camera, document.body);
        this.environment = new Environment(this.scene);
        this.interactionManager = new InteractionManager(this.camera, this.scene);
        this.casinoGames = new CasinoGames();

        // Add player to scene
        this.scene.add(this.player.getObject());

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
        const songTitle = file.split('/').pop().replace('.mp3', '').replace('SpotiDownloader.com - ', '');
        const nowPlayingText = document.getElementById('now-playing-text');
        if (nowPlayingText) {
            nowPlayingText.innerText = songTitle;
            // Reset animation
            nowPlayingText.style.animation = 'none';
            nowPlayingText.offsetHeight; /* trigger reflow */
            nowPlayingText.style.animation = 'scrollText 10s linear infinite';
        }

        this.audioLoader.load(file, (buffer) => {
            this.bgMusic.setBuffer(buffer);
            this.bgMusic.setLoop(false);
            this.bgMusic.setVolume(0.3); // Moderate volume
            this.bgMusic.play();
        }, undefined, (err) => {
            console.error("Error loading music:", err);
            // Skip to next track on error
            this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
            // Avoid infinite loop if all fail
            setTimeout(() => this.playNextTrack(), 1000);
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

            if (this.interactionManager.canInteract && this.player.input.interact) {
                const target = this.interactionManager.target;
                if (target) {
                    if (target.userData.type !== 'security_guard' && target.userData.type !== 'guard') {
                        this.casinoGames.openGame(target.userData.type);
                        this.player.unlock();
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
}
