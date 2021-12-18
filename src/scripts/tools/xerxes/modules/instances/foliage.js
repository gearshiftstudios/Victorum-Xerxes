import * as XBase from '../../base/base.js'
import * as ArrayTools from '../../tools/array.js'
import { GLTFLoader } from '../loaders/gltf.js'

//oak - 0.25, 0.3
//taiga - 0.174, 0.176
//trop - 0.00274, 0.00276

const Defaults = {
    instance: {
        maxOffsetX: 0,
        maxOffsetY: 0,
        maxOffsetZ: 0,
        maxRotX: 0,
        maxRotY: 0,
        maxRotZ: 0,
        maxScale: 1,
        minOffsetX: 0,
        minOffsetY: 0,
        minOffsetZ: 0,
        minRotX: 0,
        minRotY: 0,
        minRotZ: 0,
        minScale: 1,
        canopyColors: [ 0x305c23, 0x4a7a22, 0x568231, 0x345c13, 0x284f07, 0x4e7825, 0x4e7826, 0x497023, 0x755215 ],
        trunkColors: [ 0x4a3816, 0x3b2b0e, 0x4a340d, 0x302002, 0x382d17 ],
    },
    loader: {
        format: 'gltf',
        path: '',
    },
}

const Dummy = new XBase.object3D()
const Loader = new GLTFLoader()
const Stored = {}

class InstancedFoliage {
    constructor ( url, isMapBased, storageObject, instanceOptions ) {
        this.initialized = false

        this.params = {
            instance: {},
            isMapBased: isMapBased || false,
            url: url || null
        }

        this.canopy = null
        this.trunk = null

        this.parsed = {
            biome: null,
            distinction: null,
        }

        /* change instance params */
        
        for ( const o in instanceOptions ) this.params.instance[ o ] = instanceOptions[ o ]

        /* if the foliage is Xerxes map-based, parse it up */ 

        if ( this.params.isMapBased == true ) {
            const parsing = this.params.url.split( '.' )

            this.parsed.biome = parsing[ 0 ]
            this.parsed.distinction = parsing[ 1 ]

            /* store this class data in memory */

            if ( !storageObject[ this.parsed.biome ] ) storageObject[ this.parsed.biome ] = {}

            storageObject[ this.parsed.biome ][ this.parsed.distinction ] = this
        }  else storageObject[ this.params.url ] = this

        /* declare that this class has been fully initialized and ready for use */ 

        this.initialized = true
    }

    activateMeshes ( count ) {
        return new Promise( ( resolve, reject ) => {
                /* detect and store canopy and trunk GLTF data */ 

                if ( this.params.url != null ) {
                    Loader.load( `${ Defaults.loader.path + this.params.url }.${ Defaults.loader.format }`, model => {
                        if ( model.scene.children.length == 2 ) {
                            model.scene.children.forEach( c => {
                                if ( c.geometry ) {
                                    if ( c.name == 'canopy' || c.name == 'trunk' ) {
                                        this[ c.name ] = new XBase.mesh.instanced( 
                                            c.geometry, 
                                            new XBase.mat.mesh.phong( {
                                                color: 0xffffff,
                                                flatShading: true,
                                                shininess: 0,
                                            } ), 
                                            count 
                                        )

                                        this[ c.name ].castShadow = true
                                    }
                                }
                            } ) 

                            resolve()
                        }
                    } ) 
                }
        } )
    }

    addToTiles ( mapGroup, treeTiles, options = this.params.instance ) {
        return new Promise( ( resolve, reject ) => {
                this.activateMeshes( treeTiles.length ).then( () => {
                    options = {
                        maxOffsetX: options.maxOffsetX ? options.maxOffsetX : Defaults.instance.maxOffsetX,
                        maxOffsetY: options.maxOffsetY ? options.maxOffsetY : Defaults.instance.maxOffsetY,
                        maxOffsetZ: options.maxOffsetZ ? options.maxOffsetZ : Defaults.instance.maxOffsetZ,
                        maxRotX: options.maxRotX ? options.maxRotX : Defaults.instance.maxRotX,
                        maxRotY: options.maxRotY ? options.maxRotY : Defaults.instance.maxRotY,
                        maxRotZ: options.maxRotZ ? options.maxRotZ : Defaults.instance.maxRotZ,
                        maxScale: options.maxScale ? options.maxScale : Defaults.instance.maxScale,
                        minOffsetX: options.minOffsetX ? options.minOffsetX : Defaults.instance.minOffsetX,
                        minOffsetY: options.minOffsetY ? options.minOffsetY : Defaults.instance.minOffsetY,
                        minOffsetZ: options.minOffsetZ ? options.minOffsetZ : Defaults.instance.minOffsetZ,
                        minRotX: options.minRotX ? options.minRotX : Defaults.instance.minRotX,
                        minRotY: options.minRotY ? options.minRotY : Defaults.instance.minRotY,
                        minRotZ: options.minRotZ ? options.minRotZ : Defaults.instance.minRotZ,
                        minScale: options.minScale ? options.minScale : Defaults.instance.minScale,
                        canopyColors: options.canopyColors ? options.canopyColors : Defaults.instance.canopyColors,
                        trunkColors: options.trunkColors ? options.trunkColors : Defaults.instance.trunkColors,
                    }
    
                    treeTiles.forEach( ( t, ix ) => {
                        const randomScale = XBase.util.math.random.number.between( options.minScale, options.maxScale )
    
                        Dummy.position.set(
                            mapGroup.allTiles[ t ].center[ 0 ] + XBase.util.math.random.number.between( options.minOffsetX, options.maxOffsetX ),
                            mapGroup.allTiles[ t ].center[ 2 ] + XBase.util.math.random.number.between( options.minOffsetY, options.maxOffsetY ),
                            mapGroup.allTiles[ t ].center[ 1 ] + XBase.util.math.random.number.between( options.minOffsetZ, options.maxOffsetZ )
                        )
    
                        Dummy.rotation.set(
                            XBase.util.math.degToRad( XBase.util.math.random.number.between( options.minRotX, options.maxRotX ) ),
                            XBase.util.math.degToRad( XBase.util.math.random.number.between( options.minRotY, options.maxRotY ) ),
                            XBase.util.math.degToRad( XBase.util.math.random.number.between( options.minRotZ, options.maxRotZ ) )
                        )
    
                        Dummy.scale.set( randomScale, randomScale, randomScale )
    
                        Dummy.updateMatrix()
                        // Dummy.castShadow = true
    
                        this.canopy.setMatrixAt( ix, Dummy.matrix )
                        this.canopy.setColorAt( ix, new XBase.color( ArrayTools.getRandom( options.canopyColors ) ) )
                        this.trunk.setMatrixAt( ix, Dummy.matrix )
                        this.trunk.setColorAt( ix, new XBase.color( ArrayTools.getRandom( options.trunkColors ) ) )
    
                        this.canopy.instanceColor.needsUpdate = true
                        this.canopy.instanceMatrix.needsUpdate = true
                        this.trunk.instanceColor.needsUpdate = true
                        this.trunk.instanceMatrix.needsUpdate = true
                    } )
    
                    mapGroup.add( this.canopy, this.trunk )
    
                    resolve()
                } )
        } )
    }
}

function storeInstancedFoliage ( url, isMapBased, storageObject, instanceOptions ) {
    return new Promise( ( resolve, reject ) => {
            const tree = new InstancedFoliage( url, isMapBased, storageObject, instanceOptions )

            resolve()
    } )
}

function addFoliageInstancesToTiles ( mapGroup, storageObject ) {
    return new Promise ( resolve => {
        for ( const b in storageObject ) {
            for ( const d in storageObject[ b ] ) {
                const treeTiles = new Array()

                if ( mapGroup.allTilesByBiome[ b ] ) {
                    for ( let i = 0; i < mapGroup.allTilesByBiome[ b ].length; i++ ) {
                        if ( mapGroup.allTiles[ mapGroup.allTilesByBiome[ b ][ i ] ].hasTree && 
                            !mapGroup.allTiles[ mapGroup.allTilesByBiome[ b ][ i ] ].isCliff &&
                            !mapGroup.allTiles[ mapGroup.allTilesByBiome[ b ][ i ] ].isCoast &&
                            mapGroup.allTiles[ mapGroup.allTilesByBiome[ b ][ i ] ].treeType && 
                            mapGroup.allTiles[ mapGroup.allTilesByBiome[ b ][ i ] ].treeType == d 
                        ) treeTiles.push( mapGroup.allTilesByBiome[ b ][ i ] )
                    }
                }

                storageObject[ b ][ d ].addToTiles( mapGroup, treeTiles )
            }
        }

        resolve()
    } )
}

function setLoaderPath ( path ) {
    return new Promise( ( resolve, reject ) => {
        try {
            Defaults.loader.path = path

            resolve()
        } catch {
            reject()
        }
    } )
}

export { setLoaderPath, InstancedFoliage, addFoliageInstancesToTiles, storeInstancedFoliage }