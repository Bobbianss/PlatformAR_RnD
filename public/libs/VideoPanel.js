import * as THREE from "../../node_modules/three/build/three.module.js";
import ButtonCreator from "./ButtonCreator";
import { loadVideo } from "./loader";

import pathPlayBtn from "../Resources/Sprites/img.png";
import pathPauseBtn from "../Resources/Sprites/iframe.png";

class VideoPanel {
 
    constructor(videoURL, audioSource) {
      this.videoURL = videoURL;
      this.audioURL = audioSource;
      this.videoSource = null;
      this.visible=true;
      this.audioSource = null;
      this.isPlaying = false;
      this.panel = null;
      this.playButton = null;
      this.buttonCreator = new ButtonCreator();
      
    }

    async createPanel() {
      try {
        this.videoSource = await loadVideo(this.videoURL);
        // this.audioSource = await createAudio(this.audioURL);
        this.videoSource.audioSource=this.audioSource;
        const aspectRatio = this.videoSource.videoWidth / this.videoSource.videoHeight;
        const videoTexture = new THREE.VideoTexture(this.videoSource);
        const material = new THREE.MeshBasicMaterial({ map: videoTexture });
  
        const geometry = new THREE.PlaneGeometry(aspectRatio, 1);
        this.panel = new THREE.Mesh(geometry, material);
  
        this.playButton = this.buttonCreator.createButton(pathPlayBtn, () => {
          this.togglePlayPause();
        });
  
        this.playButton.position.set(this.panel.position.x , this.panel.position.y-0.35, this.panel.position.z+0.01);
        this.panel.add(this.playButton);
        this.toggleVisibility();
        return this.panel;
      } catch (error) {
        console.error("Failed to create video panel:", error);
        return null;
      }
    }
  
    togglePlayPause() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }
  
    play() {
      this.videoSource.play();
      this.playButton.material.map= this.buttonCreator.createTexture(pathPauseBtn);
      // this.audioSource.play();
      this.isPlaying = true;
    }
  
    pause() {
      this.videoSource.pause();
      this.playButton.material.map= this.buttonCreator.createTexture(pathPlayBtn);
      // this.audioSource.pause();
      this.isPlaying = false;
    }
  
    toggleVisibility() {
        this.visible = !this.visible;
        this.panel.visible = this.visible;
        //this.previousButton.visible = this.visible;
        //this.nextButton.visible = this.visible;
    }

  }
  
  export default VideoPanel;
  
