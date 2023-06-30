import * as THREE from "../../node_modules/three/build/three.module.js";
import ButtonCreator from "./ButtonCreator.js";

import pathPreviBtn from "../Resources/Sprites/img.png";
import pathNextBtn from "../Resources/Sprites/audio.png";

class TextPanel {
  constructor(text) {
    this.text = text;
    this.visible = true;
    this.currentChunkIndex = 0;
    this.chunks = this.splitTextIntoChunks(text, 525); // 550 numero di caratteri
    this.textures = this.createTexturesForChunks(this.chunks);


    this.panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ map: this.textures[0] })
    );

    let buttonCreator = new ButtonCreator();

    if (this.chunks.length > 1) {
      // Imposta inizialmente il pulsante "precedente" a grigio
      this.previousButton = buttonCreator.createButton(pathPreviBtn, null);
      this.previousButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray

      this.nextButton = buttonCreator.createButton(pathNextBtn,
        () => {
          if (this.visible && this.currentChunkIndex < this.chunks.length - 1) {
            this.currentChunkIndex++;
            this.panel.material.map = this.textures[this.currentChunkIndex];

            // Se non siamo all'inizio, cambia il colore del materiale del pulsante "precedente" a bianco
            this.previousButton.material.color.set(0xFFFFFF);  // 0xFFFFFF is the hexadecimal color for white
            console.log("GO");
            if (this.currentChunkIndex === this.chunks.length - 1) {
              // Se siamo alla fine, cambia il colore del materiale del pulsante "successivo" a grigio
              this.nextButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray
            }
          }
        }
      );

      this.previousButton.onClick = () => {
        if (this.visible && this.currentChunkIndex > 0) {
          this.currentChunkIndex--;
          this.panel.material.map = this.textures[this.currentChunkIndex];
          console.log("back");
          // Se non siamo alla fine, cambia il colore del materiale del pulsante "successivo" a bianco
          this.nextButton.material.color.set(0xFFFFFF);  // 0xFFFFFF is the hexadecimal color for white

          if (this.currentChunkIndex === 0) {
            // Se siamo all'inizio, cambia il colore del materiale del pulsante "precedente" a grigio
            this.previousButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray
          }
        }
      };
    } else {
      this.previousButton = buttonCreator.createButton(pathPreviBtn, null);
      this.previousButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray
      this.nextButton = buttonCreator.createButton(pathNextBtn, null);
      this.nextButton.material.color.set(0x808080);  // 0x808080 is the hexadecimal color for gray
    }



    // Posiziona i pulsanti a destra e a sinistra del pannello
    this.nextButton.position.set(0.1, 0, 0);
    this.previousButton.position.set(-0.1, 0, 0);
    let groupBtn = new THREE.Group();

    groupBtn.add(this.nextButton);
    groupBtn.add(this.previousButton);
    groupBtn.position.set(0, -0.2, 0.01);
    this.panel.add(groupBtn);

  }

  splitTextIntoChunks(text, chunkSize) {
    let chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  createTexturesForChunks(chunks) {
    let textures = [];
    for (let chunk of chunks) {
      let texture = this.createTextTexture(chunk);
      textures.push(texture);
    }
    return textures;
  }

  createTextTexture(text) {
    // Creare un elemento canvas
    let canvasText = document.createElement('canvas');
    let context = canvasText.getContext('2d');

    // Imposta le dimensioni del canvas
    canvasText.width = 512;
    canvasText.height = 512;

    // Imposta lo stile del testo 
    context.font = '25px Arial';
    context.fillStyle = 'white';

    // Disegna il testo al centro del canvas
    this.wrapText(context, text, 10, 30, canvasText.width, 30);

    // Crea una texture da canvas
    let textureText = new THREE.Texture(canvasText);

    // Aggiorna la texture
    textureText.needsUpdate = true;

    return textureText;
  }
  wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  }
  getPanel() {
    //set Visibility
    this.toggleVisibility();
    return this.panel;
  }

  toggleVisibility() {
    this.visible = !this.visible;
    this.panel.visible = this.visible;
    this.previousButton.visible = this.visible;
    this.nextButton.visible = this.visible;
  }
}

export default TextPanel;