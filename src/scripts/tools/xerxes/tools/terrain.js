import { ChunkMap } from './terrain/chunkmap.js'

function buildChunkMap ( object3D, options = {} ) {
    return new Promise( ( resolve, reject ) => {
        try {
            if ( object3D && object3D.isObject3D ) {
                const map = new ChunkMap( object3D )

                if ( options && typeof options == 'object' ) {
                    for ( const p in options ) {
                        switch ( p ) {
                            case 'generateMacro':
                                if ( Array.isArray( options[ p ] ) ) map.generateMacro( ...options[ p ] )
                                else reject()

                                break
                        }
                    }
                }

                resolve( map )
            } else {
                reject()
            }
        } catch {
            reject()
        }
    } ) 
}

export { buildChunkMap }