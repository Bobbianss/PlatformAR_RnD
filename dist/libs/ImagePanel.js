import * as THREE from "three";
import ButtonCreator from "./ButtonCreator";

class ImagePanel {
  constructor(imageURLs) {
    this.imageURLs = imageURLs;
    this.currentImageIndex = 0;
    this.visible=true;
    this.textures = [];
    this.panel = null;
    this.nextButton = null;
    this.previousButton = null;

    this.createPanel();
  }

  async createPanel() {
    const buttonCreator = new ButtonCreator();

    // Crea il pannello principale
    this.panel = this.createImagePanel(this.imageURLs[this.currentImageIndex]);
    // Crea i pulsanti di navigazione
    //this.nextButton = buttonCreator.createButton('../Resources/Sprites/audio.png', () => {
    //this.nextImage();
    //});
    //this.previousButton = buttonCreator.createButton('../Resources/Sprites/img.png', () => {
    //this.previousImage();
    //});

    // Posiziona i pulsanti a destra e a sinistra del pannello
    // this.nextButton.position.set(this.panel.position.x + 0.6, this.panel.position.y, this.panel.position.z);
    //  this.previousButton.position.set(this.panel.position.x - 0.6, this.panel.position.y, this.panel.position.z);
  }

  createImagePanel(url) {
    const textureLoader = new THREE.TextureLoader();
    const imageTexture = textureLoader.load(url);


    // Calcolo dell'aspect ratio
    const aspectRatio = imageTexture.width / imageTexture.height;

    // Creazione della geometria basata sull'aspect ratio
    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshBasicMaterial({ map: imageTexture });
    const plane = new THREE.Mesh(geometry, material);

    return plane;
  }

  nextImage() {
    if (this.currentImageIndex < this.imageURLs.length - 1) {
      this.currentImageIndex++;
      this.panel.material.map = this.textures[this.currentImageIndex];

      if (this.currentImageIndex === this.imageURLs.length - 1) {
        // Se siamo alla fine, cambia il colore del materiale del pulsante next in grigio
        this.nextButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray
      }

      // Se abbiamo superato l'immagine di partenza, ripristina il colore del pulsante previous
      if (this.currentImageIndex > 0) {
        this.previousButton.material.color.set(0xffffff);  // 0xffffff is the hexadecimal color for white
      }
    }
  }

  previousImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
      this.panel.material.map = this.textures[this.currentImageIndex];

      if (this.currentImageIndex === 0) {
        // Se siamo tornati all'immagine di partenza, cambia il colore del materiale del pulsante previous in grigio
        this.previousButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray
      }

      // Se abbiamo superato l'immagine finale, ripristina il colore del pulsante next
      if (this.currentImageIndex < this.imageURLs.length - 1) {
        this.nextButton.material.color.set(0xffffff);  // 0xffffff is the hexadecimal color for white
      }
    }
  }

  getPanel() {
    //set Visibility
    this.toggleVisibility();
    return this.panel;
  }

  toggleVisibility() {
    this.visible = !this.visible;
    this.panel.visible = this.visible;
    //this.previousButton.visible = this.visible;
    //this.nextButton.visible = this.visible;
  }
}

export default ImagePanel;
