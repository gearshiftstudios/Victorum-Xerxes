import { Bokeh } from './postprocessing/bokeh.js'

function buildPostProcessing ( options = {} ) {
    return new Promise( ( resolve, reject ) => {
        try {
            const list = {}

            if ( options && typeof options == 'object' ) {
                for ( const p in options ) {
                    if ( Array.isArray( options[ p ] ) ) {
                        switch ( p ) {
                            case 'bokeh':
                                list.bokeh = new Bokeh( ...options[ p ] )
                                break
                        }
                    } else {
                        reject()
                    }
                }

                resolve( list )
            } else {
                reject()
            }
        } catch {
            reject()
        }
    } )
}
export {
    buildPostProcessing
}