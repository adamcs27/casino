import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);
        this.canInteract = false;
        this.target = null;
        this.prompt = document.getElementById('interaction-prompt');
    }

    update() {
        this.raycaster.setFromCamera(this.center, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        let foundInteractable = false;

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].distance > 3) break; // Max interaction distance

            // Check if object or its parent is interactable
            let obj = intersects[i].object;
            while (obj) {
                if (obj.userData && obj.userData.interactable) {
                    this.target = obj;
                    foundInteractable = true;
                    break; // Found an interactable object, stop checking parents
                }
                obj = obj.parent;
            }
            if (foundInteractable) break; // Found an interactable object, stop checking other intersects
        }

        if (foundInteractable) {
            this.canInteract = true;
            const rawType = this.target.userData.type || '';
            const type = rawType.toLowerCase().trim();
            console.log("Interaction Target Type:", type);

            // Defensive check: Hide prompt for guard (handles old cached 'guard' and new 'security_guard')
            if (type === 'security_guard' || type.includes('guard')) {
                this.prompt.style.display = 'none';
                this.prompt.innerText = '';
            } else {
                this.prompt.style.display = 'block';
                this.prompt.innerText = `Press E to Play ${rawType}`;
            }
        } else {
            this.canInteract = false;
            this.target = null;
            this.prompt.style.display = 'none';
        }
    }
}
