import * as XBase from '../../base/base.js'
import * as fragmentShader from './shaders/lowpoly-shader.fragment.shader.js'
import * as vertexShader from './shaders/lowpoly-shader.vertex.shader.js'

const defaults = {
    amplitude: 0.05,
    color: 0x2f767d,
    flatShading: true,
    geometry: 'plane',
    opacity: 0.75,
    size: 10,
    shiny: true,
    wireframe: false,
}

class Water_LowPoly {
    constructor (
        object3d,
        camera,
        options = {
            amplitude: defaults.amplitude,
            color: defaults.color,
            flatShading: defaults.flatShading,
            geometry: defaults.geometry,
            opacity: defaults.opacity,
            shiny: defaults.shiny,
            wireframe: defaults.wireframe,
        },

        ...geometryParams
    ) {
        const scope = this

        this.params = {
            options: {
                amplitude: options.amplitude ? options.amplitude : defaults.amplitude,
                color: options.color ? options.color : defaults.color,
                flatShading: options.flatShading ? options.flatShading : defaults.flatShading,
                geometry: options.geometry ? options.geometry : defaults.geometry,
                opacity: options.opacity ? options.opacity : defaults.opacity,
                shiny: options.shiny ? options.shiny : defaults.shiny,
                wireframe: options.wireframe ? options.wireframe : defaults.wireframe,
            }
        }

        this.clock = new XBase.clock()
        this.geometry = new XBase.geometry.buffer[ this.params.options.geometry ]( ...geometryParams ) // new XBase.geometry.buffer.plane( width, height, widthDetail, heightDetail )
        this.initialized = false
        
        this.material = new XBase.mat.mesh[ this.params.options.shiny ? 'phong' : 'standard' ]( {
            color: this.params.options.color,
            flatShading: this.params.options.flatShading,
            opacity: this.params.options.opacity,
            transparent: true,
            wireframe: this.params.options.wireframe,
        } )

        this.material.onBeforeCompile = function ( shader ) {
            shader.uniforms.uTime = { value: 0.0 }
            shader.uniforms.waveAmp = { value: scope.params.options.amplitude }
            shader.uniforms.tDepth = {value: null},
            shader.uniforms.tEnv = {value: null},
            shader.uniforms.screenSize = new XBase.uniform([
                window.innerWidth * window.devicePixelRatio,
                window.innerHeight * window.devicePixelRatio
            ]),
            shader.uniforms.cameraNear = {value: camera.near},
            shader.uniforms.cameraFar = {value: camera.far},

            shader.fragmentShader = `${ fragmentShader.beforeVoid }\n` + shader.fragmentShader
            shader.vertexShader = `${ vertexShader.beforeVoid }\n` + shader.vertexShader

            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `${ vertexShader.beginVoid }\n`
            )

            shader.vertexShader = shader.vertexShader.replace(
                `#include <fog_vertex>`,
                `${ vertexShader.positionVoid }\n`
            )

            scope.material.userData.shader = shader
        }

        this.mesh = new XBase.mesh.default( this.geometry, this.material )
        this.mesh.rotation.x = XBase.util.math.degToRad( -90 )
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true

        if ( object3d ) object3d.add( this.mesh )
    }

    update () {
        const shader = this.material.userData.shader

        if ( shader && shader.uniforms.uTime ) {
            shader.uniforms.uTime.value = this.clock.getElapsedTime()
            // shader.uniforms.tDepth.value = depthTarget.texture
            // shader.uniforms.tEnv.value = colorTarget.texture
        }
    }
}

export { Water_LowPoly }