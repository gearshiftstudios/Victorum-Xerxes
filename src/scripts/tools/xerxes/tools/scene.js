import * as XBase from '../base/base.js'
import Rejections from '../base/rejections.js'

/* regular methods */ 

function buildScene ( options = {} ) {
    return new Promise( ( resolve, reject ) => {
        const scene = new XBase.scene()

        if ( Object.keys( options ).length > 0 ) {
            if ( options.background ) createBackground( scene, options.background )
            if ( options.fog ) createFog( scene, ...options.fog )

            if ( options.skybox && options.skybox.length == 2 ) {
                createSkybox( scene, ...options.skybox )
            }
        }

        resolve( scene )
    } )
}

function createBackground ( scene, background ) {
    return new Promise( ( resolve, reject ) => {
        if ( scene && scene.isScene ) {
            if ( background ) {
                scene.background = background
    
                resolve()
            }
        } else reject( Rejections.scene.notVerified )
    } )
}

function createFog ( scene, isExp2 = true, color = 0xffffff, ...args ) {
    return new Promise( ( resolve, reject ) => {
        if ( scene && scene.isScene ) {
            switch ( isExp2 ) {
                case false:
                    scene.fog = new XBase.fog( color, ...args )
                    break
                case true:
                    scene.fog = new XBase.fogExp2( color, ...args )
                    break
            }

            resolve()
        } else reject( Rejections.scene.notVerified )
    } )
}

function createSkybox ( scene, renderer, image ) {
    return new Promise( ( resolve, reject ) => {
        if ( scene && scene.isScene ) {
            if ( renderer && renderer.isWebGLRenderer ) {
                const loader = new XBase.loader.texture()
    
                const texture = loader.load( image, () => {
                    const rt = new XBase.webgl.renderTarget.cube( texture.image.height )
                    rt.fromEquirectangularTexture( renderer, texture )
    
                    scene.background = rt.texture

                    resolve()
                } )
            } else reject( Rejections.renderer.notVerified )
        } else reject( Rejections.scene.notVerified )
    } )
}

/* exports */ 

export {
    buildScene,
    createBackground,
    createFog,
    createSkybox,
}