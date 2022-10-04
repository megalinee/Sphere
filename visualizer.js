/*
    =============
    -  IMPORTS  -
    =============
*/

import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";

import { EffectComposer } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/AfterimagePass.js';

import { FXAAShader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/shaders/FXAAShader.js';

import * as DAT from 'https://unpkg.com/dat.gui@0.7.7/build/dat.gui.module.js';


/*
    =========
    -  GUI  -
    =========
*/

let songchoices;

const gui = new DAT.GUI({
    'closed': false,
    'closeOnTop': true
});

let choices = {
    'Song': "Shuffle",
    'Color': 0xff
}

async function getJSON(jsonName) {
    const response = await fetch(jsonName)
    const result = await response.json();
    return result;
}

getJSON("songchoice.json").then(songchoicesJSON => {
    console.log(songchoicesJSON)
    songchoices = songchoicesJSON;
    let songlist = Object.assign({ "Shuffle": "Shuffle" }, songchoicesJSON)
    gui.add(choices, 'Song', songlist).onChange(changeSong);
    changeSong()
    gui.addColor(choices, 'Color')
})


/*
    =============
    -  OBJECTS  -
    =============
*/

const scene = new THREE.Scene();

const sphereTexture = new THREE.TextureLoader().load('../assets/images/2k_jupiter.jpg');

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(3, 32, 32),
    new THREE.MeshStandardMaterial({
        map: sphereTexture
    })
);

scene.add(sphere);

let pivotPoint = new THREE.Object3D();
scene.add(pivotPoint)

let murads = [];

function addStar() {
    const geometry = new THREE.SphereGeometry(0.25, 24, 24);
    const material = new THREE.MeshBasicMaterial({ color: "white", wireframe: false })
    const star = new THREE.Mesh(geometry, material);

    const [x, y, z] = Array(3)
        .fill()
        .map(() => THREE.MathUtils.randFloatSpread(300));

    star.position.set(x, y, z);
    star.layers.enable(1)
    scene.add(star);
    pivotPoint.add(star);
    murads.push(star);
}

let loop = Array(1000).fill().forEach(addStar);

/*
    ==============================
    -  CAMERA & POST PROCESSING  -
    ==============================
*/

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 1000)
camera.layers.enable(1);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true
});

const controls = new OrbitControls(camera, renderer.domElement);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(1);
camera.position.setX(10);

let light = new THREE.DirectionalLight(0xffffff, 0);
light.position.setScalar(100);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 1));

let renderScene = new RenderPass(scene, camera)

let effectFXAA = new ShaderPass(FXAAShader)
effectFXAA.uniforms.resolution.value.set(1 / window.innerWidth, 1 / window.innerHeight)

let bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85)
bloomPass.threshold = .25
bloomPass.strength = .5
bloomPass.radius = .75
bloomPass.renderToScreen = true

const trailPass = new AfterimagePass();

let composer = new EffectComposer(renderer)
composer.setSize(window.innerWidth, window.innerHeight)

composer.addPass(renderScene)
composer.addPass(effectFXAA)
composer.addPass(bloomPass)
composer.addPass(trailPass)


renderer.toneMappingExposure = 1


/*
    ===========
    -  MUSIC  -
    ===========
*/

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);

let playedOnce = false;


const audioLoader = new THREE.AudioLoader();


function changeSong() {
    let song;
    if (choices['Song'] == "Shuffle") {
        song = getRandomSong(songchoices)
    } else {
        song = choices['Song']
    }
    try {
        sound.stop();
    } catch (err) { }
    document.getElementById('start').innerHTML = 'LOADING MUSIC...'
    let songLink = "../assets/audio/" + song;
    audioLoader.load(songLink, function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(50);
        sound.setLoop(false);
        sound.setVolume(0.5);
        if (choices['Song'] == "Shuffle") {
            sound.onEnded = function () {
                changeSong()
            }
        } else {
            sound.setLoop(true);
        }
        if (!playedOnce) {
            jQuery("#start").on('click tap touchstart', function () {
                if (document.getElementById('start').innerHTML != 'LOADING MUSIC...') {
                    sound.context.resume().then(() => {
                        console.log('Playback resumed successfully');
                        sound.play();
                        playedOnce = true;
                        document.getElementById('start').innerHTML = ''
                        document.getElementById('blOverlay').innerHTML = ''
                    });
                }
            });
            document.getElementById('start').innerHTML = 'CLICK TO PLAY MUSIC'
        } else {
            document.getElementById('start').innerHTML = ''
            sound.play();
        }

    });
}

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    let keyCode = event.which;
    if (keyCode == 32 && playedOnce) {
        if (sound.isPlaying) {
            document.getElementById('start').innerHTML = 'PAUSED'
            sound.pause();
        } else {
            document.getElementById('start').innerHTML = ''
            sound.play();
        }
    }
}

sphere.add(sound);

const analyser = new THREE.AudioAnalyser(sound, 32);


/*
    ===============
    -  ANIMATION  -
    ===============
*/

const isMobile = /Mobi/i.test(window.navigator.userAgent)  // Checks if user is on mobile

let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);

let clock = new THREE.Clock(); // Clock to maintain consistent FPS
let delta = 0;
let interval = 1 / 60;

let color = 0;
let strength = 0;

function animate() {
    requestAnimationFrame(animate);

    delta += clock.getDelta();
    if (delta > interval) {
        renderer.autoClear = false;
        renderer.clear();

        const data = analyser.getAverageFrequency();  // Gets audio data for visualization
        dataArray = analyser.getFrequencyData();
        let lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
        let upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);
        let lowerFreqAvg = avg(upperHalfArray);
        let lowerFreqMin = min(upperHalfArray);
        let higherFreqMin = min(lowerHalfArray);

        /* FOR ROTATING CIRCLES
        murads.forEach((murad) => {
            murad.rotation.x += (0.001) * data;
            murad.rotation.y += (0.0005) * data;
            murad.rotation.z += (0.001) * data;
        })
        */

        sphere.rotation.y += .001

        pivotPoint.rotation.y += (Math.random() + data) * .000025 + .0001;
        pivotPoint.rotation.x += (Math.random() + lowerFreqMin) * .000025;
        pivotPoint.rotation.z += (Math.random() + data) * .000025;


        color = gradualChange((lowerFreqAvg / 255), color, .002)  // Generates color brightness

        renderer.setClearColor(choices.Color, color);

        if (!isMobile) {  // Disables bloom on mobile due to performance issues
            trailPass.uniforms["damp"].value = data * .00225;
            strength = gradualChange(higherFreqMin * .0045, strength, .05)
            bloomPass.strength = strength

            camera.layers.set(1);

            composer.render();

            renderer.clearDepth();
            camera.layers.set(0);
        }

        controls.update();
        renderer.render(scene, camera);

        delta = delta % interval;
    }
}

animate();


/*
    ==========
    -  MISC  -
    ==========
*/

function gradualChange(goal, prevValue, sens) {
    if (prevValue < goal) {
        return prevValue + sens;
    } else if (prevValue > goal) {
        return prevValue - sens;
    } else {
        return prevValue;
    }
}

function getRandomSong(choices) {
    return choices[Object.keys(choices)[Math.floor(Math.random() * Object.keys(choices).length)]];
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function avg(arr) {
    if (arr.length > 0) {
        let total = arr.reduce(function (sum, b) { return sum + b; });
        return (total / arr.length);
    }
}

function max(arr) {
    return arr.reduce(function (a, b) { return Math.max(a, b); })
}

function min(arr) {
    return arr.reduce(function (a, b) { return Math.min(a, b); })
}