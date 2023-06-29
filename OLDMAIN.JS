import * as THREE from "three";
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod';
import { loadGLTF, loadAudio, loadVideo, loadTexture } from './public/libs/loader.js';
import PanelText from "./public/libs/PanelText.js"; 




//AR ENGINE
var renderer, scene, camera;
//Sources
var audioSource,videoSource,textureText,canvasText;
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
const pathSpriteImgBtn = "./Resources/Sprites/img.png";
const pathSpriteVideoBtn = "./Resources/Sprites/video.png";
const pathSpriteAudioBtn = "./Resources/Sprites/audio.png";
const pathSpriteTxtBtn = "./Resources/Sprites/txt.png";


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
      let audioButton = createButtonWithTexture(pathSpriteAudioBtn);
      audioButton.position.copy(corners[0]);
      anchorTemp.group.add(audioButton);
      audioSource = await createAudio(item.audio, listener);
    }

    if(item.video) {
      let videoButton =  createButtonWithTexture(pathSpriteVideoBtn);
      videoButton.position.copy(corners[1]);
      anchorTemp.group.add(videoButton);
      videoPanel=await createVideoPanel(item.video,listener);
      videoPanel.visible=false;
      videoButton.add(videoPanel);
    }

    if(item.image) {
      let imageButton =  createButtonWithTexture(pathSpriteImgBtn);
      imageButton.position.copy(corners[3]);
      anchorTemp.group.add(imageButton);
      imagePanel =await createImagePanel(item.image);
      imagePanel.position.copy(new THREE.Vector3(0,0.35,0));
      imagePanel.visible=false;
      imageButton.add(imagePanel);
    }

    if(item.text) {
      let textButton = createButtonWithTexture(pathSpriteTxtBtn);
      textButton.position.copy(corners[2]);
      anchorTemp.group.add(textButton);
      let textPanelObj = new PanelText();
      textPanel = await textPanelObj.create(item.text,raycaster,camera, scene);
      textPanel.visible=false;
      textButton.add(textPanel);
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

async function createModel(url, position, rotation, scale) {
  const gltf = await loadGLTF(url);
  const model = gltf.scene;

  // Aggiungi le trasformazioni
  model.position.set(position.x, position.y, position.z);
  model.scale.set(scale.x, scale.y, scale.z);
  model.rotation.set(rotation.x, rotation.y, rotation.z);

  return model;
}
async function createImage(url) {
  const texture = await loadTexture(url);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const geometry = new THREE.PlaneGeometry(0.1, 0.1);
  return new THREE.Mesh(geometry, material);
}

async function createImagePanel(url){
  let imageTexture = await loadTexture(url);
  const img = imageTexture.image;

  // Calcolo dell'aspect ratio
  const aspectRatio = img.width / img.height;

  // Creazione della geometria basata sull'aspect ratio
  let geometry = new THREE.PlaneGeometry(aspectRatio, 1);

  let material = new THREE.MeshBasicMaterial({map: imageTexture});
  let plane = new THREE.Mesh(geometry, material);

  return plane;
}//createImagePanel(url)

async function createVideoPanel(url, listener) {
  
  try {
    videoSource = await loadVideo(url);
    // Calcola l'aspect ratio del video
    const aspectRatio = videoSource.videoWidth / videoSource.videoHeight;
    // Make sure the video is actually loaded
    if (!videoSource) {
      throw new Error("Video did not load");
    }
    
    const videoTexture = new THREE.VideoTexture(videoSource);
    const material = new THREE.MeshBasicMaterial({ map: videoTexture });

    const audio = await createAudio(url, listener);

    const geometry = new THREE.PlaneGeometry(aspectRatio,1);
    const videoPanel = new THREE.Mesh(geometry, material);

    // Add audio to the video panel
    videoPanel.add(audio);
    
    return videoPanel;

  } catch (error) {
    console.error("Failed to create video panel:", error);
    return null;
  }
}

async function createAudio(url, listener) {
  const audio = new THREE.Audio(listener);
  const buffer = await loadAudio(url);
  audio.setBuffer(buffer);
  audio.setLoop(true);
  audio.setVolume(0.5);
  return audio;
}
//_______________________________________________________________________________

//________________________HANDLE EVENTS_______________________________________

async function handleAudioButton() {
  // Se l'audio non è in riproduzione, avvia la riproduzione e cambia l'immagine
  if (!state.isAudioPlaying) {
      // Supponendo che "audio" sia l'oggetto audio che hai creato
      audioSource.play();

      // Cambia l'immagine del pulsante
      const texture = await loadTexture("./Resources/Sprites/link.png");
      audioButton.material.map = texture;
      audioButton.material.needsUpdate = true;

      state.isAudioPlaying = true;
  } 
  // Se l'audio è in riproduzione, fermalo e cambia l'immagine
  else {
      audioSource.pause();

      // Cambia l'immagine del pulsante
      const texture = await loadTexture("./Resources/Sprites/audio.png");
      audioButton.material.map = texture;
      audioButton.material.needsUpdate = true;

      state.isAudioPlaying = false;
  }
}
function handleTextButton() {
  // Se il testo non è visibile, rendilo visibile
  if (!state.isTextVisible) {
    textPanel.visible = true;
    state.isTextVisible = true;
  } 
  // Se il testo è visibile, nascondilo
  else {
    textPanel.visible = false;
    state.isTextVisible = false;
  }
}
function handleVideoButton(){
  // Se il video non è visibile, mostralo e fai play
  if(!state.isVideoVisible){
    videoPanel.visible=true;
    videoSource.play();
    state.isVideoVisible=true;
    // Se il video è visibile, nascondilo e ricarica il video
  }else{
    videoPanel.visible=false;
    videoSource.load();
    state.isVideoVisible=false;
  }
}
function handleImageButton(){
  if(!state.isImageVisible){
    imagePanel.visible=true;
    state.isImageVisible=true;
    
  }else{
    imagePanel.visible=false;
    state.isImageVisible=false;
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
    
    if (intersects[i].object === imageButtonSprite) {
      handleImageButton()
    } else if (intersects[i].object === videoButtonSprite) {
      handleVideoButton();
    } else if (intersects[i].object === audioButtonSprite) {
      handleAudioButton();
    } else if (intersects[i].object === textButton) {
      handleTextButton();
    }
  }
}

function createBaseButton() {
  const geometry = new THREE.PlaneGeometry(0.1,0.1);
  const material = new THREE.MeshBasicMaterial();
  const baseButton = new THREE.Mesh( geometry, material );
  return baseButton;
}

function createButtonWithTexture(texturePath) {
  const button = createBaseButton();
  const loader = new THREE.TextureLoader();
  loader.load(texturePath, function(texture) {
    button.material.map = texture;
    button.material.needsUpdate = true;
  });
  return button;
}



