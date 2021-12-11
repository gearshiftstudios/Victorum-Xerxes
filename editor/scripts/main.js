import Xerxes from '../../src/scripts/tools/xerxes/xerxes.js'
import { generateMenu } from './ui/menu.js'

Xerxes.core.init().then( () => {
    class App {
        constructor () {
            this.log = new Xerxes.log.logger( 'Xerxes Editor', '1.0', 'alpha' )
            this.grid = new Xerxes.helper.inifinitegrid()

            this.render = () => {
                requestAnimationFrame( this.render )

                if ( this.renderer ) {
                    if ( !this.renderer.trueRender ) {
                        this.renderer.render( this.scene, this.camera )
                    }
                }

                if ( this.controls ) this.controls.update()
            }
    
            this.init()
                .then( () => window.onresize = () => this.resize() )
                .then( () => this.render() )
        }

        resize () {
            if ( this.renderer ) {
                this.renderer.setPixelRatio( window.devicePixelRatio )
                this.renderer.setSize( window.innerWidth, window.innerHeight )
            }

            if ( this.camera ) {
                this.camera.aspect = window.innerWidth / window.innerHeight
                this.camera.updateProjectionMatrix()
            }
        }
    
        async init () {
            this.scene = await Xerxes.tools.scene.build( {
                background: new Xerxes.color( 0x424242 )
            } )

            this.scene.add( this.grid )

            this.camera = await Xerxes.tools.camera.create.depth( this.scene, 60, window.innerWidth / window.innerHeight, 0.1, 10000 )
            this.camera.position.set( 100, 100, 100 )
            this.camera.lookAt( 0, 0, 0 )

            this.renderer = await Xerxes.tools.renderer.webgl.build( document.body, {
                antialias: true,
            } )

            this.controls = new Xerxes.controls.editor( this.camera, this.renderer.domElement )

            generateMenu()

            this.resize()

            this.log.write( 'Editor has been intialized and is ready for use.' )
        }
    }

    window.app = new App()
} )