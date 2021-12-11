import * as XBase from '../base/base.js'

function buildBasicLighting ( scene ) {
    return new Promise( ( resolve, reject ) => {
        if ( scene && scene.isScene ) {
            try {
                /* add hemisphere light */ 

                const hemisphere = new XBase.light.hemisphere( 0xffffff, 0x000000, 1 ) // create the hemisphere light
                // hemisphere.color.setHSL( 0.6, 0.75, 0.5 ) // set color of hemisphere light
                // hemisphere.groundColor.setHSL( 0.095, 0.5, 0.5 ) // set ground color of hemisphere light
                // hemisphere.position.set( 0, 500, 0 ) // change position of hemisphere light

                scene.add( hemisphere ) // add hemisphere light to the scene

                /* add sun light */ 

                const sun = new XBase.light.directional( 0xffffff, 0.6 ) // create the sun light
                sun.position.set( -250, 250, -250 ) // change position of sun light

                /* modify the sun light's shadow properties */ 
                sun.castShadow = true // allow sun light to cast a shadow

                sun.shadow.camera.near = 0.000001 
                sun.shadow.camera.far = 2000
                sun.shadow.camera.right = 500
                sun.shadow.camera.left = -500
                sun.shadow.camera.top = 500
                sun.shadow.camera.bottom = -500
    
                sun.shadow.mapSize.width = 10 ** 560
                sun.shadow.mapSize.height = 10 ** 560
                // this.lights.sun.shadow.bias = 0
                // this.lights.sun.shadow.radius = 0

                scene.add( sun ) // add sun light to the scene
                scene.add( sun.target )

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