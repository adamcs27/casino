import * as THREE from 'three';

export class OutsideEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.createOutside();
    }

    createOutside() {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        this.scene.add(ground);

        // Ambient lighting (darker for night city)
        const ambientLight = new THREE.AmbientLight(0x404060, 0.3);
        this.scene.add(ambientLight);

        // Street lights
        const streetLight1 = new THREE.PointLight(0xffaa00, 1.5, 20);
        streetLight1.position.set(-5, 4, 0);
        this.scene.add(streetLight1);

        const streetLight2 = new THREE.PointLight(0xffaa00, 1.5, 20);
        streetLight2.position.set(5, 4, 0);
        this.scene.add(streetLight2);

        // Casino building (behind player)
        const casinoGeo = new THREE.BoxGeometry(20, 10, 15);
        const casinoMat = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
        const casino = new THREE.Mesh(casinoGeo, casinoMat);
        casino.position.set(0, 5, 15);
        this.scene.add(casino);

        // Casino entrance door (to re-enter) - rotated to face player
        const doorFrameGeo = new THREE.BoxGeometry(2.2, 3.2, 0.2);
        const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
        const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
        doorFrame.position.set(0, 1.6, 7.6);
        this.scene.add(doorFrame);

        const doorGeo = new THREE.BoxGeometry(2, 3, 0.1);
        const doorMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 1.5, 7.5);
        door.userData = { interactable: true, type: 'door', location: 'outside' };
        this.scene.add(door);

        // City buildings (simple boxes for now)
        const buildingPositions = [
            [-15, 8, -10], [15, 8, -10],
            [-15, 12, -25], [0, 10, -25], [15, 12, -25],
            [-25, 6, 0], [25, 6, 0]
        ];

        buildingPositions.forEach(pos => {
            const height = pos[1] * 2;
            const buildingGeo = new THREE.BoxGeometry(8, height, 8);
            const buildingMat = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0x444444 : 0x555555
            });
            const building = new THREE.Mesh(buildingGeo, buildingMat);
            building.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(building);

            // Windows (more windows on each building)
            const floors = Math.floor(height / 3);
            for (let floor = 0; floor < floors; floor++) {
                for (let col = 0; col < 3; col++) {
                    const windowGeo = new THREE.PlaneGeometry(0.8, 0.8);
                    const isLit = Math.random() > 0.3;
                    const windowMat = new THREE.MeshBasicMaterial({
                        color: isLit ? 0xffff00 : 0x000000
                    });
                    // Front face
                    const window1 = new THREE.Mesh(windowGeo, windowMat);
                    window1.position.set(-2 + col * 2, -pos[1] + floor * 3 + 2, 4.01);
                    building.add(window1);
                    // Side face
                    const window2 = new THREE.Mesh(windowGeo, windowMat.clone());
                    window2.position.set(4.01, -pos[1] + floor * 3 + 2, -2 + col * 2);
                    window2.rotation.y = Math.PI / 2;
                    building.add(window2);
                }
            }
        });

        // Alley (narrow passage between buildings)
        const alleyWall1Geo = new THREE.BoxGeometry(0.5, 6, 15);
        const alleyWallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

        const alleyWall1 = new THREE.Mesh(alleyWall1Geo, alleyWallMat);
        alleyWall1.position.set(-12, 3, -5);
        this.scene.add(alleyWall1);

        const alleyWall2 = new THREE.Mesh(alleyWall1Geo, alleyWallMat);
        alleyWall2.position.set(-8, 3, -5);
        this.scene.add(alleyWall2);

        // Alley light (dim)
        const alleyLight = new THREE.PointLight(0xff0000, 0.5, 10);
        alleyLight.position.set(-10, 3, -5);
        this.scene.add(alleyLight);

        // Trash cans in alley
        const trashGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        const trashMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        const trash1 = new THREE.Mesh(trashGeo, trashMat);
        trash1.position.set(-11, 0.5, -3);
        this.scene.add(trash1);

        const trash2 = new THREE.Mesh(trashGeo, trashMat);
        trash2.position.set(-9, 0.5, -7);
        this.scene.add(trash2);

        // Drug Dealer NPC (in alley)
        const dealer = new THREE.Group();

        // Body (darker clothes)
        const dealerBody = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.3, 1.0, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a }) // Black hoodie
        );
        dealerBody.position.y = 1.0;
        dealer.add(dealerBody);

        // Head
        const dealerHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xd4a574 }) // Skin tone
        );
        dealerHead.position.y = 1.8;
        dealer.add(dealerHead);

        // Hood
        const hood = new THREE.Mesh(
            new THREE.ConeGeometry(0.35, 0.4, 8),
            new THREE.MeshStandardMaterial({ color: 0x0a0a0a }) // Dark hood
        );
        hood.position.y = 2.1;
        dealer.add(hood);

        // Sunglasses
        const glasses = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.1, 0.05),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        glasses.position.set(0, 1.85, 0.2);
        dealer.add(glasses);

        dealer.position.set(-11.08, 0, -4.74);
        dealer.userData = { interactable: true, type: 'drug_dealer', parentGroup: dealer };
        // Add userData to body parts for interaction
        dealerBody.userData = { parentGroup: dealer, type: 'drug_dealer' };
        dealerHead.userData = { parentGroup: dealer, type: 'drug_dealer' };
        this.scene.add(dealer);

        // Neon sign on casino (visible from front)
        const signGeo = new THREE.PlaneGeometry(12, 3);
        const signMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, 9, 7.5);
        this.scene.add(sign);
    }

    clear() {
        // Remove all objects added by this environment
        const objectsToRemove = [];
        this.scene.traverse((obj) => {
            if (obj.isMesh && obj !== this.scene) {
                objectsToRemove.push(obj);
            }
        });
        objectsToRemove.forEach(obj => this.scene.remove(obj));
    }
}
