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
        let interactableObj = null;

        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].distance > 3) break; // Max interaction distance

            // Check if object or its parent is interactable
            let obj = intersects[i].object;
            let currentObj = obj;
            while (currentObj) {
                if (currentObj.userData) {
                    // Prioritize explicit interactable flag, then check for 'door' type
                    if (currentObj.userData.interactable || currentObj.userData.type === 'door') {
                        interactableObj = currentObj;
                        foundInteractable = true;
                        break; // Found an interactable object, stop checking parents
                    }
                }
                currentObj = currentObj.parent;
            }
            if (foundInteractable) break; // Found an interactable object, stop checking other intersects
        }

        if (foundInteractable) {
            this.canInteract = true;
            this.target = interactableObj; // Set the target to the found interactable object
            const rawType = this.target.userData.type || '';
            const type = rawType.toLowerCase().trim();
            console.log("Interaction Target Type:", type);

            // Defensive check: Hide prompt for guard (handles old cached 'guard' and new 'security_guard')
            if (type === 'security_guard' || type.includes('guard')) {
                this.prompt.style.display = 'none';
                return;
            }

            // Show appropriate prompt based on object type
            if (type === 'door') {
                const location = this.target.userData.location || 'inside';
                if (location === 'inside') {
                    this.prompt.innerText = 'Press E to go outside';
                } else {
                    this.prompt.innerText = 'Press E to enter casino';
                }
            } else if (type === 'drug_dealer') {
                this.prompt.innerText = 'Press E to buy drugs';
            } else if (type === 'painting') {
                this.prompt.innerText = 'Press E to touch the painting';
            } else {
                const displayType = type.charAt(0).toUpperCase() + type.slice(1);
                this.prompt.innerText = `Press E to Play ${displayType}`;
            }
            this.prompt.style.display = 'block';
        } else {
            this.canInteract = false;
            this.target = null;
            this.prompt.style.display = 'none';
        }
    }
}
