import * as XBase from '../../base/base.js'
import { frag } from './shaders/simplefoam.shader.fragment.js'
import { vert } from './shaders/simplefoam.shader.vertex.js'
import * as RendererTools from '../../tools/renderer.js'

class Water_SimpleFoam {
    constructor ( object3D, renderer, camera, width = 20, height = 20, scale = 5 ) {
        this.material = new XBase.mat.shader( {
            uniforms: {
                tDepth: { value: null },
                tEnv: { value: null },
                screenSize: new XBase.uniform( [
                    renderer.domElement.offsetWidth * renderer.getPixelRatio(),
                    renderer.domElement.offsetHeight * renderer.getPixelRatio()
                ] ),
                uTime: { value: 0.0 },
                uDistance: { value: 0.0 },
                uDistanceMax: { value: 20.0 },
                uScale: { value: 1.0 },
                cameraNear: { value: camera.near },
                cameraFar: { value: camera.far },
            },
            vertexShader: vert,
            fragmentShader: frag,
            transparent: true,
            depthWrite: false,
        } )

        this.materialDepth = new XBase.mat.mesh.depth( { morphTargets: true } );
        this.materialDepth.depthPacking = XBase.rgba.depthPacking
        this.materialDepth.blending = XBase.noBlending
        
        this.mesh = new XBase.mesh.default(
            new XBase.geometry.buffer.plane( width, height, 1, 1 ),
            this.material
        )

        this.mesh.rotation.x = XBase.util.math.degToRad( -90 )
        this.mesh.position.y = 10

        this.scene = new XBase.scene()

        this.init( renderer )
    }

    resize ( renderer ) {
        this.material.uniforms.screenSize = new XBase.uniform( [
            renderer.domElement.offsetWidth * renderer.getPixelRatio(),
            renderer.domElement.offsetHeight * renderer.getPixelRatio()
        ] )
    }

    update ( controls, camera, deltaTime ) {
        if ( this.targets.color && this.targets.depth ) {
            this.material.uniforms.tDepth.value = this.targets.depth.texture
            this.material.uniforms.tEnv.value = this.targets.color.texture
            this.material.uniforms.uTime.value += deltaTime
            this.material.uniforms.uDistance.value = camera.position.distanceTo( controls.target )
        }
    }

    async init ( renderer ) {
        if ( renderer && renderer.isWebGLRenderer ) {
            this.targets = {
                color: await RendererTools.createColorTarget( renderer ),
                depth: await RendererTools.createDepthTarget( renderer ),
            }

            this.scene.add( this.mesh )
        }
    }
}

export { 
    Water_SimpleFoam, 
    Water_SimpleFoam as Water, 
    Water_SimpleFoam as water 
}