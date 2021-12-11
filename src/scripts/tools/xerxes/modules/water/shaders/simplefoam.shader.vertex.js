const vert = `
varying vec4 WorldPosition;
varying vec2 vUv;
uniform float uTime;
uniform float uDistance;
uniform float uDistanceMax;

void main(void) {
    vUv = uv;
    vec3 pos = position;

    if ( uDistance < uDistanceMax * 3.0 ) {
        pos.z += sin( uTime * 2.0 ) * 0.015;
    } else {
        pos.z = 0.0;
    }
	
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    WorldPosition = modelMatrix * vec4(pos, 1.0);
    
}
`

export { vert }