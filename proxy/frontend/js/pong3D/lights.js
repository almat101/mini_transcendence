import * as THREE from 'three';

export function createLight()
{
	const ambientLight = new THREE.AmbientLight(0x404040);
	return (ambientLight);
}


