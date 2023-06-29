import * as THREE from "../../node_modules/three/build/three.module.js";

class ButtonCreator {
    constructor() { 
        this.texture=null;
        this.button=null;
    }

    createButton(imageURL, onClick) {
        this.texture=this.createTexture(imageURL);
        const material = new THREE.MeshBasicMaterial({ map: this.texture });
        const geometry = new THREE.PlaneGeometry(0.1, 0.1);
        this.button = new THREE.Mesh(geometry, material);
        
        // Aggiunge la proprietà onClick al bottone
        this.button.onClick = onClick;
        return this.button;
    }

    createTexture(imageUrl){
        let textureLoader = new THREE.TextureLoader();
        return textureLoader.load(imageUrl);
    }
    changeTexture(imageUrl){
        this.texture = this.createTexture(imageUrl);
        this.button.material.map = this.texture;
    }
}
export default ButtonCreator;