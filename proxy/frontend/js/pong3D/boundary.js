import * as THREE from 'three';
//values for the thernary
export class PlayArea {
	constructor(width, depth) {
		this.width = width;   // X-axis (left-right)
		this.depth = depth;   // Z-axis (forward-backward)

		// Create a simple plane surface
		//we don't need verticality in this case
		this.geometry = new THREE.PlaneGeometry(width, depth);
		//!chess pattern solution
		const size = 512;
		const divisions = 8;
		//* we literally create our texture handmade
		const canvas = document.createElement('canvas');
		canvas.height = size;
		canvas.width = size;
		const context = canvas.getContext('2d');
		//*we draw the squares on the canvas
		for (let i = 0; i < divisions; i++){
			for (let j = 0; j < divisions; j++){
				context.fillStyle = (i + j) % 2 === 0 ? '#641e16' : '#17202a';
				context.fillRect(i * size / divisions, j * size / divisions, size / divisions, size / divisions);
			}
		}

		const texture = new THREE.CanvasTexture(canvas);
		const material = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
		this.mesh = new THREE.Mesh(this.geometry, material);
		this.mesh.rotation.x = Math.PI / 2; // Rotate to horizontal
	}

	getBoundaries() {
		return {
			left: -this.width/2,
			right: this.width/2,
			front: -this.depth/2,
			back: this.depth/2
		};
	}
}
