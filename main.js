import * as THREE from "three";
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod';
import { loadGLTF, loadAudio, loadVideo, loadTexture } from '/public/libs/loader.js';

var renderer, scene, camera;
var audio, videoPanel, videoSource, text, image;

let isAudioPlaying = false; // Variabile per tenere traccia dello stato della riproduzione
let isTextVisible = false;
let isVideoVisible=false;




let arrayAnchors = [];
var models = [];
//let selector =  document.getElementById("json-cfg-url").value;
//const urlParams = new URLSearchParams(window.location.search);
//const id = urlParams.get('json-cfg-url');
let id = document.getElementById('json-cfg-url').value;
console.log("DAMMI PARAMETRO" + id); // stampa "123"


var imageButton, videoButton, audioButton, textButton;

// Crea un Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Creare un listener audio e aggiungerlo alla camera
const listener = new THREE.AudioListener();

document.addEventListener('DOMContentLoaded', async () => {

  [audioButton, videoButton, imageButton, textButton] = await Promise.all([
    createImage("./Resources/Sprites/audio.png"),
    createImage("./Resources/Sprites/video.png"),
    createImage("./Resources/Sprites/img.png"),
    createImage("./Resources/Sprites/txt.png"),
  ]);



  const { mind, ARitems } = await loadARItems(id);

  const start = async () => {

    const mindarThree = new MindARThree({
      container: document.body,
      imageTargetSrc: mind,
      maxTrack: 30,
    });

    renderer  = mindarThree.renderer;
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

    audioButton.position.copy(corners[0]);
    videoButton.position.copy(corners[1]);
    textButton.position.copy(corners[2]);
    imageButton.position.copy(corners[3]);

    models.push(modelTemp);
    const anchorTemp = mindarTemp.addAnchor(index);
    anchorTemp.group.add(modelTemp.scene);
    anchorTemp.group.add(identifyBBox(modelTemp));

    //add Buttons
    anchorTemp.group.add(audioButton);
    anchorTemp.group.add(videoButton);
    anchorTemp.group.add(imageButton);
    anchorTemp.group.add(textButton);
    
      audio = await createAudio(item.audio, listener);
      text = await createTextPanel(item.text);
      videoPanel=await createVideoPanel(item.video,listener);

      text.visible=false;
      videoPanel.visible=false;

      textButton.add(text);
      videoButton.add(videoPanel);




    anchorTemp.onTargetFound = () => {

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
async function createTextPanel(text) {
  // Crea una texture di testo
  let texture = createTextTexture(text);

  // Crea un materiale utilizzando la texture
  let material = new THREE.MeshBasicMaterial({ map: texture });

  // Crea un piano utilizzando il materiale
  let geometry = new THREE.PlaneGeometry(1, 0.5);
  let plane = new THREE.Mesh(geometry, material);

  return plane;
}


async function createVideoPanel(url, listener) {
  
  videoSource = await loadVideo(url);
  const videoTexture = new THREE.VideoTexture(videoSource);
  const material = new THREE.MeshBasicMaterial({ map: videoTexture });

  const audio = await createAudio(url, listener);

  const geometry = new THREE.PlaneGeometry();
  const videoPanel = new THREE.Mesh(geometry, material);

  // Add audio to the video panel
  videoPanel.add(audio);
  
  return videoPanel;
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

function createTextTexture(text) {
  // Creare un elemento canvas
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');

  // Imposta le dimensioni del canvas
  canvas.width = 1024;
  canvas.height = 512;

  // Imposta lo stile del testo
  context.font = '60px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Disegna il testo al centro del canvas
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Crea una texture da canvas
  let texture = new THREE.Texture(canvas);

  // Aggiorna la texture
  texture.needsUpdate = true;

  return texture;
}


//________________________HANDLE EVENTS_______________________________________

async function handleAudioButton() {
  // Se l'audio non è in riproduzione, avvia la riproduzione e cambia l'immagine
  if (!isAudioPlaying) {
      // Supponendo che "audio" sia l'oggetto audio che hai creato
      audio.play();

      // Cambia l'immagine del pulsante
      const texture = await loadTexture("./Resources/Sprites/link.png");
      audioButton.material.map = texture;
      audioButton.material.needsUpdate = true;

      isAudioPlaying = true;
  } 
  // Se l'audio è in riproduzione, fermalo e cambia l'immagine
  else {
      audio.pause();

      // Cambia l'immagine del pulsante
      const texture = await loadTexture("./Resources/Sprites/audio.png");
      audioButton.material.map = texture;
      audioButton.material.needsUpdate = true;

      isAudioPlaying = false;
  }
}

function handleTextButton() {
  // Se il testo non è visibile, rendilo visibile
  if (!isTextVisible) {
    text.visible = true;
    isTextVisible = true;
  } 
  // Se il testo è visibile, nascondilo
  else {
    text.visible = false;
    isTextVisible = false;
  }
}
function handleVideoButton(){
  // Se il video non è visibile, mostralo e fai play
  if(!isVideoVisible){
    videoPanel.visible=true;
    videoSource.play();
    isVideoVisible=true;
    // Se il video è visibile, nascondilo e ricarica il video
  }else{
    videoPanel.visible=false;
    videoSource.load();
    isVideoVisible=false;
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
      console.log("IMAGE");
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
    if (intersects[i].object === imageButton) {
      console.log("IMAGE");
    } else if (intersects[i].object === videoButton) {
      handleVideoButton();
    } else if (intersects[i].object === audioButton) {
      handleAudioButton();
    } else if (intersects[i].object === textButton) {
      handleTextButton();
    }
  }
}