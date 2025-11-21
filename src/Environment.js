import * as THREE from 'three';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.init();
    }

    init() {
        // Create procedural textures
        const wallTexture = this.createNoiseTexture(64, 64, '#5d4037', '#3e2723'); // Dark Oak
        const floorTexture = this.createNoiseTexture(64, 64, '#212121', '#000000'); // Dark Floor
        const ceilingTexture = this.createNoiseTexture(64, 64, '#1a1a1a', '#000000');

        // Load Dean Texture
        const textureLoader = new THREE.TextureLoader();
        const deanTexture = textureLoader.load('./src/Images/dean.JPEG');
        // Fix orientation if needed, usually faces need to be rotated or UVs adjusted
        // For a sphere, we might need to rotate the texture or the mesh
        deanTexture.wrapS = THREE.RepeatWrapping;
        deanTexture.repeat.x = -1; // Flip horizontally if needed, often needed for sphere mapping


        // Materials
        const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.8 });
        const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
        const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 0.9 });

        // Room dimensions
        const width = 20;
        const height = 8;
        const depth = 20;

        // Floor
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMat);
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), ceilingMat);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        this.scene.add(ceiling);

        // Walls
        const wallGeo = new THREE.PlaneGeometry(width, height);

        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.z = -depth / 2;
        backWall.position.y = height / 2;
        this.scene.add(backWall);

        const frontWall = new THREE.Mesh(wallGeo, wallMat);
        frontWall.position.z = depth / 2;
        frontWall.position.y = height / 2;
        frontWall.rotation.y = Math.PI;
        this.scene.add(frontWall);

        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.x = -width / 2;
        leftWall.position.y = height / 2;
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.x = width / 2;
        rightWall.position.y = height / 2;
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffaa00, 1, 15);
        pointLight.position.set(0, 6, 0);
        this.scene.add(pointLight);

        // Pillars removed as per request
        // Add Slot Machines
        const machineGeo = new THREE.BoxGeometry(1.5, 2.5, 1.5);
        const machineMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5 });

        const machinePositions = [
            [0, 1.25, -8],
            [-3, 1.25, -8],
            [3, 1.25, -8]
        ];

        machinePositions.forEach(pos => {
            const machine = new THREE.Mesh(machineGeo, machineMat);
            machine.position.set(...pos);
            machine.userData = { interactable: true, type: 'slots' };
            this.scene.add(machine);

            // Add a "screen" to the machine
            const screenGeo = new THREE.PlaneGeometry(1, 1);
            const screenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const screen = new THREE.Mesh(screenGeo, screenMat);
            screen.position.set(0, 0.5, 0.76);
            machine.add(screen);
        });

        // Blackjack Table
        const tableGeo = new THREE.CylinderGeometry(3, 3, 0.2, 32);
        const tableMat = new THREE.MeshStandardMaterial({ color: 0x006400, roughness: 0.5 }); // Green felt
        const table = new THREE.Mesh(tableGeo, tableMat);
        table.position.set(5, 1, 5);
        this.scene.add(table);

        // Table Base
        const baseGeo = new THREE.CylinderGeometry(0.5, 1, 1, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(5, 0.5, 5);
        this.scene.add(base);

        // Dealer NPC
        const npcGeo = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const dealerMat = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Suit
        const dealer = new THREE.Mesh(npcGeo, dealerMat);
        dealer.position.set(5, 1.5, 2.5);
        dealer.lookAt(5, 1.5, 5);
        this.scene.add(dealer);

        // Dealer Head
        const headGeo = new THREE.SphereGeometry(0.3);
        const deanMat = new THREE.MeshStandardMaterial({ map: deanTexture });
        const dealerHead = new THREE.Mesh(headGeo, deanMat);
        dealerHead.position.set(0, 0.8 + 0.2, 0); // Floating slightly higher (+0.2)
        dealerHead.rotation.y = -Math.PI / 2; // Adjust rotation to face forward
        dealer.add(dealerHead);

        // Player NPCs
        const playerPositions = [
            [7.5, 1.2, 5],
            [2.5, 1.2, 5]
        ];

        playerPositions.forEach(pos => {
            const npc = new THREE.Mesh(npcGeo, new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
            npc.position.set(...pos);
            npc.lookAt(5, 1.2, 5);
            this.scene.add(npc);

            const head = new THREE.Mesh(headGeo, deanMat);
            head.position.set(0, 0.8 + 0.2, 0); // Floating
            head.rotation.y = -Math.PI / 2;
            npc.add(head);
        });

        // Empty Chair (Interactable)
        const chairGeo = new THREE.BoxGeometry(1, 1, 1);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.set(5, 0.5, 7.5);
        chair.userData = { interactable: true, type: 'blackjack' };
        this.scene.add(chair);

        // Snake Desk
        const deskGeo = new THREE.BoxGeometry(3, 1.5, 1.5);
        const deskMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
        const desk = new THREE.Mesh(deskGeo, deskMat);
        desk.position.set(-5, 0.75, 5);
        this.scene.add(desk);

        // Computer
        const monitorGeo = new THREE.BoxGeometry(1, 0.8, 0.2);
        const monitorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const monitor = new THREE.Mesh(monitorGeo, monitorMat);
        monitor.position.set(0, 0.9, 0);
        desk.add(monitor);

        const screenGeo = new THREE.PlaneGeometry(0.9, 0.7);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue screen
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(0, 0, 0.11);
        monitor.add(screen);

        // Make desk interactable (or the monitor)
        desk.userData = { interactable: true, type: 'snake' };

        // Entry Door (Moved to side wall)
        const doorFrameGeo = new THREE.BoxGeometry(0.2, 3.2, 2.2);
        const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
        const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
        doorFrame.position.set(9.9, 1.6, 0);
        this.scene.add(doorFrame);

        const doorGeo = new THREE.BoxGeometry(0.1, 3, 2);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(9.85, 1.5, 0);
        this.scene.add(door);

        // Central Overhead Light
        const centralLight = new THREE.PointLight(0xffaa00, 2.0, 30);
        centralLight.position.set(0, 4, 0);
        this.scene.add(centralLight);

        // Central Light Fixture
        const centralFixture = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.2, 1),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        );
        centralFixture.position.set(0, 3.9, 0);
        this.scene.add(centralFixture);

        // Security Guard (Moved near new door)
        const guardGroup = new THREE.Group();
        guardGroup.position.set(9, 0, 2);
        guardGroup.userData = { type: 'security_guard', interactable: false };

        // Guard Body
        const gBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1.8, 16),
            new THREE.MeshStandardMaterial({ color: 0x1a237e })
        );
        gBody.position.y = 0.9;
        guardGroup.add(gBody);

        const gHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.4),
            deanMat
        );
        gHead.position.y = 1.8 + 0.4 + 0.2; // Floating
        gHead.rotation.y = -Math.PI / 2;
        guardGroup.add(gHead);

        // Guard Hat
        const gHat = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        gHat.position.y = 1.8 + 0.7 + 0.2; // Adjust hat for floating head
        guardGroup.add(gHat);

        guardGroup.lookAt(0, 0, 0); // Face the room

        // Add collision/interaction data
        gBody.userData = { parentGroup: guardGroup, type: 'security_guard' };
        gHead.userData = { parentGroup: guardGroup, type: 'security_guard' };

        this.scene.add(guardGroup);
    }

    createNoiseTexture(width, height, color1, color2) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const c1 = new THREE.Color(color1);
        const c2 = new THREE.Color(color2);

        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const mix = Math.random();
                const r = Math.floor((c1.r * (1 - mix) + c2.r * mix) * 255);
                const g = Math.floor((c1.g * (1 - mix) + c2.g * mix) * 255);
                const b = Math.floor((c1.b * (1 - mix) + c2.b * mix) * 255);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(i, j, 1, 1);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter; // Pixelated look
        texture.minFilter = THREE.NearestFilter;
        return texture;
    }
}
