import Xerxes from './tools/xerxes/xerxes.js'
import VLog from './log.js'

class App {
    constructor () {
        this.clock = new Xerxes.clock()
        this.container = document.body
        this.sepia = false

        /* constructor methods */ 

        this.render = () => {
            requestAnimationFrame( this.render )

            const delta = this.clock.getDelta()

            // if ( this.controls ) this.controls.update()
            
            // if ( this.mill ) {
            //     this.mill.animation.mixer.update( delta )
            // }

            if ( 
                this.renderer && 
                this.postprocessing && this.postprocessing.bokeh &&
                this.postprocessing.bokeh.waterMatDepth &&
                this.composer
            ) {
				// render scene into texture
                // this.renderer.setRenderTarget( this.postprocessing.bokeh.rtTextureColor )
                // this.renderer.clear()
                this.renderer.render( this.scene, this.camera )

				// // render depth into texture
                // this.scene.overrideMaterial = this.postprocessing.bokeh.waterMatDepth
                // this.renderer.setRenderTarget( this.postprocessing.bokeh.rtTextureDepth )
                // this.renderer.clear()
                // this.renderer.render( this.scene, this.camera )
                // // this.renderer.display.update( this.renderer )
                // this.scene.overrideMaterial = null

				// // render bokeh composite
                // this.renderer.setRenderTarget( null )
				// this.composer.render()
            }

            // if ( this.terrain ) {
            //     if ( this.terrain.water ) {
            //         // this.terrain.water.material.userData.shader.uniforms.uTime.value = this.clock.getElapsedTime()
            //     }
            // }

            // if ( this.camera && this.controls ) {
            //     const distance = this.camera.position.distanceTo( this.controls.target )

            //     if ( distance < this.controls.maxDistance + 1 ) {
            //         const angle = 90 - ( distance * 2 )

            //         if ( angle < 85 ) {
            //             this.controls.maxPolarAngle = Xerxes.util.math.degToRad( angle )
            //             this.controls.minPolarAngle = Xerxes.util.math.degToRad( angle )
            //         }
            //     } else {
            //         this.controls.maxPolarAngle = Xerxes.util.math.degToRad( 60 )
            //         this.controls.minPolarAngle = Xerxes.util.math.degToRad( 60 )
            //     }
            // }
        }

        /* initialize app */ 

        this.init()
            .then( () => window.onresize = () => this.resize() )
            .then( () => this.render() )
            .then( ()=> VLog.write( 'Game has been intialized and is ready for use.' ) )
    }

    resize () {
        window.onresize = () => {
            this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight
            this.camera.updateProjectionMatrix()

            this.renderer.setPixelRatio( window.devicePixelRatio )
            this.renderer.setSize( this.container.offsetWidth, this.container.offsetHeight )

            if ( this.postprocessing ) {
                if ( this.postprocessing.bokeh ) this.postprocessing.bokeh.resize()
            }

            if ( this.composer ) {
                if ( this.composer.fxaa ) {
                    this.composer.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * this.renderer.getPixelRatio() )
		            this.composer.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * this.renderer.getPixelRatio() )
                }
            }
        }
    }

    async init () {
        await Xerxes.tools.dom.body.stylize()

        this.renderer = await Xerxes.tools.renderer.webgl.build( 
            document.body,
            {
                alpha: true,
                antialias: true,
                depth: true,
            }
        )
            
        this.renderer.autoClear = false
        this.renderer.domElement.style.pointerEvents = 'auto'

        this.renderer.display = await Xerxes.tools.renderer.webgl.create.display()

        this.scene = await Xerxes.tools.scene.build()
        this.scene.background = new Xerxes.loader.texture().load( './public/assets/textures/sky/sky.upward.jpg' )

        this.camera = await Xerxes.tools.camera.create.depth(
            this.scene, 60, this.container.offsetWidth / this.container.offsetHeight, 0.1, 2000, {
                position: new Array( 20, 20, 20 )
            }
        )

        this.controls = new Xerxes.controls.map( this.camera, this.renderer.domElement )
        this.controls.screenSpacePanning = false
        this.controls.enableDamping = false
        this.controls.maxDistance = 39

        /* terrain */ 

        this.terrain = await Xerxes.tools.terrain.build.chunkmap( this.scene, {
            generateMacro: new Array( 2.25, this.camera ),
        } )

        /* bokeh */

        this.postprocessing = await Xerxes.tools.postprocessing.build( {
            bokeh: new Array( this.camera )
        } )

        /* composer */
        
        this.composer = new Xerxes.composer.effect( this.renderer )
        this.composer.renderpass = new Xerxes.pass.render( this.postprocessing.bokeh.scene, this.postprocessing.bokeh.camera )
        this.composer.fxaa = new Xerxes.pass.shader( Xerxes.shaders.fxaa )

        this.composer.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * this.renderer.getPixelRatio() )
		this.composer.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * this.renderer.getPixelRatio() )

        this.composer.addPass( this.composer.renderpass )
        this.composer.addPass( this.composer.fxaa )

        /* lighting */ 

        const hemiLight = new Xerxes.light.hemisphere( 0xffeeb1, 0x080820, 0.75  )
        this.scene.add( hemiLight )

		const directionalLight1 = new Xerxes.light.directional( 0xffffff, 0.75 )
		directionalLight1.position.set( 200, 400, 200 ).normalize()
        directionalLight1.castShadow = true
        directionalLight1.shadow.mapSize.width = 1024 * 256
        directionalLight1.shadow.mapSize.height = 1024 * 256

        this.scene.add( directionalLight1 )
        this.scene.add( directionalLight1.target )

        const cam = directionalLight1.shadow.camera
        cam.near = -2000
        cam.far = 2000
        cam.left = -150
        cam.right = 150
        cam.top = 150
        cam.bottom = -150
    }
}

window.app = new App()
