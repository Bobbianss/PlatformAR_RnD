import * as THREE from "three";
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod';
import { loadGLTF, loadAudio, loadVideo, loadTexture } from './public/libs/loader.js';
import ButtonCreator from "./public/libs/ButtonCreator.js";
import TextPanel from "./public/libs/TextPanel";
import ImagePanel from "./public/libs/ImagePanel.js";
import VideoPanel from "./public/libs/VideoPanel.js";


var buttonCreator= new ButtonCreator();

//AR ENGINE
var renderer, scene, camera;
//Sources
var audioSource,videoSource;
//Panels - Container 3D
var videoPanel,textPanel, imagePanel;
//State of Media
let state = {
  isAudioPlaying: false,
  isTextVisible: false,
  isVideoVisible: false,
  isImageVisible: false
};

let arrayAnchors = [];
var models = [];

//read variable path of json file
let id = document.getElementById('json-cfg-url').value;

//PATH SPRITES -> Buttons
const pathSpriteImgBtn = "Resources/Sprites/img.png";
const pathSpriteVideoBtn = "Resources/Sprites/video.png";
const pathSpriteAudioBtn = "Resources/Sprites/audio.png";
const pathSpriteTxtBtn = "Resources/Sprites/txt.png";


// Raycaster
let raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let startY = 0;
let direction = 0;
let isMouseDown = false;
const scrollSpeed = 0.01;

// Creare un listener audio e aggiungerlo alla camera
const listener = new THREE.AudioListener();

document.addEventListener('DOMContentLoaded', async () => {

  const { mind, ARitems } = await loadARItems(id);
  const start = async () => {
  const mindarThree = new MindARThree({
    container: document.body,
    imageTargetSrc: mind,
    maxTrack: 30,
  });
    renderer= mindarThree.renderer;
    scene=mindarThree.scene;
    camera=mindarThree.camera;

    camera.add(listener);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    loadModels(ARitems, mindarThree);

    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    //-----------------------EVENTS ASSIGN---------------------------------

    window.addEventListener('touchstart', onTouchStart, false);  
    window.addEventListener('mousedown', onMouseDown, false);
      
    
  } // end start


  start();

 



}); // end DOMContentLoaded

async function loadARItems(pathJsonFile) {
  try {
    const response = await fetch(pathJsonFile);
    if (!response.ok) {
      throw new Error('Errore nel caricamento del file JSON');
    }

    const data = await response.json();
    const ARitems = [];

    data.ARitems.forEach(item => {
      const ARitem = {
        name: item.name,
        model: item.dummy,
        text: item.artext,
        image: item.arimage,
        video: item.arvideo,
        audio: item.araudio,
        position: new THREE.Vector3(item.position_x, item.position_y, item.position_z),
        rotation: new THREE.Vector3(item.rotation_x, item.rotation_y, item.rotation_z),
        scale: new THREE.Vector3(item.scale_x, item.scale_y, item.scale_z)
      };



      ARitems.push(ARitem);
    });

    return { mind: data.Mind, ARitems };
  } catch (error) {
    console.error('Si è verificato un errore:', error);
  }
}

async function loadModels(ARitems, mindarTemp) {
  for (let index = 0; index < ARitems.length; index++) {
    const item = ARitems[index];
    const modelTemp = await loadGLTF(item.model);

    modelTemp.scene.scale.copy(item.scale);
    modelTemp.scene.position.copy(item.position);
    modelTemp.scene.rotation.copy(item.rotation);

    modelTemp.scene.children[0].geometry.computeBoundingBox();
    const bbox = new THREE.Box3().setFromObject(modelTemp.scene);

    const corners = [
      new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z),
      new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.max.z),
      new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.max.z),
    ];

    models.push(modelTemp);
    let anchorTemp = mindarTemp.addAnchor(index);
    anchorTemp.group.add(modelTemp.scene);
    anchorTemp.group.add(identifyBBox(modelTemp));

    // Conditionally add Buttons
    if(item.audio) {
      let audioButton = buttonCreator.createButton(pathSpriteAudioBtn,()=>console.log("sono un audio"));
      audioButton.position.copy(corners[0]);
      anchorTemp.group.add(audioButton);
      audioSource = await createAudio(item.audio, listener);
    }

    if(item.video) {
      let videoPanel= new VideoPanel(item.video,listener);
      let meshPanel= await videoPanel.createPanel();
      let videoButton = buttonCreator.createButton(pathSpriteVideoBtn,()=>videoPanel.toggleVisibility());
      videoButton.position.copy(corners[1]);
      anchorTemp.group.add(videoButton);
      videoButton.add(meshPanel);
    }

    if(item.image) {
      let imagePanel= new ImagePanel([item.image,item.image]);
      let panelMesh=imagePanel.getPanel();
      let imageButton =  buttonCreator.createButton(pathSpriteImgBtn, ()=>imagePanel.toggleVisibility());
      imageButton.position.copy(corners[3]);
      anchorTemp.group.add(imageButton);
      imageButton.add(panelMesh);
    }

    if(item.text) {
      let textPanel = new TextPanel(item.text)
      let panelMesh = textPanel.getPanel();
      let textButton = buttonCreator.createButton(pathSpriteTxtBtn, ()=>textPanel.toggleVisibility());
      textButton.position.copy(corners[2]);
      anchorTemp.group.add(textButton);
      textButton.add(panelMesh);
    }

    anchorTemp.onTargetFound = () => {
      // scene.add(anchorTemp.group);
    }
    anchorTemp.onTargetLost = () => {

    }
    arrayAnchors.push(anchorTemp);
  }
}//[m]loadModels



function identifyBBox(tempModel) {
  tempModel.scene.children[0].geometry.computeBoundingBox();

  console.log(tempModel.scene.children[0].geometry);
  let box = new THREE.Box3().setFromObject(tempModel.scene);
  let helper = new THREE.Box3Helper(box, 0xfffff00);
  return helper;
}


async function createAudio(url, listener) {
  const audio = new THREE.Audio(listener);
  const buffer = await loadAudio(url);
  audio.setBuffer(buffer);
  audio.setLoop(true);
  audio.setVolume(0.5);
  return audio;
}

//________________________HANDLE EVENTS_______________________________________

async function handleAudioButton() {
  // Se l'audio non è in riproduzione, avvia la riproduzione e cambia l'immagine
  if (!state.isAudioPlaying) {
      // Supponendo che "audio" sia l'oggetto audio che hai creato
      audioSource.play();

      // Cambia l'immagine del pulsante
      const texture = await loadTexture("Resources/Sprites/link.png");
      audioButton.material.map = texture;
      audioButton.material.needsUpdate = true;

      state.isAudioPlaying = true;
  } 
  // Se l'audio è in riproduzione, fermalo e cambia l'immagine
  else {
      audioSource.pause();

      // Cambia l'immagine del pulsante
      const texture = await loadTexture("Resources/Sprites/audio.png");
      audioButton.material.map = texture;
      audioButton.material.needsUpdate = true;

      state.isAudioPlaying = false;
  }
}


//______________________________EVENTS FUNCTIONS________________________________

function onTouchStart(event) {
  event.preventDefault();

  // Calcola le coordinate del mouse nel sistema di coordinate normalizzato (-1 a +1)
  mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

  // Aggiorna il raggio con le coordinate del mouse
  raycaster.setFromCamera(mouse, camera);

  // Calcola gli oggetti che intersecano il raggio
  let intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    if (intersects[i].object === imageButton) {
      handleImageButton()
    } else if (intersects[i].object === videoButton) {
      handleVideoButton();
    } else if (intersects[i].object === audioButton) {
      handleAudioButton();
    } else if (intersects[i].object === textButton) {
      handleTextButton();
    }
  }
}

function onMouseDown(event) {
  event.preventDefault();

  // Calcola le coordinate del mouse nel sistema di coordinate normalizzato (-1 a +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Aggiorna il raggio con le coordinate del mouse
  raycaster.setFromCamera(mouse, camera);

  // Calcola gli oggetti che intersecano il raggio
  let intersects = raycaster.intersectObjects(scene.children, true);
 
  for (let i = 0; i < intersects.length; i++) {
    
   
    if(typeof intersects[i].object.onClick==='function'){
      intersects[i].object.onClick();
    }
  }
}





