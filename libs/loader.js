import {GLTFLoader} from "../../node_modules/three/examples/jsm//loaders/GLTFLoader.js";
import * as THREE from "../../node_modules/three/build/three.module.js";

//const THREE = window.MINDAR.IMAGE? window.MINDAR.IMAGE.THREE: window.MINDAR.FACE.THREE;

export const loadGLTF = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      resolve(gltf);
    });
  });
}

export const loadAudio = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.AudioLoader();
    loader.load(path, (buffer) => {
      resolve(buffer);
    });
  });
}

export const loadVideo = (path) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.addEventListener('loadedmetadata', () => {
      video.setAttribute('playsinline', '');
      resolve(video);
    });
    video.addEventListener('error', () => {
      reject(new Error(`Failed to load video at ${path}`));
    });
    video.src = path;
    video.load();

  });
}

export const loadTexture = (path) => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(path, (texture) => {
      resolve(texture);
    }); 
  });
}

export const loadTextures = (paths) => {
  const loader = new THREE.TextureLoader();
  const promises = [];
  for (let i = 0; i < paths.length; i++) {
    promises.push(new Promise((resolve, reject) => {
      loader.load(paths[i], (texture) => {
	resolve(texture);
      }); 
    }));
  }
  return Promise.all(promises);
}
