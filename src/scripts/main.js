import Xerxes from './tools/xerxes/xerxes.js'
import VLog from './log.js'

import * as InterfaceTools from './tools/interface.js'
import * as Listeners from './listeners.js'

class App {
    constructor () {
        this.clock = new Xerxes.clock()
        this.container = document.body
        this.delta = 0
        this.elapsedTime = 0

        this.renderers = {}

        /* constructor methods */ 

        this.render = () => {
            requestAnimationFrame( this.render )

            this.delta = this.clock.getDelta()
            this.elapsedTime = this.clock.getElapsedTime()

            this.update( this.delta, this.elapsedTime )
        }

        /* initialize app */ 

        this.init()
    }

    async init () {
        await Xerxes.tools.dom.body.stylize()
        await this.generateRenderer()
        await this.generateScene()
        await this.generateCamera()
        await this.generateControls()
        await this.generateTerrain()
        await this.generatePostProcessing()
        await this.generateLighting()
        await this.resize()
        await Listeners.init()

        /* render */ 

        this.render()

        /* Log */ 

        VLog.write( 'Game has been intialized and is ready for use.' )
    }

    async resize () {
        window.onresize = () => {
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
            this.camera.updateProjectionMatrix()

            this.renderers.webgl.setPixelRatio( window.devicePixelRatio )
            this.renderers.webgl.setSize( this.container.offsetWidth, this.container.offsetHeight )

            if ( this.postprocessing && this.postprocessing.bokeh ) this.postprocessing.bokeh.resize()

            // if ( this.composer ) {
            //     if ( this.composer.fxaa ) {
            //         this.composer.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * this.renderer.getPixelRatio() )
		    //         this.composer.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * this.renderer.getPixelRatio() )
            //     }
            // }
        }
    }

    /**
     *
     * @param { number } delta Delta time from clock
     * @param { number } elapsedTime Elapsed time from clock
     */ 

    async update ( delta, elapsedTime ) {
        if ( 
            this.renderers.webgl && 
            this.postprocessing && this.postprocessing.bokeh &&
            this.postprocessing.bokeh.waterMatDepth &&
            this.composer
        ) {
            this.renderers.webgl.render( this.scene, this.camera )
            this.renderers.webgl.display.update( this.renderers.webgl )

            this.renderers.dom.render( this.scene, this.camera )
        }

        if ( this.terrain ) {
            if ( this.terrain.water ) {
                this.terrain.water.material.userData.shader.uniforms.uTime.value = elapsedTime
            }

            if ( this.terrain.storage && this.terrain.storage.entity.length > 0 ) {
                for ( let i = 0; i < this.terrain.storage.entity.length; i++ ) {
                    this.terrain.storage.entity[ i ].animation.mixer.update( delta )
                }
            }
        }

        if ( this.camera && this.controls ) {
            this.controls.update()
            
            if ( this.terrain && this.terrain.group && this.terrain.group.chunkMeshes ) {
                this.camera.update( this.controls )
            }
        }
    }

    /* generators */ 

    async generateCamera () {
        this.camera = await Xerxes.tools.camera.create.terrain(
            this.scene, 5, 35, this.container.offsetWidth / this.container.offsetHeight, 0.1, 2000, {
                position: new Array( 20, 20, 20 )
            }
        )
    }

    async generateControls () {
        this.controls = await Xerxes.tools.controls.build( 'map', this.camera, this.renderers.dom.domElement, {
            screenSpacePanning: false,
            enableDamping: true,
            maxDistance: 39
        } )
    }

    async generateLighting () {
        await Xerxes.tools.lighting.basic.build( this.scene )
    }

    async generatePostProcessing () {

        /* post-processing */

        this.postprocessing = await Xerxes.tools.postprocessing.build( {
            bokeh: new Array( this.camera ),
            unrealbloom: new Array( new Xerxes.vec2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 )
        } )

        this.postprocessing.unrealbloom.threshold = 0
		this.postprocessing.unrealbloom.strength = 0.15
		this.postprocessing.unrealbloom.radius = 0

        /* effect composer */
        
        this.composer = new Xerxes.composer.effect( this.renderers.webgl )
        this.composer.renderpass = new Xerxes.pass.render( this.postprocessing.bokeh.scene, this.postprocessing.bokeh.camera )
        this.composer.fxaa = new Xerxes.pass.shader( Xerxes.shaders.fxaa )

        this.composer.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * this.renderers.webgl.getPixelRatio() )
		this.composer.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * this.renderers.webgl.getPixelRatio() )

        this.composer.addPass( this.composer.renderpass )
        this.composer.addPass( this.postprocessing.unrealbloom )
        this.composer.addPass( this.composer.fxaa )
    }

    async generateRenderer () {
        this.renderers.webgl = await Xerxes.tools.renderer.webgl.build( 
            document.body,
            {
                alpha: true,
                antialias: true,
                depth: true,
            }
        )
            
        this.renderers.webgl.autoClear = false
        this.renderers.webgl.domElement.style.pointerEvents = 'auto'
        this.renderers.webgl.display = await Xerxes.tools.renderer.webgl.create.display( InterfaceTools.getUI( 'dev' ) )

        this.renderers.dom = await Xerxes.tools.renderer.css2d.build( document.body )
    }

    async generateScene () {
        this.scene = await Xerxes.tools.scene.build( {
            background: new Xerxes.loader.texture().load( './public/assets/textures/sky/sky.upward.jpg' ),
        } )
    }

    async generateTerrain () {
        this.terrain = await Xerxes.tools.terrain.build.chunkmap( this.scene, {
            generateMacro: new Array( 2.25, this.camera ),
        } )

        await this.camera.setTerrain( this.terrain.group )
    }

    async generateUI () {
        
    }
}

window.app = new App()
