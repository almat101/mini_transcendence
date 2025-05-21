import * as THREE from 'three'

export function lateralWalls()
{
	const wallGeometry = new THREE.CapsuleGeometry(2.5, 60, 50);
	const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const wall = new THREE.Mesh(wallGeometry, wallMaterial);

	wall.rotation.x = Math.PI / 2;

	return (wall);
}
