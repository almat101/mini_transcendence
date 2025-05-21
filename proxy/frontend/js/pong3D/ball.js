import * as THREE from 'three';

export function createBall() {
	const geometry = new THREE.SphereGeometry(0.8, 32, 32);
	const material = new THREE.MeshBasicMaterial({ color: 0xfdfefe });
	const ball = new THREE.Mesh(geometry, material);
	return ball;
}

export function ballMovement(ball)
{

	//ball movement algorithm
	ball.rotation.x += Math.random() * 2;
	return ball;
}
