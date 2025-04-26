import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from "gsap";
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger)
// Vertex shader
const vertexShader = `
// Description : Array and textureless GLSL 2D/3D/4D simplex 
// noise functions.
// Author : Ian McEwan, Ashima Arts.
// Maintainer : ijm
// Lastmod : 20110822 (ijm)
// License : Copyright (C) 2011 Ashima Arts. All rights reserved.
// Distributed under the MIT License. See LICENSE file.
// https://github.com/ashima/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

uniform float uTime;
varying float vElevation;
varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 pos = vec4(position, 1.0);
    vec4 modelPos = modelViewMatrix * pos;
    float elevation = snoise(position * 0.3 + uTime * 0.6) * 0.4;
    vElevation = elevation;
    modelPos.xyz += normal * elevation;
    gl_Position = projectionMatrix * modelPos;
  }
`;

// Fragment shader
const fragmentShader = `
varying vec2 vUv;
uniform float uColor;
varying float vElevation;
  void main() {
    vec4 c4 = vec4( 1.0 + uColor * 0.8, 0.36 + uColor * 0.8, 0.0 + uColor*0.4 ,1.);
    gl_FragColor = c4; 
  }
`;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#canvas'),
  antialias: true
});


renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Create icosahedron
const geometry = new THREE.IcosahedronGeometry(3 , 50 , 50);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: {
        value: 0
    },
    uColor:{
      value: 0
    }
  }
});

const icosahedron = new THREE.Mesh(geometry, material);
scene.add(icosahedron);
icosahedron.position.y = -3;

camera.position.z = 5;

  var tl = gsap.timeline({
    scrollTrigger:{
      trigger: ".landing",
      start: "top top",
      end: "bottom center",
      scrub: 2.0,
    }
  });

tl.to(icosahedron.position , {
  y: 0,
  z: -4,
  ease: "power2.inOut",
} , "a")
.to(material.uniforms.uColor , {
  value: 0.9,
  ease: 'linear'
} , "a")

const clock = new THREE.Clock();
// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  material.uniforms.uTime.value = clock.getElapsedTime();
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

const races = document.querySelector(".words");
let width = races.offsetWidth;
let scroll = width - window.innerWidth;

const tween = gsap.to(races , {
  x: -scroll,
  ease: "none",
  duration: 3,
})

const scrollTween = ScrollTrigger.create({
  trigger: ".wrapper",
  start: "top 10%",
  end: "+=" + scroll,
  animation: tween,
  scrub: 1,
  pin: true,
  markers: true,
});