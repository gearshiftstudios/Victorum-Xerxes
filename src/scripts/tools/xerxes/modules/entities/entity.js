import * as XBase from '../../base/base.js'

class Entity extends XBase.object3D {
    constructor () {
        super()
    }

    addTo ( object3D ) {
        return new Promise( ( resolve, reject ) => {
            try {
                if ( object3D && object3D.isObject3D ) {
                    object3D.add( this )

                    resolve( object3D )
                } else reject()
            } catch {
                reject()
            }
        } )
    }

    resolveChildren () {
        return new Promise( resolve => resolve( this.object.children ) )
    }

    returnChildren () {
        return this.object.children
    }
}

export default Entity