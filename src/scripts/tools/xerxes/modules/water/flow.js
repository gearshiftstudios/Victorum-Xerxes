import {
	Clock,
	Color,
	LinearEncoding,
	Matrix4,
	Mesh,
	RepeatWrapping,
	ShaderMaterial,
	TextureLoader,
	UniformsLib,
	UniformsUtils,
	Vector2,
	Vector4
} from '../../base/base.js';
import { Reflector } from '../objects/reflector.js';
import { Refractor } from '../objects/refractor.js';

/**
 * References:
 *	http://www.valvesoftware.com/publications/2010/siggraph2010_vlachos_waterflow.pdf
 * 	http://graphicsrunner.blogspot.de/2010/08/water-using-flow-maps.html
 *
 */

class Water extends Mesh {

	constructor( geometry, options = {} ) {

		super( geometry );

		this.type = 'Water';

		const scope = this;

		const color = ( options.color !== undefined ) ? new Color( options.color ) : new Color( 0xFFFFFF );
		const textureWidth = options.textureWidth || 512;
		const textureHeight = options.textureHeight || 512;
		const clipBias = options.clipBias || 0;
		const flowDirection = options.flowDirection || new Vector2( 1, 0 );
		const flowSpeed = options.flowSpeed || 0.03;
		const reflectivity = options.reflectivity || 0.02;
		const scale = options.scale || 1;
		const shader = options.shader || Water.WaterShader;
		const encoding = options.encoding !== undefined ? options.encoding : LinearEncoding;

		const textureLoader = new TextureLoader();

		const flowMap = options.flowMap || undefined;
		const normalMap0 = options.normalMap0 || textureLoader.load( 'public/assets/textures/water/Water_1_M_Normal.jpg' );
		const normalMap1 = options.normalMap1 || textureLoader.load( 'public/assets/textures/water/Water_2_M_Normal.jpg' );

		const cycle = 0.15; // a cycle of a flow map phase
		const halfCycle = cycle * 0.5;
		const textureMatrix = new Matrix4();
		const clock = new Clock();

		// internal components

		if ( Reflector === undefined ) {

			console.error( 'THREE.Water: Required component Reflector not found.' );
			return;

		}

		if ( Refractor === undefined ) {

			console.error( 'THREE.Water: Required component Refractor not found.' );
			return;

		}

		const reflector = new Reflector( geometry, {
			textureWidth: textureWidth,
			textureHeight: textureHeight,
			clipBias: clipBias,
			encoding: encoding
		} );

		const refractor = new Refractor( geometry, {
			textureWidth: textureWidth,
			textureHeight: textureHeight,
			clipBias: clipBias,
			encoding: encoding
		} );

		reflector.matrixAutoUpdate = false;
		refractor.matrixAutoUpdate = false;

		// material

		this.material = new ShaderMaterial( {
			uniforms: UniformsUtils.merge( [
				UniformsLib[ 'fog' ],
				shader.uniforms
			] ),
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			transparent: true,
			fog: true
		} );

		if ( flowMap !== undefined ) {

			this.material.defines.USE_FLOWMAP = '';
			this.material.uniforms[ 'tFlowMap' ] = {
				type: 't',
				value: flowMap
			};

		} else {

			this.material.uniforms[ 'flowDirection' ] = {
				type: 'v2',
				value: flowDirection
			};

		}

		// maps

		normalMap0.wrapS = normalMap0.wrapT = RepeatWrapping;
		normalMap1.wrapS = normalMap1.wrapT = RepeatWrapping;

		this.material.uniforms[ 'tReflectionMap' ].value = reflector.getRenderTarget().texture;
		this.material.uniforms[ 'tRefractionMap' ].value = refractor.getRenderTarget().texture;
		this.material.uniforms[ 'tNormalMap0' ].value = normalMap0;
		this.material.uniforms[ 'tNormalMap1' ].value = normalMap1;

		// water

		this.material.uniforms[ 'color' ].value = color;
		this.material.uniforms[ 'reflectivity' ].value = reflectivity;
		this.material.uniforms[ 'textureMatrix' ].value = textureMatrix;

		// inital values

		this.material.uniforms[ 'config' ].value.x = 0; // flowMapOffset0
		this.material.uniforms[ 'config' ].value.y = halfCycle; // flowMapOffset1
		this.material.uniforms[ 'config' ].value.z = halfCycle; // halfCycle
		this.material.uniforms[ 'config' ].value.w = scale; // scale

		// functions

		function updateTextureMatrix( camera ) {

			textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);

			textureMatrix.multiply( camera.projectionMatrix );
			textureMatrix.multiply( camera.matrixWorldInverse );
			textureMatrix.multiply( scope.matrixWorld );

		}

		function updateFlow() {

			const delta = clock.getDelta();
			const config = scope.material.uniforms[ 'config' ];

			config.value.x += flowSpeed * delta; // flowMapOffset0
			config.value.y = config.value.x + halfCycle; // flowMapOffset1

			// Important: The distance between offsets should be always the value of "halfCycle".
			// Moreover, both offsets should be in the range of [ 0, cycle ].
			// This approach ensures a smooth water flow and avoids "reset" effects.

			if ( config.value.x >= cycle ) {

				config.value.x = 0;
				config.value.y = halfCycle;

			} else if ( config.value.y >= cycle ) {

				config.value.y = config.value.y - cycle;

			}

		}

		//

		this.onBeforeRender = function ( renderer, scene, camera ) {

			updateTextureMatrix( camera );
			updateFlow();

			scope.visible = false;

			reflector.matrixWorld.copy( scope.matrixWorld );
			refractor.matrixWorld.copy( scope.matrixWorld );

			reflector.onBeforeRender( renderer, scene, camera );
			refractor.onBeforeRender( renderer, scene, camera );

			scope.visible = true;

		};

	}

}

Water.prototype.isWater = true;

Water.WaterShader = {

	uniforms: {

		'color': {
			type: 'c',
			value: null
		},

		'reflectivity': {
			type: 'f',
			value: 0
		},

		'tReflectionMap': {
			type: 't',
			value: null
		},

		'tRefractionMap': {
			type: 't',
			value: null
		},

		'tNormalMap0': {
			type: 't',
			value: null
		},

		'tNormalMap1': {
			type: 't',
			value: null
		},

		'textureMatrix': {
			type: 'm4',
			value: null
		},

		'uTime': {
			value: 0.1
		},

		'config': {
			type: 'v4',
			value: new Vector4()
		}

	},

	vertexShader: /* glsl */`

		#include <common>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>

		uniform mat4 textureMatrix;

		varying vec4 vCoord;
		varying vec2 vUv;
		varying vec3 vToEye;

		varying vec3 vPos;
varying vec3 vNormal;
uniform float uTime;
uniform float waveAmp;

vec3 mod289(vec3 x) {
  	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
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

  	//   x0 = x0 - 0.0 + 0.0 * C.xxx;
  	//   x1 = x0 - i1  + 1.0 * C.xxx;
  	//   x2 = x0 - i2  + 2.0 * C.xxx;
  	//   x3 = x0 - 1.0 + 3.0 * C.xxx;
  	vec3 x1 = x0 - i1 + C.xxx;
  	vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  	vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
  
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

  	//vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  	//vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
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
  	return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

		void main() {

			vUv = uv;
			vCoord = textureMatrix * vec4( position, 1.0 );

			vec3 pos = position;
			float noiseFreq = 7.3;
			vec3 noisePos = vec3( pos.x * noiseFreq + uTime, pos.y, pos.z );
			pos.z += snoise( noisePos ) * waveAmp;

			vec4 worldPosition = modelMatrix * vec4( pos, 1.0 );
			vToEye = cameraPosition - worldPosition.xyz;

			vec4 mvPosition = viewMatrix * worldPosition; // used in fog_vertex
			gl_Position = projectionMatrix * mvPosition;

			#include <logdepthbuf_vertex>
			#include <fog_vertex>

		}`,

	fragmentShader: /* glsl */`

		#include <common>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>

		uniform sampler2D tReflectionMap;
		uniform sampler2D tRefractionMap;
		uniform sampler2D tNormalMap0;
		uniform sampler2D tNormalMap1;

		#ifdef USE_FLOWMAP
			uniform sampler2D tFlowMap;
		#else
			uniform vec2 flowDirection;
		#endif

		uniform vec3 color;
		uniform float reflectivity;
		uniform vec4 config;

		varying vec4 vCoord;
		varying vec2 vUv;
		varying vec3 vToEye;

		void main() {

			#include <logdepthbuf_fragment>

			float flowMapOffset0 = config.x;
			float flowMapOffset1 = config.y;
			float halfCycle = config.z;
			float scale = config.w;

			vec3 toEye = normalize( vToEye );

			// determine flow direction
			vec2 flow;
			#ifdef USE_FLOWMAP
				flow = texture2D( tFlowMap, vUv ).rg * 2.0 - 1.0;
			#else
				flow = flowDirection;
			#endif
			flow.x *= - 1.0;

			// sample normal maps (distort uvs with flowdata)
			vec4 normalColor0 = texture2D( tNormalMap0, ( vUv * scale ) + flow * flowMapOffset0 );
			vec4 normalColor1 = texture2D( tNormalMap1, ( vUv * scale ) + flow * flowMapOffset1 );

			// linear interpolate to get the final normal color
			// float flowLerp = abs( halfCycle - flowMapOffset0 ) / halfCycle;
			vec4 normalColor = vec4( 0.5, 0.5, 0.5, 1.0 );

			// // calculate normal vector
			vec3 normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );

			// // calculate the fresnel term to blend reflection and refraction maps
			float theta = max( dot( toEye, normal ), 0.0 );
			float reflectance = reflectivity + ( 1.0 - reflectivity ) * pow( ( 1.0 - theta ), 5.0 );

			// // calculate final uv coords
			vec3 coord = vCoord.xyz / vCoord.w;
			vec2 uv = coord.xy + coord.z * normal.xz * 0.05;

			vec4 reflectColor = texture2D( tReflectionMap, vec2( 1.0 - uv.x, uv.y ) );
			vec4 refractColor = texture2D( tRefractionMap, uv );

			// multiply water color with the mix of both textures
			gl_FragColor = vec4( color, 1.0 ) * mix( refractColor, reflectColor, reflectance );

			#include <tonemapping_fragment>
			#include <encodings_fragment>
			#include <fog_fragment>

		}`

};

export { Water as Water_Flow };
