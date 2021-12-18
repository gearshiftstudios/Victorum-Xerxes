import * as XBase from '../../base/base.js'

class TerrainCamera extends XBase.camera.depth {

    /**
     *
     * @param { number } offset How much its Y position should be offset from the terrain
     * @param { number } fov Its field of view (camera)
     * @param { number } aspect Its aspect ratio (camera)
     * @param { number } near Its near plane (camera)
     * @param { number } far Its far plane (camera)
     */ 

    constructor ( offset, fov, aspect, near, far ) {
        super( fov, aspect, near, far )

        this.params = {
            offset: offset,
        }

        this.castDirection = new XBase.vec3( 0, -1, 0 )
        this.castFrom = new XBase.vec3()
        this.minElev = 0
        this.terrain = null

        this.raycaster = new XBase.ray.caster( this.position.clone(), this.castDirection )
        this.raycaster.firstHitOnly = true
    }

    /**
     * 
     * @param { * } object3D The object in which the raycaster will check
     */

    setTerrain ( object3D ) {
        return new Promise( ( resolve, reject ) => {
            if ( object3D && object3D.isObject3D ) {
                this.terrain = object3D

                resolve()
            } else {
                reject()
            }
        } )
    }

    /**
     * 
     * @param { * } controls The controls in which the camera will access
     */

    update ( controls ) {
        if ( this.terrain ) {
            this.castFrom.copy( this.position )
            this.castFrom.y += 1000

            this.raycaster.set( this.castFrom, this.castDirection )

            let intersections = this.raycaster.intersectObject( this.terrain.chunkMeshes, true )

            if ( intersections.length > 0 ) {
                this.minElev = intersections[ 0 ].point.y + this.params.offset

                if ( this.position.y <= this.minElev ) this.position.y = this.minElev
            }
            
            if ( controls && controls.isControls ) {
                const distance = this.position.distanceTo( controls.target )

                if ( distance < controls.maxDistance + 1 ) {
                    const angle = 90 - ( distance * 2 )

                    if ( angle < 85 ) {
                        controls.maxPolarAngle = XBase.util.math.degToRad( angle )
                        controls.minPolarAngle = XBase.util.math.degToRad( angle )
                    }
                } else {
                    controls.maxPolarAngle = XBase.util.math.degToRad( 60 )
                    controls.minPolarAngle = XBase.util.math.degToRad( 60 )
                }
            }
        }
    }
}

export default TerrainCamera