import * as XBase from '../base/base.js'
import Rejections from '../base/rejections.js'
import TerrainCamera from '../modules/camera/terrain.js'

function createDepthCamera (
    object3D, 
    fov = 60, 
    aspect = 1, 
    near = 0.01, 
    far = 2000,
    options = {} 
) {
    return new Promise( ( resolve, reject ) => {
        if ( object3D && object3D.isObject3D ) {
            const camera = new XBase.camera.depth( fov, aspect, near, far )

            if ( options && typeof options == 'object' ) {
                for ( const p in options ) {
                    if ( p == 'position' ) {
                        switch ( p ) {
                            case 'position':
                                if ( Array.isArray( options[ p ] ) ) camera.position.set( ...options[ p ] )

                                break
                        }
                    } else camera[ p ] = options[ p ]
                }
            }

            object3D.add( camera )

            resolve( camera )
        } else reject( Rejections.object3D.notVerified )
    } )
}

function createFlatCamera (
    object3D, 
    frustumSize = 1000, 
    aspect = 1, 
    near = 2000, 
    far = 2000 
) {
    return new Promise( ( resolve, reject ) => {
        if ( object3D && object3D.isObject3D ) {
            const camera = new XBase.camera.flat( 
                frustumSize * aspect / - 2, 
                frustumSize * aspect / 2, 
                frustumSize / 2, 
                frustumSize / - 2, 
                near, far 
            )

            object3D.add( camera )

            resolve( camera )
        } else reject( Rejections.object3D.notVerified )
    } )
}

function createTerrainCamera (
    object3D, 
    offset = 5,
    fov = 60, 
    aspect = 1, 
    near = 0.01, 
    far = 2000,
    options = {} 
) {
    return new Promise( ( resolve, reject ) => {
        if ( object3D && object3D.isObject3D ) {
            const camera = new TerrainCamera( offset, fov, aspect, near, far )

            if ( options && typeof options == 'object' ) {
                for ( const p in options ) {
                    if ( p == 'position' ) {
                        switch ( p ) {
                            case 'position':
                                if ( Array.isArray( options[ p ] ) ) camera.position.set( ...options[ p ] )

                                break
                        }
                    } else camera[ p ] = options[ p ]
                }
            }

            object3D.add( camera )

            resolve( camera )
        } else reject( Rejections.object3D.notVerified )
    } )
}

export {
    createDepthCamera,
    createFlatCamera,
    createTerrainCamera
}