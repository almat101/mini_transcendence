import * as THREE from 'three';
import { PlayArea } from './boundary.js';
import { createPaddle } from './paddle.js';
import { createBall } from './ball.js';
import { createLight } from './lights.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { lateralWalls } from './wall.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Navbar } from '../components/navbar.js';
import { userService } from '../services/userService.js';
import { create_local_game } from '../pong/history.js';


export async function initializeGame3D(Navbar) {
  hideAllPong(Navbar);
	const userData = userService.getUserData();
  document.getElementById('gameCanvas3d').style.display = 'block';

  //!testing out with global variables
  let gameOver = false;
  let leftScore = 0;
  let rightScore = 0;
  let container = document.getElementById('pong-container');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(80, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas3d') });
  const player1Name = userData.username;
  document.getElementById("gameOver").addEventListener('click', () => showPongMenu(Navbar));
  renderer.setSize(container.clientWidth, container.clientHeight);
  //* to have the container work with a div of our choice we need to append the render to it
  container.appendChild(renderer.domElement);

  // Play area setup
  const playArea = new PlayArea(40, 60); // Width: 40 units, Depth: 60 units
  scene.add(playArea.mesh);

  const rightWall = lateralWalls();
  rightWall.position.x = playArea.width / 2;
  rightWall.rotateY = 90;
  scene.add(rightWall);

  const leftWall = lateralWalls();
  leftWall.position.x = -playArea.width / 2;
  leftWall.rotateY = 90;
  scene.add(leftWall);

  // Paddles texture
  const loadedSkin = new THREE.TextureLoader();
  const texture = loadedSkin.load('../textures/superSqualo.jpg');
  texture.flipY = false;
  //* this if both setted at false should fix the warnings
  //* but the image as a texture will be set upside down

  const paddleUpper = createPaddle(texture);
  const paddleUnder = createPaddle(texture);
  //!potrei ruotare i paddle per avere le immagini dritte
  scene.add(paddleUpper, paddleUnder);

  paddleUpper.position.set(0, 3, -25);
	paddleUnder.position.set(0, 3, 25);
  // Create ball
  const ball = createBall();
  ball.position.set(0, 1, 0);
  scene.add(ball);

  // Camera setup
  camera.position.set(0, 30, 40);
  camera.lookAt(0, 0, 0);

  // Game state
  let ballDirection = new THREE.Vector3(0, 0, 1); // Moving forward initially
  const ballSpeed = 1;
  const paddleSpeed = 0.5;
  const winningScore = 5;

  // Controls
  const keys = {};
  document.addEventListener('keydown', (e) => keys[e.key] = true);
  document.addEventListener('keyup', (e) => keys[e.key] = false);

  // Lights for the game
  const light = createLight();
  scene.add(light);

  // Font loader for score text
  let font;
  const fontLoader = new FontLoader();
  fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
    font = loadedFont;
    createScoreText();
  });

  let rightScoreMesh = null;
  let leftScoreMesh = null;
  let winnerMesh = null;

  function createScoreText() {
    if (leftScoreMesh) scene.remove(leftScoreMesh);
    if (rightScoreMesh) scene.remove(rightScoreMesh);
    if (winnerMesh) scene.remove(winnerMesh);

    const leftScoreGeometry = new TextGeometry(leftScore.toString(), {
      font: font,
      size: 3,
      depth: 1,
      curveSegments: 12,
      bevelEnabled: false
    });
    const rightScoreGeometry = new TextGeometry(rightScore.toString(), {
      font: font,
      size: 3,
      depth: 1,
      curveSegments: 12,
      bevelEnabled: false
    });

    const material = new THREE.MeshNormalMaterial();
    leftScoreMesh = new THREE.Mesh(leftScoreGeometry, material);
    rightScoreMesh = new THREE.Mesh(rightScoreGeometry, material);

    leftScoreMesh.position.set(-10, 20, 0);
    rightScoreMesh.position.set(7, 20, 0);

    scene.add(leftScoreMesh);
    scene.add(rightScoreMesh);
  }

  function updateScores() {
    scene.remove(leftScoreMesh);
    scene.remove(rightScoreMesh);
    createScoreText();

    if (leftScore >= winningScore) {
      gameOver = true;
      scene.remove(leftScoreMesh);
      scene.remove(rightScoreMesh);
      document.getElementById('gameOver').style.display = 'block';
      createWinnerText('Upper player', rightScore, leftScore);
    } else if (rightScore >= winningScore) {
      gameOver = true;
      scene.remove(leftScoreMesh);
      scene.remove(rightScoreMesh);

      document.getElementById('gameOver').style.display = 'block';
      createWinnerText(player1Name, rightScore, leftScore);
    }
  }

  async function createWinnerText(winner,score1,score2) {
    if (winnerMesh) scene.remove(winnerMesh);
    const winnerGeometry = new TextGeometry(`${winner} wins!`, {
      font: font,
      size: 5,
      depth: 1,
      curveSegments: 12,
      bevelEnabled: false
    });

    const material = new THREE.MeshNormalMaterial();
    winnerMesh = new THREE.Mesh(winnerGeometry, material);
    winnerMesh.position.set(-playArea.width / 2, 20, 0);
    scene.add(winnerMesh);
  
    const player1_id = userData.id;
    const player1_name = userData.username;
    const player2_name = "Upper player";

    const local_1vs1_3D_payload = {
      player1_id : player1_id,
      player1_name : player1_name,
      player2_name : player2_name,
      player1_score : score1,
      player2_score : score2,
      winner : winner
    }

    //api call to create a local 3d game
    try {
      await create_local_game(local_1vs1_3D_payload);
    } catch (error) {
      console.error("Error creating local 3d game 1vs1:", error);
      alert('Failed to create local 3D game. Please try again.');
      return;
    }
  }

  function updatePaddles() {
    if (keys['a']) paddleUpper.position.x -= paddleSpeed;
    if (keys['d']) paddleUpper.position.x += paddleSpeed;
    if (keys['ArrowLeft']) paddleUnder.position.x -= paddleSpeed;
    if (keys['ArrowRight']) paddleUnder.position.x += paddleSpeed;

    const bounds = playArea.getBoundaries();
    [paddleUpper, paddleUnder].forEach(paddle => {
      paddle.position.x = THREE.MathUtils.clamp(
        paddle.position.x,
        bounds.left + 4.2 + 2.5,
        bounds.right - 4.2 - 2.5
      );
    });
  }

  function updateBall() {
    if (gameOver) return;
    ball.position.add(ballDirection.clone().multiplyScalar(ballSpeed));

    const ballBox = new THREE.Box3().setFromObject(ball);
    const paddleUpperBox = new THREE.Box3().setFromObject(paddleUpper);
    const paddleUnderBox = new THREE.Box3().setFromObject(paddleUnder);
    const leftWallBox = new THREE.Box3().setFromObject(leftWall);
    const rightWallBox = new THREE.Box3().setFromObject(rightWall);

    if (ballBox.intersectsBox(paddleUpperBox) || ballBox.intersectsBox(paddleUnderBox)) {
      ballDirection.z *= -1;
      const paddle = ballBox.intersectsBox(paddleUpperBox) ? paddleUpper : paddleUnder;
      const offset = (ball.position.x - paddle.position.x) / paddle.geometry.parameters.width;
      ballDirection.x += offset * 0.5;
      ballDirection.normalize();
    }

    if (ball.position.z < -playArea.depth / 2) {
      rightScore++;
      updateScores();
      resetBall();
    } else if (ball.position.z > playArea.depth / 2) {
      leftScore++;
      updateScores();
      resetBall();
    }

    if (ballBox.intersectsBox(leftWallBox) || ballBox.intersectsBox(rightWallBox)) {
      ballDirection.x *= -1;
    }
  }

  function resetBall() {
    ball.position.set(0, 1, 0);
    ballDirection.set(0, 0, ballDirection.z > 0 ? 1 : -1);
  }

  const controls = new OrbitControls(camera, renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);
    if (!gameOver) {
      updatePaddles();
      updateBall();
      controls.update();
      renderer.render(scene, camera);
    }
  }

  //!elements section
  function hideAllPong(Navbar) {
    document.getElementById("title").style.display = 'none';
    document.getElementById("menu").style.display = 'none';
    Navbar.style.display = 'none';

    // document.getElementById("gameCanvas3dContainer").style.display = 'block';
  }


  function showPongMenu(Navbar)
  {
    document.getElementById("title").style.display = 'block';
    document.getElementById("menu").style.display = 'block';
    Navbar.style.display = 'block';
    document.getElementById("gameOver").style.display = 'none';
    document.getElementById('gameCanvas3d').style.display = 'none';
    // texture.dispose();
    // renderer.dispose()
    // scene.remove(camera);
    // scene.remove(leftWall);
    // scene.remove(rightWall);
    // scene.remove(ball);
    // scene.remove(renderer);
    scene.clear()
  }


  paddleUpper.position.set(0, 3, -25);
  paddleUnder.position.set(0, 3, 25);
  createScoreText();
  resetBall();
  animate();
}

/*
Il problema relativo alla scena potrebbe essere risolto
se liberiamo i vari oggetti sulla scena nonché la scena stessa
vediamo in base alle info ricevute dobbiamo rimuovere
- ogni geometria quindi ogni mesh
- i materiali di ogni geometria
- le texture

*/
