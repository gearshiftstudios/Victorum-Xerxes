import * as XBase from '../base/base.js'
import Rejections from '../base/rejections.js'

class RendererDataDisplay {
    constructor ( parentElement = document.body, type = 'webgl' ) {
        this.params = {
            parentElement: parentElement,
            type: type,
        }

        this.container = document.createElement( 'div' )
        this.container.innerHTML = `Renderer Data Display`

        this.container.setAttribute( 'style', `
            position: absolute;
            left: 0;
            top: 0;

            background-color: #313131;
            border: solid 2px #6c6c6c;
            border-left: none;
            border-top: none;
            border-radius: 0 0 10px 0;
            color: white;
            font-family: 'Montserrat';
            font-size: 12px;
            padding: 5px 10px 5px 10px;

            z-index: 9999999;
        ` )

        this.container.innerHTML = `
            <img src='public/assets/images/logos/${ this.params.type == 'webgl' ? 'webgl.white' : 'css3' }.svg' height='40' style='margin-top: 5px;'></img><br><br>

            <div style='color: magenta; display: inline;'>Geometries</div> - <div id='m-g' style='display: inline;'>0</div><br>
            <div style='color: magenta; display: inline;'>Textures</div> - <div id='m-t' style='display: inline;'>0</div><br>
            <div style='color: turquoise; display: inline;'>Render Calls</div> - <div id='r-c' style='display: inline;'>0</div><br>
            <div style='color: turquoise; display: inline;'>Triangles</div> - <div id='r-t' style='display: inline;'>0</div><br>
            <div style='color: turquoise; display: inline;'>Points</div> - <div id='r-p' style='display: inline;'>0</div><br>
            <div style='color: turquoise; display: inline;'>Lines</div> - <div id='r-l' style='display: inline;'>0</div>
        `

        this.params.parentElement.appendChild( this.container )
    }

    update ( renderer ) {
        this.container.querySelector( '#m-g' ).innerHTML = renderer.info.memory.geometries
        this.container.querySelector( '#m-t' ).innerHTML = renderer.info.memory.textures
        this.container.querySelector( '#r-c' ).innerHTML = renderer.info.render.calls
        this.container.querySelector( '#r-t' ).innerHTML = renderer.info.render.triangles
        this.container.querySelector( '#r-p' ).innerHTML = renderer.info.render.points
        this.container.querySelector( '#r-l' ).innerHTML = renderer.info.render.lines
    }
}

function buildWebGLRenderer ( container, rendererOptions = {}, options = {} ) {
    return new Promise( ( resolve, reject ) => {
        if ( container ) {
            try {
                const renderer = new XBase.renderer.webgl( rendererOptions )
                renderer.setPixelRatio( window.devicePixelRatio )
                renderer.setSize( container.offsetWidth, container.offsetHeight )
                renderer.outputEncoding = XBase.encoding.srgb
                renderer.gammaFactor = 3
                renderer.shadowMap.enabled = true
                renderer.setClearColor( 0x000000, 0 )

                for ( const o in options ) renderer[ o ] = options[ o ]

                container.appendChild( renderer.domElement )

                resolve( renderer )
            } catch {
                reject( Rejections.renderer.build )
            }
        } else reject( Rejections.DOM.container.notVerified )
    } )
}

function createColorTarget ( renderer, options = {} ) {
    return new Promise( ( resolve, reject ) => {
        if ( renderer && renderer.isWebGLRenderer ) {
            try {
                const colorTarget = new XBase.webgl.renderTarget.default(
                    renderer.domElement.offsetWidth * renderer.getPixelRatio(),
                    renderer.domElement.offsetHeight * renderer.getPixelRatio() 
                )
            
                colorTarget.texture.format = XBase.rgb.format
                colorTarget.texture.minFilter = XBase.nearestFilter
                colorTarget.texture.magFilter = XBase.nearestFilter
                colorTarget.depthBuffer = true
                colorTarget.stencilBuffer = false

                for ( const o in options ) depthTarget[ o ] = options[ o ]
    
                resolve( colorTarget )
            } catch {
                reject( Rejections.renderer.target.color )
            }
        } else reject( Rejections.renderer.notVerified )
    } )
}

function createDepthTarget ( renderer, options = {} ) {
    return new Promise( ( resolve, reject ) => {
        if ( renderer && renderer.isWebGLRenderer ) {
            try {
                const depthTarget = new XBase.webgl.renderTarget.default(
                    renderer.domElement.offsetWidth * renderer.getPixelRatio(),
                    renderer.domElement.offsetHeight * renderer.getPixelRatio() 
                )
            
                depthTarget.texture.format = XBase.rgba.format
                depthTarget.texture.minFilter = XBase.nearestFilter
                depthTarget.texture.magFilter = XBase.nearestFilter
                depthTarget.depthBuffer = true
                depthTarget.stencilBuffer = false

                for ( const o in options ) depthTarget[ o ] = options[ o ]
    
                resolve( depthTarget )
            } catch {
                reject( Rejections.renderer.target.depth )
            }
        } else reject( Rejections.renderer.notVerified )
    } )
}

function createRendererDataDisplay ( parentElement = document.body, type = 'webgl' ) {
    return new Promise( ( resolve, reject ) => {
        try {
            const display = new RendererDataDisplay( parentElement, type )

            XBase.log.write( 'Renderer Data Display (XRDD) was created for use.' )
    
            resolve( display )
        } catch {
            reject()
        }
    } )
}

/* exports */

export {
    buildWebGLRenderer,
    createColorTarget,
    createDepthTarget,
    createRendererDataDisplay,
}