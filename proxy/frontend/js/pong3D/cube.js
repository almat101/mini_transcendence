import * as THREE from 'three';

//base idea of how you can divide different parts of the code to  not have
//anything on the main file
export function createCube(texture)
{
	var cubeMaterials = [
		new THREE.MeshBasicMaterial({ map: texture }),
		new THREE.MeshBasicMaterial({ map: texture }),
		new THREE.MeshBasicMaterial({ map: texture }),
		new THREE.MeshBasicMaterial({ map: texture }),
		new THREE.MeshBasicMaterial({ map: texture }),
		new THREE.MeshBasicMaterial({ map: texture }),
	];

	const geometry = new THREE.BoxGeometry(30, 30, 30);
	const cube = new THREE.Mesh(geometry, cubeMaterials);

	return cube;
}
