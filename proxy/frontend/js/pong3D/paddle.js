import * as THREE from 'three';

export function createPaddle(texture) {
	const geometry = new THREE.BoxGeometry(8, 5.5, 1);  // Width, height, depth


	const material = new THREE.MeshBasicMaterial({ map:texture });

	//!to understand more in order to flip the images
	//manually
	//! for now this is not working
	// 	// Adjust UV mapping to flip the texture vertically
	// 	geometry.faceVertexUvs[0].forEach(face => {
	// 	face.forEach(uv => {
	// 		uv.y = 1 - uv.y;
	// 	});
	// });
	const paddle = new THREE.Mesh(geometry, material);


	return paddle;
}
