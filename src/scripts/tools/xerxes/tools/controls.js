import MapControls from '../modules/controls/map.js'

/**
 * 
 * @param { string } type The type of control, can select from these options [ map ]
 * @param { * } object3D 3D Object in which it control
 * @param { Element } element DOM element in which it is bound
 * @param { object } options An object of properties used by it to modify
 */

function buildControls ( type, object3D, element, options = {} ) {
    return new Promise( resolve => {
        let controls = null

        if ( type == 'map' ) {
            if ( object3D && object3D.isObject3D ) {
                if ( element ) {
                    switch ( type ) {
                        case 'map':
                            controls = new MapControls( object3D, element )
                    }

                    for ( const o in options ) controls[ o ] = options[ o ]

                    resolve( controls )
                }
            }
        }
    } )
}

export {
    buildControls
}