import * as XBase from '../../base/base.js'
import { AnimationList } from '../../tools/entity/animations.js'

const ModelStore = new Array()

class Model extends XBase.construct {
    constructor ( model, parent, initAnim ) {
        super()

        this.los = 0.25
        this.model = model
        this.viewingWireframe = false
        
        this.animation = {
            mixer: new XBase.animation.mixer( this.model.scene ),
            list: new AnimationList( this.model.animations )
        }

        this.model.scene.children.forEach( c => {
            c.origMat = c.material
        } )

        if ( parent ) this.addTo( parent )

        if ( initAnim ) {
            if ( Object.keys( this.animation.list ).length > 0 ) {
                this.playAnimation( initAnim )
            }
        }
    }

    addTo ( object3D ) {
        return new Promise( ( resolve, reject ) => {
            try {
                if ( object3D && object3D.isObject3D ) {
                    object3D.add( this.model.scene )

                    resolve()
                } else reject()
            } catch {
                reject()
            }
        } )
    }

    playAnimation ( name ) {
        return new Promise( ( resolve, reject ) => {
            try {
                if ( name ) {
                    this.animation.mixer.clipAction( this.model.animations[ 
                        this.animation.list[ name ] 
                    ] ).play()

                    resolve()
                } else reject()
            } catch {
                reject()
            }
        } )
    }

    toggleWireframe () {
        return new Promise( ( resolve, reject ) => {
            try {
                if ( this.viewingWireframe ) {
                    this.model.scene.children.forEach( c => {
                        c.material = c.origMat
    
                        c.material.wireframe = false
                    } )

                    this.viewingWireframe = false
                } else {
                    this.model.scene.children.forEach( c => {
                        if ( c.wireMat ) c.material = c.wireMat
                        else c.material.wireframe = true
                    } )

                    this.viewingWireframe = true
                }

                resolve()
            } catch {
                reject()
            }
        } )
    }

    viewWireframe ( color ) {
        return new Promise( ( resolve, reject ) => {
            try {
                this.model.scene.children.forEach( c => {
                    if ( color ) {
                        if ( !c.wireMat ) {
                            c.wireMat = new Xerxes.mat.mesh.basic( {
                                color: color,
                                side: Xerxes.doubleSide,
                                wireframe: true,
                            } )

                            c.material = c.wireMat
                        } else c.material = c.wireMat
                    } else c.material.wireframe = true

                    this.viewingWireframe = true
                } )

                resolve()
            } catch {
                reject()
            }
        } )
    }
}

export { Model, ModelStore } 