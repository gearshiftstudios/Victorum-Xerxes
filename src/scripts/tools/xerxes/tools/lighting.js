import * as XBase from '../base/base.js'

function buildBasicLighting ( scene ) {
    return new Promise( ( resolve, reject ) => {
        if ( scene && scene.isScene ) {
            try {
                /* add hemisphere light */ 

                const hemi = new XBase.light.hemisphere( 0xffeeb1, 0x080820, 0.75 )
                hemi.addTo( scene )

                /* add sun light */ 

		        const sun = new XBase.light.directional( 0xffffff, 0.75 )
		        sun.position.set( 200, 400, 200 ).normalize()
                sun.castShadow = true
                sun.shadow.mapSize.width = 1024 * 256
                sun.shadow.mapSize.height = 1024 * 256
                sun.shadow.camera.near = -2000
                sun.shadow.camera.far = 2000
                sun.shadow.camera.left = -150
                sun.shadow.camera.right = 150
                sun.shadow.camera.top = 150
                sun.shadow.camera.bottom = -150
                sun.addTo( scene )

                resolve()
            } catch {
                reject()
            }
        }
    } )
}

export {
    buildBasicLighting
}