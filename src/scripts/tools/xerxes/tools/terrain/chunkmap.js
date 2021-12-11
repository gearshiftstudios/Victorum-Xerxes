import * as XBase from '../../base/base.js'

import { GLTFLoader } from '../../modules/loaders/gltf.js'

import { Entity } from '../entity/entity.js'
import { noise } from '../../libs/perlin.js'
import { calcMaxHeight, calcMinHeight, Face, Vertex } from './geometry.js'
import { getRandom } from '../array.js'
import { setLoaderPath, addFoliageInstancesToTiles, storeInstancedFoliage } from '../../modules/instances/foliage.js'
import { Water_LowPoly } from '../../modules/water/lowpoly.js'

window.dummy = new XBase.object3D()

class Map3D extends XBase.object3D {
    constructor ( width, height, elevMax, mult ) {
        super()

        this.animateWater = false
        this.biomePreset = 0
        this.chunks = new Array()
        this.initialized = false
        this.instances = {}
        this.inScene = false
        this.isGroup = true
        this.isMap = true
        this.isMapgroup = true
        this.mult = mult
        this.type = 'Map'

        this.water = {
            data: null,
            group: new XBase.group(),
        }

        this.elev = {
            max: elevMax,
            min: 0,
        }

        this.size = {
            width: width,
            height: height,
        }

        this.dev = {
            chunks: {
                boundsVisible: false
            },
        }
    }

    toggleChunkBounds () {
        if ( !this.dev.chunks.boundsVisible ) {
            this.chunks.forEach( c => {
                c.bounds.visible = true
                c.bounds.update()
            } )

            this.dev.chunks.boundsVisible = true
        } else {
            this.chunks.forEach( c => c.bounds.visible = false )

            this.dev.chunks.boundsVisible = false
        }
    }
}

class Chunk {
    constructor ( x, y, z, geometry, material, index ) {
        this.faces = new Array()
        this.index = index
        this.instances = {}
        this.mesh = new XBase.mesh.default( geometry, material )

        this.position = {
            map: new XBase.vec3( x, y, z ),
        }
    }
}

class ChunkMap {
    constructor ( scene ) {
        const scope = this
        
        this.fogVisible = false
        this.parent = scene
        this.trees = {}

        this.chunks = {
            hovered: new Array(),
            selected: new Array(),

            point: {
                hovered: new Array(),
                selected: new Array(),
            },
        }

        this.colors = {
            biomes: {
                desert: [ 0xbfab5c ],
                grass: [ 0x4e7825, 0x4e7826, 0x497023 ],
                mountain: [ 0x544828, 0x4a4024, 0x403721 ],
                sand: [ 0xb8a763, 0xb8a763, 0xa19255 ],
                taiga: [ 0x214010 ],
                tundra: [ 0xd6d6d6 ],
            }
        }

        this.tiles = {
            hovered: new Array(),
            selected: new Array(),

            point: {
                hovered: new Array(),
                selected: new Array(),
            },
        }

        this.biomes = new Array(
            [ 'tundra', 0.99, 0.99 ],
            [ 'taiga', 0.75, 0.97 ],
            [ 'temp-grass', 0.99, 0.99 ],
            [ 'temp-decid', 0.75, 0.97 ],
            [ 'temp-conif', 0.75, 0.97 ],
            [ 'sub-trop-desert', 0.98, 0.98 ],
            [ 'savanna', 0.90, 0.90 ],
            [ 'trop-seasonal', 0.5, 0.5 ],
            [ 'trop-rain', 0.5, 0.5 ],
        )

        this.settings = {
            mult: 2.5,

            biomes: {
                preset: 0,
            },
            elev: {
                max: 13,
                water: 0.1,
            },
            size: {
                width: 200,
                height: 200,
            },
            chunk: {
                amount: [ 0, 0 ],
                boundsVisible: false,
                size: 50,
            },
        }

        this.group = new Map3D( this.settings.size.width, this.settings.size.height, this.settings.elev.max, this.settings.mult )

        scene.add( this.group )
    }

    colorTile ( chunkIndex, tileIndex, color ) {
        if ( chunkIndex ) {
            if ( tileIndex ) {
                const chunk = this.group.chunks[ chunkIndex ],
                    tile = this.group.chunks[ chunkIndex ].tiles[ tileIndex ]

                const colorXYZ = chunk.mesh.geometry.getAttribute( 'color' ),

                    colors = new Array(
                        new XBase.color( color ? color : chunk.faces[ tile.a ].terrainColor ),
                        new XBase.color( color ? color : chunk.faces[ tile.b ].terrainColor )
                    )

                colorXYZ.setXYZ( chunk.faces[ tile.a ].vertices.nonIndexed[ 0 ], colors[ 0 ].r, colors[ 0 ].g, colors[ 0 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.a ].vertices.nonIndexed[ 1 ], colors[ 0 ].r, colors[ 0 ].g, colors[ 0 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.a ].vertices.nonIndexed[ 2 ], colors[ 0 ].r, colors[ 0 ].g, colors[ 0 ].b )

                colorXYZ.setXYZ( chunk.faces[ tile.b ].vertices.nonIndexed[ 0 ], colors[ 1 ].r, colors[ 1 ].g, colors[ 1 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.b ].vertices.nonIndexed[ 1 ], colors[ 1 ].r, colors[ 1 ].g, colors[ 1 ].b )
                colorXYZ.setXYZ( chunk.faces[ tile.b ].vertices.nonIndexed[ 2 ], colors[ 1 ].r, colors[ 1 ].g, colors[ 1 ].b )

                colorXYZ.needsUpdate = true
            }
        }
    }

    getTileHeightMax ( chunkIndex, tileIndex ) {
        if ( chunkIndex ) {
            if ( tileIndex ) {
                const chunk = this.group.chunks[ chunkIndex ],
                    tile = this.group.chunks[ chunkIndex ].tiles[ tileIndex ]

                const verticesHeight = [
                    this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 0 ] ].indexes[ 2 ] ],
                    this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 1 ] ].indexes[ 2 ] ],
                    this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 2 ] ].indexes[ 2 ] ],
                    this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                        .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ tile.vertices[ 3 ] ].indexes[ 2 ] ]
                ]

                return Math.max( ...verticesHeight )
            }
        }
    }

    setTileHeight ( chunkIndex, tileIndex, height, removeTree = false ) {
        return new Promise( resolve => {
            if ( chunkIndex ) {
                if ( this.group.allTiles[ tileIndex ].chunkTileIndex && ( 
                    this.group.allTiles[ tileIndex ].chunkTileIndex >= 0 && 
                    this.group.allTiles[ tileIndex ].chunkTileIndex < this.group.chunks[ chunkIndex ].tiles.length 
                ) ) {
                    const chunk = this.group.chunks[ chunkIndex ],
                        tile = this.group.chunks[ chunkIndex ].tiles[ this.group.allTiles[ tileIndex ].chunkTileIndex ],
                        tileVerticesXY = new Array()
    
                    for ( let i = 0; i < chunk.faces[ tile.a ].vertices.nonIndexed.length; i++ ) {
                        this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                            .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.a ].vertices.nonIndexed[ i ] ].indexes[ 2 ] ] = height
    
                        tileVerticesXY.push(
                            `${ this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.a ].vertices.nonIndexed[ i ] ].indexes[ 0 ] ]
                            }.${ this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.a ].vertices.nonIndexed[ i ] ].indexes[ 1 ] ] }`
                        )
    
                        this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                    }
    
                    for ( let i = 0; i < chunk.faces[ tile.b ].vertices.nonIndexed.length; i++ ) {
                        this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                            .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.b ].vertices.nonIndexed[ i ] ].indexes[ 2 ] ] = height
    
                        tileVerticesXY.push(
                            `${ this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.b ].vertices.nonIndexed[ i ] ].indexes[ 0 ] ]
                            }.${ this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ chunkIndex ].vertices.nonIndexed[ chunk.faces[ tile.b ].vertices.nonIndexed[ i ] ].indexes[ 1 ] ] }`
                        )
    
                        this.group.chunks[ chunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                    }
    
                    if ( tile.treeInfo ) {
                        dummy.castShadow = true
                        dummy.receiveShadow = true
    
                        tile.treeInfo[ 4 ] = ( removeTree == true ) ? -20 : height
    
                        dummy.position.set( 
                            tile.treeInfo[ 3 ],
                            tile.treeInfo[ 4 ],
                            tile.treeInfo[ 5 ]
                        )
    
                        dummy.rotation.set( 
                            tile.treeInfo[ 6 ],
                            tile.treeInfo[ 7 ],
                            tile.treeInfo[ 8 ]
                        )
    
                        dummy.scale.set( 
                            tile.treeInfo[ 9 ],
                            tile.treeInfo[ 10 ],
                            tile.treeInfo[ 11 ]
                        )
    
                        dummy.updateMatrix()
    
                        this.group.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                            .setMatrixAt( tile.treeInfo[ 2 ], dummy.matrix )
    
                        this.group.instances.trees[ tile.treeInfo[ 0 ] ][ tile.treeInfo[ 1 ] ]
                            .instanceMatrix.needsUpdate = true
                    }
    
                    for ( let i = 0; i < this.group.allTiles[ tileIndex ].adjacencies.length; i++ ) {
                        const aChunkIndex = this.group.allTiles[ this.group.allTiles[ tileIndex ].adjacencies[ i ] ].chunkIndex,
                            aChunk = this.group.chunks[ aChunkIndex ],
                            aTile = this.group.chunks[ aChunkIndex ].tiles[ this.group.allTiles[ this.group.allTiles[ tileIndex ].adjacencies[ i ] ].chunkTileIndex ]
    
                        for ( let f = 0; f < aChunk.faces[ aTile.a ].vertices.nonIndexed.length; f++ ) {
                            const stringed = `${ this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 0 ] ]
                            }.${ this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 1 ] ] }` 

                            tileVerticesXY.forEach( vxy => {
                                if ( vxy == stringed ) {
                                    this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                        .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                } else {
                                    const newString = {
                                        x: Number( stringed.split( '.' )[ 0 ] ),
                                        y: Number( stringed.split( '.' )[ 1 ] ),
                                    }

                                    const newXY = {
                                        x: Number( vxy.split( '.' )[ 0 ] ),
                                        y: Number( vxy.split( '.' )[ 1 ] ),
                                    }

                                    if ( 
                                        newString.x == -( this.settings.chunk.size / 2 ) && 
                                        newXY.x == this.settings.chunk.size / 2  &&
                                        newString.y == newXY.y
                                    ) {
                                        this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }

                                    if ( 
                                        newString.x == this.settings.chunk.size / 2 && 
                                        newXY.x == -( this.settings.chunk.size / 2 ) &&
                                        newString.y == newXY.y
                                    ) {
                                        this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }

                                    if ( 
                                        newString.y == -( this.settings.chunk.size / 2 ) && 
                                        newXY.y == this.settings.chunk.size / 2  &&
                                        newString.x == newXY.x
                                    ) {
                                        this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }

                                    if ( 
                                        newString.y == this.settings.chunk.size / 2 && 
                                        newXY.y == -( this.settings.chunk.size / 2 ) &&
                                        newString.x == newXY.x
                                    ) {
                                        this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.a ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    }
                                }
                            } )
    
                            this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                        }
    
                        for ( let f = 0; f < aChunk.faces[ aTile.b ].vertices.nonIndexed.length; f++ ) {
                            const stringed = `${ this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 0 ] ]
                            }.${ this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 1 ] ] }`
    
                                tileVerticesXY.forEach( vxy => {
                                    if ( vxy == stringed ) {
                                        this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                            .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                    } else {
                                        const newString = {
                                            x: Number( stringed.split( '.' )[ 0 ] ),
                                            y: Number( stringed.split( '.' )[ 1 ] ),
                                        }
    
                                        const newXY = {
                                            x: Number( vxy.split( '.' )[ 0 ] ),
                                            y: Number( vxy.split( '.' )[ 1 ] ),
                                        }
    
                                        if ( 
                                            newString.x == -( this.settings.chunk.size / 2 ) && 
                                            newXY.x == this.settings.chunk.size / 2  &&
                                            newString.y == newXY.y
                                        ) {
                                            this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
    
                                        if ( 
                                            newString.x == this.settings.chunk.size / 2 && 
                                            newXY.x == -( this.settings.chunk.size / 2 ) &&
                                            newString.y == newXY.y
                                        ) {
                                            this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
    
                                        if ( 
                                            newString.y == -( this.settings.chunk.size / 2 ) && 
                                            newXY.y == this.settings.chunk.size / 2  &&
                                            newString.x == newXY.x
                                        ) {
                                            this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
    
                                        if ( 
                                            newString.y == this.settings.chunk.size / 2 && 
                                            newXY.y == -( this.settings.chunk.size / 2 ) &&
                                            newString.x == newXY.x
                                        ) {
                                            this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position
                                                .array[ this.group.chunks[ aChunkIndex ].vertices.nonIndexed[ aChunk.faces[ aTile.b ].vertices.nonIndexed[ f ] ].indexes[ 2 ] ] = height
                                        }
                                    }
                                } )
    
                            this.group.chunks[ aChunkIndex ].mesh.geometry.attributes.position.needsUpdate = true
                        }

                        this.updateTileColor( aChunkIndex, this.group.allTiles[ tileIndex ].adjacencies[ i ] )
                    }

                    resolve( [ chunkIndex, tileIndex ] )
                }
            }
        } )
    }

    updateSelectedTiles ( height, buildMode ) {
        return new Promise( resolve => {
            this.tiles.selected.forEach( t => {
                t = t.split( '.' )
            
                this.setTileHeight( Number( t[ 0 ] ), Number( t[ 1 ] ), height, true )
                    .then( data => this.updateTileColor( data[ 0 ], data[ 1 ], buildMode ) )
            } )

            handler_minimap.rep.update.pixels()

            resolve()
        } )
    }

    /* generation */ 
    generateMacro ( mult = 2, camera ) {
        return new Promise( resolve => {
            this.group.initialized = false

            this.generateHeightmapCanvases()
                .then( () => this.generateChunkData( mult, mult, 1, 'none' ) )
                .then( () => this.drawChunkData() )
                .then( () => this.regenerateChunks() )
                .then( () => this.generateChunkMeshes() )
                .then( () => this.generateChunkPeaks() )
                .then( () => this.generateChunkFaces() )
                .then( () => this.generateChunkColors() )
                .then( () => this.loadTrees( this.trees ) )
                .then( () => this.generateChunkTiles() )
                .then( () => this.separateChunkTilesByBiome() )
                .then( () => this.generateChunkTreeInstances() )
                .then( () => this.generateWater( camera ) )
                .then( () => this.generateRandomBuildings() )
                .then( () => resolve() )
        } )
    }

    generateHeightmapCanvases () {
        return new Promise( resolve => {
            if ( document.body.querySelector( 'debug' ).querySelector( '#macromap' ) ) {
                document.body.querySelector( 'debug' ).querySelector( '#macromap' ).remove()
            }

            if ( document.body.querySelector( 'debug' ).querySelector( '#biomes-macromap' ) ) {
                document.body.querySelector( 'debug' ).querySelector( '#biomes-macromap' ).remove()
            }
            
            const macroCanvas = document.createElement( 'canvas' )
            macroCanvas.setAttribute( 'id', 'macromap' )
            document.body.querySelector( 'debug' ).appendChild( macroCanvas )

            const biomeCanvas = document.createElement( 'canvas' )
            biomeCanvas.setAttribute( 'id', 'biomes-macromap' )
            document.body.querySelector( 'debug' ).appendChild( biomeCanvas )

            this.settings.chunk.amount[ 0 ] = this.group.size.width / this.settings.chunk.size
            this.settings.chunk.amount[ 1 ] = this.group.size.height / this.settings.chunk.size

            for ( let h = 0; h < this.settings.chunk.amount[ 1 ]; h++ ) {
                for ( let w = 0; w < this.settings.chunk.amount[ 0 ]; w++ ) {
                    const n = ( h * this.settings.chunk.amount[ 0 ] + w )

                    if ( document.body.querySelector( 'debug' ).querySelector( `#chunk-${ n }` ) ) {
                        document.body.querySelector( 'debug' ).querySelector( `#chunk-${ n }` ).remove()
                    }
        
                    if ( document.body.querySelector( 'debug' ).querySelector( `#biomes-chunk-${ n }` ) ) {
                        document.body.querySelector( 'debug' ).querySelector( `#biomes-chunk-${ n }` ).remove()
                    }
            
                    const hCanvas = document.createElement( 'canvas' )
                    hCanvas.setAttribute( 'id', `chunk-${ n }` )
                    document.body.querySelector( 'debug' ).appendChild( hCanvas )

                    const bCanvas = document.createElement( 'canvas' )
                    bCanvas.setAttribute( 'id', `biomes-chunk-${ n }` )
                    document.body.querySelector( 'debug' ).appendChild( bCanvas )

                    hCanvas.width = this.settings.chunk.size + 3
                    hCanvas.height = this.settings.chunk.size + 3

                    bCanvas.width = this.settings.chunk.size + 2
                    bCanvas.height = this.settings.chunk.size + 2
                } 
            }

            const canvases = document.body.querySelector( 'debug' ).querySelectorAll( 'canvas' )

            for ( let i = 0; i < canvases.length; i++ ) {
                let ctx = canvases[ i ].getContext( '2d' )
                
                ctx.fillStyle = 'rgb(0,0,0)'
                ctx.fillRect( 0, 0, canvases[ i ].width, canvases[ i ].height )
            }

            resolve()
        } )
    }

    generateChunkData ( _mainMulti, _secondMulti, _exp, _mask ) {
        return new Promise( resolve => {
            const scope = this

            let canvas = document.body.querySelector( 'debug' ).querySelector( '#macromap' ),
                ctx = canvas.getContext( '2d' ),

                bCanvas = document.body.querySelector( 'debug' ).querySelector( '#biomes-macromap' ),
                bctx = bCanvas.getContext( '2d' ),
    
                cellSize = 1,
    
                multiplierPerlin = _mainMulti,
                octaveMulti = _secondMulti,
                exp = _exp,
                mask = _mask,
                width = this.group.size.width + 3,
                height = this.group.size.height + 3,
                seaLevel = 0.5
    
            canvas.width = width * cellSize
            canvas.height = height * cellSize

            bCanvas.width = this.group.size.width * cellSize
            bCanvas.height = this.group.size.height * cellSize
    
            let heightMap = [],
                tempMap = [],
                moistMap = [],
                biomeMap = [],
                archipelagoMask = [],
                grtLakesMask = []
    
        function convertTo1D ( map ) {
            let out = []

            for ( let y = 0; y < height; y++ ) {
                for ( let x = 0; x < width; x++ ) out.push( map[ x ][ y ] )
            }

            return ( out )
        }

        function clamp ( val, min, max ) {
            if ( val > max ) val = max
            if ( val < min ) val = min

            return ( val )
        }
    
        function draw () {
            ctx.clearRect( 0, 0, canvas.width, canvas.height )
          
            for ( let x = 0; x < width; x++ ) {
                for ( let y = 0; y < height; y++ ) {
                    ctx.fillStyle = `rgb(${ heightMap[ x ][ y ] *  255 },${ heightMap[ x ][ y ] * 255 },${ heightMap[ x ][ y ] * 255 })`
                    ctx.fillRect( x * cellSize, y * cellSize, cellSize, cellSize )
                }
            }
        }

        function ridgifyEdit(x,y) {
            for (let x1 = -1; x1 < 1; x1++) {
                for (let y1 = -1; y1 < 1; y1++) {
                    if (heightMap[x][y] !== 0) {
                        if (heightMap[x+x1][y+y1] <= heightMap[x][y] && heightMap[x+x1][y+y1] <= 0.1 && heightMap[x+x1][y+y1] >= 0) {
                            heightMap[x+x1][y+y1] = heightMap[x][y]*0.99
                            if (x1 > 1 && y1 > 1 && x1 < width - 1 && y1 < height - 1) {
                            ridgifyEdit(x+x1,y+y1)
                            }
                        } else {
                            heightMap[x+x1][y+y1] = 0
                        }
                    }
                }
            }
            heightMap[x][y] *= 10
        }

        function ridgify1() {
            for (let x = 2; x < width - 2; x++) {
                for (let y = 2; y < height - 2; y++) {
                    if (heightMap[x][y] !== 0) {
                        ridgifyEdit(x,y)
                    }
                }
            }
        }

        function reNoise() {
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    let ef = noise.perlin2(x*multiplierPerlin,y*multiplierPerlin)
                    ef = ef / (1 + 0.5 + 0.25);
                    ef += 1.0;
                    ef /= 2.0; 
                    heightMap[x][y] -= ef/20
                    heightMap[x][y] = clamp(heightMap[x][y],0,1)
                }
            }
        }

        function drawBiomes () {
            scope.group.biomeColorMap = {}

            bctx.clearRect( 0, 0, bCanvas.width, bCanvas.height )
          
            for ( let x = 0; x < scope.group.size.width; x++ ) {
                for ( let y = 0; y < scope.group.size.height; y++ ) {
                    let color

                    switch ( biomeMap[ x ][ y ] ) {
                        case 0:
                            color = 20

                            scope.group.biomeColorMap[ 20 ] = 0
                            break
                        case 1:
                            color = 40

                            scope.group.biomeColorMap[ 40 ] = 1
                            break
                        case 2:
                            color = 60

                            scope.group.biomeColorMap[ 60 ] = 2
                            break
                        case 3:
                            color = 80

                            scope.group.biomeColorMap[ 80 ] = 3
                            break
                        case 4:
                            color = 100

                            scope.group.biomeColorMap[ 100 ] = 4
                            break
                        case 5:
                            color = 120

                            scope.group.biomeColorMap[ 120 ] = 5
                            break
                        case 6:
                            color = 140

                            scope.group.biomeColorMap[ 140 ] = 6
                            break
                        case 7:
                            color = 160

                            scope.group.biomeColorMap[ 160 ] = 7
                            break
                        case 8:
                            color = 180

                            scope.group.biomeColorMap[ 180 ] = 8
                            break
                    }

                    bctx.fillStyle = `rgb(${ color },${ color },${ color })`
                    bctx.fillRect( x * cellSize, y * cellSize, cellSize, cellSize )
                }
            }
        }
    
        function initMasks () {
            for ( let x = 0; x < width; x++ ) {
                archipelagoMask.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5,
                        d = Math.sqrt( nx * nx + ny * ny ) / Math.sqrt( 0.5 )

                    archipelagoMask[x][y] = d
                }
            }

            for ( let x = 0; x < width; x++ ) {
                grtLakesMask.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5,
                        d = Math.sqrt( nx * nx + ny * ny ) / Math.sqrt( 0.5 )
                        
                    d = Math.pow( d, 2.5 )

                    grtLakesMask[ x ] [y ] = -d
                }
            }
        }
    
        function initHM () {
            noise.seed( Math.random() )

            for ( let x = 0; x < width; x++ ) {
                heightMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5,
                        e = 1 * octaveMulti * noise.perlin2( 1 * nx * multiplierPerlin * octaveMulti, 1 * ny * multiplierPerlin * octaveMulti )
                        + 0.5 * octaveMulti * noise.perlin2( 2 * nx * multiplierPerlin * octaveMulti, 2 * ny * multiplierPerlin * octaveMulti )
                        + 0.25 * octaveMulti * noise.perlin2( 4 * nx * multiplierPerlin * octaveMulti, 4 * ny * multiplierPerlin * octaveMulti )

                    e = e / ( 1 + 0.5 + 0.25 )
                    e += 1.0
                    e /= 2.0
    
                    // if ( e <= seaLevel ) e = 0
    
                    // e -= seaLevel

                    if ( mask !== 'great lakes' ) {
                        // if ( e <= 0 ) e = 0
                    } else {
                        // if  (e <= 0 ) e = 0
                    }

                    let value = e
                    value = Math.pow( e, exp )

                    heightMap[ x ][ y ] = value
                }
            }
        }
    
        function initTM () {
            noise.seed( Math.random() )

            for ( let x = 0; x < width; x++ ) {
                tempMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5

                    tempMap[ x ][ y ] = noise.perlin2( nx * multiplierPerlin, ny * multiplierPerlin )
                }
            }
        }
    
        function initMM () {
            noise.seed( Math.random() )
            
            for ( let x = 0; x < width; x++ ) {
                moistMap.push( [] )

                for ( let y = 0; y < height; y++ ) {
                    let nx = x / width - 0.5,
                        ny = y / height - 0.5

                    moistMap[ x ][ y ] = noise.perlin2( nx * multiplierPerlin, ny * multiplierPerlin )
                }
            }
        }
    
        // 0 = tundra
        // 1 = taiga
        // 2 = temp grassland
        // 3 = temp decid forest
        // 4 = temp conif forest
        // 5 = sub trop desert
        // 6 = savanna
        // 7 = trop seasonal forest
        // 8 = trop rainforest
    
        function biomeCheck () {
            // console.log(tempMap)
            for ( let x = 0; x < width; x++ ) {
                biomeMap.push( [] )
                for ( let y = 0; y < height; y++ ) {
                    switch ( scope.group.biomePreset ) {
                        case 0:
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 1: 
                            if ( moistMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 2: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 3
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else biomeMap[ x ][ y ] = 6
                            }

                            break
                        case 3: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 4: 
                            if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else biomeMap[ x ][ y ] = 2
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 3
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else biomeMap[ x ][ y ] = 7
                            }

                            break
                        case 5: 
                            if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 6: 
                            if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else if ( moistMap[ x ][ y ] <= 0.2  ) biomeMap[ x ][ y ] = 7
                                else biomeMap[ x ][ y ] = 8
                            }

                            break
                        case 7: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else if ( moistMap[ x ][ y ] <= 0.3 ) biomeMap[ x ][ y ] = 3
                                else biomeMap[ x ][ y ] = 4
                            }

                            break
                        case 8: 
                            if ( tempMap[ x ][ y ] <= -0.3) biomeMap[ x ][ y ] = 0
                            else if ( tempMap[ x ][ y ] <= -0.1 ) {
                                if ( moistMap[ x ][ y ] <= -0.45 ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.35 ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 1
                            } else if ( tempMap[ x ][ y ] <= 0.35 ) {
                                if ( moistMap[ x ][ y ] <= -0.425  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.3  ) biomeMap[ x ][ y ] = 2
                                else biomeMap[ x ][ y ] = 3
                            } else {
                                if ( moistMap[ x ][ y ] <= -0.35  ) biomeMap[ x ][ y ] = 5
                                else if ( moistMap[ x ][ y ] <= -0.275  ) biomeMap[ x ][ y ] = 6
                                else biomeMap[ x ][ y ] = 7
                            }

                            break
                    }
                }
            }
        }
    
        function applyMask ( mask ) {
            switch ( mask ) {
                case 'archipelago':
                    for ( let x = 0; x < width; x++ ) {
                        for ( let y = 0; y < height; y++ ) heightMap[ x ][ y ] -= archipelagoMask[ x ][ y ] / 1.25
                    }

                    break
                case 'great lakes':
                    for ( let x = 0; x < width; x++ ) {
                        for ( let y = 0; y < height; y++ ) {
                            
                            heightMap[ x ][ y ] += ( grtLakesMask[ x ][ y ] ) * 1.5

                            if ( heightMap[ x ][ y ] <= 0 ) heightMap[ x ][ y ] = 0
                            
                            heightMap[ x ][ y ] -= 0.5
                            heightMap[ x ][ y ] *= -1
                            heightMap[ x ][ y ] += 0.2

                            if ( heightMap[ x ][ y ] < 0.7 ) heightMap[ x ][ y ] *= 0.5
                        }
                    }

                    break
                }
            }
    
            initMasks()
            initHM()

            // for ( let i = 0; i < 15; i++ ) ridgify1()

            reNoise()
            applyMask( mask )
            initTM()
            initMM()
            biomeCheck()
            draw()
            drawBiomes()

            const chunkMaps = new Array()

            for ( let ch = 0; ch < this.group.size.height; ch += 50 ) {
                for ( let cw = 0; cw < this.group.size.width; cw += 50 ) {
                    chunkMaps.push( {
                        x: cw,
                        y: ch,
                        data: ctx.getImageData( cw, ch, 51, 51 ),
                        biomes: bctx.getImageData( cw, ch, 50, 50 ),
                    } )
                }
            }

            this.group.heightMaps = chunkMaps

            resolve()
        } )
    }

    drawChunkData () {
        return new Promise( resolve => {
            this.group.chunkHeightMaps = new Array()
            this.group.chunkBiomeMaps = new Array()

            this.group.heightMaps.forEach( ( h, ix ) => {
                let canvas = document.body.querySelector( 'debug' ).querySelector( `#chunk-${ ix }` ),
                    ctx = canvas.getContext( '2d' ),
                    
                    bCanvas = document.body.querySelector( 'debug' ).querySelector( `#biomes-chunk-${ ix }` ),
                    bctx = bCanvas.getContext( '2d' ) 


                const start = { x: 1, y: 1, bx: 1, by: 1 }

                for ( let y = 0; y < h.data.height; y++ ) {
                    start.y = 1 + y
                    start.x = 1

                    for ( let x = 0; x < h.data.width; x++ ) {
                        const n = ( y * h.data.height + x ),
                            hColor = h.data.data[ n * 4 ]

                        start.x = 1 + x

                        ctx.fillStyle = `rgb(${ hColor },${ hColor },${ hColor })`
                        ctx.fillRect( start.x * 1, start.y * 1, 1, 1 )
                    }
                }

                for ( let y = 0; y < h.biomes.height; y++ ) {
                    start.by = 1 + y
                    start.bx = 1

                    for ( let x = 0; x < h.biomes.width; x++ ) {
                        const n = ( y * h.biomes.height + x ),
                            bColor = h.biomes.data[ n * 4 ]

                        start.bx = 1 + x

                        bctx.fillStyle = `rgb(${ bColor },${ bColor },${ bColor })`
                        bctx.fillRect( start.bx * 1, start.by * 1, 1, 1 )
                    }
                }

                this.group.chunkHeightMaps.push( ctx.getImageData( 0, 0, canvas.width, canvas.width ) )
                this.group.chunkBiomeMaps.push( bctx.getImageData( 0, 0, bCanvas.width, bCanvas.width ) )
            } )

            resolve()
        } )
    }

    regenerateChunks () {
        return new Promise( resolve => {
            if ( this.group.instances.trees ) {
                for ( const t in this.group.instances.trees ) {
                    for ( const _t in this.group.instances.trees[ t ] ) {
                        this.group.remove( this.group.instances.trees[ t ][ _t ] )
                    }
                }
            }

            if ( this.group.chunks != null && this.group.chunks.length > 0 ) {
                for ( let i = 0; i < this.group.chunks.length; i++ ) {
                    this.group.chunkMeshes.remove( this.group.chunks[ i ].mesh )
                }

                this.group.chunks = new Array()
            }

            if ( this.group.water ) {
                this.group.remove( this.group.water.mesh )

                this.group.water = null
            }

            if ( this.group.background ) {
                if ( this.group.background.paper != null ) {
                    this.group.remove( this.group.background.paper )
                   
                    this.group.background.paper = null
                }

                if ( this.group.background.grid != null ) {
                    this.group.remove( this.group.background.grid )
                   
                    this.group.background.grid = null
                }
            }

            resolve()
        } )
    }

    generateChunkMeshes () {
        return new Promise( resolve => {
            this.group.chunks = new Array()
            this.group.chunkGeometry = new Array()
            this.group.chunkMeshes = new XBase.group()

            this.group.material = new XBase.mat.mesh.standard( {
                flatShading: true,
                vertexColors: true,
                shininess: 0,
            } ),
            
            this.group.add( this.group.chunkMeshes )

            let ix = 0

            for ( 
                let h = -( ( this.group.size.height / 2 ) - ( this.settings.chunk.size / 2 ) ); 
                h < this.group.size.height / 2; 
                h += this.settings.chunk.size
            ) {
                for ( 
                    let w = -( ( this.group.size.width / 2 ) - ( this.settings.chunk.size / 2 ) ); 
                    w < this.group.size.width / 2; 
                    w += this.settings.chunk.size 
                ) {
                    const chunk = new Chunk( 
                        w, 0, h,
                        new XBase.geometry.buffer.plane(
                            this.settings.chunk.size + 2,
                            this.settings.chunk.size + 2,
                            this.settings.chunk.size + 2,
                            this.settings.chunk.size + 2
                        ),
                        this.group.material,
                        ix
                    )
                        
                    chunk.mesh.castShadow = true
                    chunk.mesh.receiveShadow = true
                    chunk.mesh.chunkIndex = ix
                    chunk.mesh.position.set( w, 0, h )
                    chunk.mesh.rotation.x = XBase.util.math.degToRad( -90 )

                    this.group.chunkMeshes.add( chunk.mesh )
                    this.group.chunkGeometry.push( chunk.mesh.geometry.attributes.position.array )
                    this.group.chunks.push( chunk )

                    ix++
                }
            }

            resolve()
        } )
    }

    generateChunkPeaks () {
        return new Promise( resolve => {
            const worker = new Worker( './src/scripts/tools/xerxes/tools/terrain/workers/chunk/peaks.js' )

            worker.postMessage( [
                this.group.chunkHeightMaps,
                this.group.chunkGeometry,
                this.settings.chunk.size,
                this.group.elev.min,
                this.group.elev.max
            ] )

            worker.onmessage = e => {
                this.group.chunks.forEach( ( c, ix ) => {
                    c.mesh.geometry.attributes.position.array = e.data[ 0 ][ ix ]
                    c.vertices = e.data[ 1 ][ ix ]

                    c.mesh.geometry.attributes.position.needsUpdate = true

                    c.bounds = new XBase.helper.box.default( c.mesh, 0xff00ff )
                    c.bounds.visible = false

                    this.group.add( c.bounds )

                    resolve()
                } )
            }
        } )
    }

    generateChunkFaces () {
        return new Promise( resolve => {
            var startTime = performance.now()

            this.group.chunkVertices = new Array()

            this.group.chunks.forEach( c => {
                let face = new Face(),
                indexedCount = 0,
                nonIndexedCount = 0,
                faceCount = 0

                c.mesh.geometry.index.array.forEach( v => {
                    face.vertices.indexed.push( v )
        
                    indexedCount++
        
                    if ( indexedCount == 3 ) {
                        c.faces.push( face )
        
                        indexedCount = 0
                        
                        face = new Face()
                    }
                } )
        
                const vertices_copy = c.vertices,
                faces_copy = c.faces
        
                let newGeo = c.mesh.geometry.toNonIndexed()
        
                c.mesh.geometry = newGeo
                c.vertices = vertices_copy
                c.faces = faces_copy
        
                let vertex = new Vertex(), count = 0
        
                c.mesh.geometry.attributes.position.array.forEach( ( v, index ) => {
                    vertex.indexes.push( index )
                    vertex.position.push( v )
        
                    count++
        
                    if ( count == 3 ) {
                        c.vertices.nonIndexed.push( vertex )
        
                        count = 0
                        
                        vertex = new Vertex()
                    }
                } )
        
                c.vertices.nonIndexed.forEach( ( v, index ) => {
                    c.faces[ faceCount ].vertices.nonIndexed.push( index )
        
                    nonIndexedCount++
        
                    if ( nonIndexedCount == 3 ) {
                        nonIndexedCount = 0
        
                        faceCount++
                    }
                } )

                this.group.chunkVertices.push( c.vertices )
            } )

            var endTime = performance.now()

            console.log( endTime - startTime )

            resolve()
        } )
    }

    generateChunkColors () {
        return new Promise( resolve => {
            this.group.chunkFaces = new Array()

            this.group.chunks.forEach( ( c, ix ) => {
                c.mesh.geometry.setAttribute( 'color', new XBase.attribute.buffer( 
                    new Float32Array( c.vertices.nonIndexed.length * 3 ), 
                    3 
                ) )
        
                let color = new XBase.color(),
                    colorXYZ = c.mesh.geometry.attributes.color
        
                let tileNum = 0

                var colors = [
                    new XBase.color( 0x7a6f43 ),
                    new XBase.color( 0xb8a763 ),
                    new XBase.color( 0x4e7825 ),
                    new XBase.color( 0x99a132 ),
                    new XBase.color( 0x4a4924 ),
                    new XBase.color( 0xededed ),
                    new XBase.color("#ffffff")
                  ];
        
                c.faces.forEach( ( f, ixf ) => {
                    f.isCliff = false
                    f.isCoast = false
                    f.isCrust = false
            
                    const min = calcMinHeight( c, f )
                    const max = calcMaxHeight( c, f )
        
                    /* get tile that this face belongs to */
                    if ( ixf % 2 == 0 ) {
                        f.tile = tileNum
        
                        tileNum++
                    } else f.tile = tileNum - 1
        
                    /* color this face based upon biomeMap's value */
                    f.biome = this.group.biomeColorMap[ this.group.chunkBiomeMaps[ ix ].data[ f.tile * 4 ] ]
        
                    // 0 = tundra
                    // 1 = taiga
                    // 2 = temp grassland
                    // 3 = temp decid forest
                    // 4 = temp conif forest
                    // 5 = sub trop desert
                    // 6 = savanna
                    // 7 = trop seasonal forest
                    // 8 = trop rainforest
        
                    switch ( f.biome ) {
                        case 0:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.tundra ) )
                            break
                        case 1:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.grass ) )
                            break
                        case 2:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.grass ) )
                            break
                        case 3:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.grass ) )
                            break
                        case 4:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.grass ) )
                            break
                        case 5:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.desert ) )
                            break
                        case 6:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.desert ) )
                            break
                        case 7:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.grass ) )
                            break
                        case 8:
                            f.biomeColor = new XBase.color( getRandom( this.colors.biomes.grass ) )
                            break
                    }
                        
                    /* assign colors based upon the elev of points within face */
                    if ( min < this.group.elev.min + 0.75 ) {
                        if ( f.biome == 0 ) {
                            f.terrainColor = 0x5c5c5c // cliff
                        } else {
                            f.isCoast = true
        
                            f.terrainColor = getRandom( this.colors.biomes.sand ) // shore
                        }
                    }
                        
                    if ( min == this.group.elev.min && max == this.group.elev.min ) {
                        f.terrainColor = 0xb8a763
                    }

                    if ( max > 11 ) {
                        f.isCliff = true

                        f.terrainColor = 0x8a9488
                    }

                    if ( min < 0.7 ) {
                        if ( f.biome == 0 ) {
                            f.terrainColor = colors[ 0 ]
                                .clone()
                                .lerp( new XBase.color( 0x5c5c5c ).clone(), this.scaleOut( min, -0.3, 0.7, 0, 1));
                        } else {
                            f.terrainColor = colors[ 0 ]
                                .clone()
                                .lerp( new XBase.color( getRandom( this.colors.biomes.sand ) ).clone(), this.scaleOut( min, -0.3, 0.7, 0, 1));
                        }
                    } else if ( min < 1.25 ) {
                        if ( f.biome == 0 ) {
                            f.terrainColor = new XBase.color( 0x5c5c5c )
                                .clone()
                                .lerp( f.biomeColor.clone(), this.scaleOut( min, 0.75, 1.25, 0, 1));
                        } else {
                            f.terrainColor = colors[1]
                                .clone()
                                .lerp( f.biomeColor.clone(), this.scaleOut( min, 0.75, 1.25, 0, 1));
                        }
                    } else if ( min < 6.0 ) {
                        if ( f.biome == 0 ) {
                            f.terrainColor = f.biomeColor
                                .clone()
                                .lerp( new XBase.color( 0xc4c4c4 ).clone(), this.scaleOut( min, 1.25, 6.0, 0, 1));
                        } else {
                            f.terrainColor = f.biomeColor
                                .clone()
                                .lerp(colors[3].clone(), this.scaleOut( min, 1.25, 6.0, 0, 1));
                        }
                    } else if ( min < 11.0 ) {
                        if ( f.biome == 0 ) {
                            f.terrainColor = new XBase.color( 0xc4c4c4 )
                                .clone()
                                .lerp( new XBase.color( 0xd4d4d4 ).clone(), this.scaleOut( min, 6.0, 11.0, 0, 1 ) )
                        } else {
                            f.terrainColor = colors[3]
                                .clone()
                                .lerp( new XBase.color( getRandom( this.colors.biomes.mountain ) ).clone(), this.scaleOut( min, 6.0, 11.0, 0, 1 ) )
                        }
                    } else {
                        f.terrainColor = new XBase.color( getRandom( this.colors.biomes.mountain ) )
                            .clone()
                            .lerp( colors[ 5 ].clone(), this.scaleOut( min, 11.0, 21, 0, 1 ) )
                    }

                    if ( max - min >= 1 ) {
                        f.isCliff = true

                        f.terrainColor = new XBase.color( getRandom( this.colors.biomes.mountain ) )
                    }

                    if ( min < this.group.elev.min - 1 ) {
                        f.isCrust = true
    
                        f.terrainColor = new XBase.color( 0x452b01 )
                    }

                    color = f.terrainColor
        
                    f.vertices.nonIndexed.forEach( v => {
                        colorXYZ.setXYZ( v, color.r, color.g, color.b )
                    } )
                } )

                this.group.chunkFaces.push( c.faces )
        
                colorXYZ.needsUpdate = true
            } )

            resolve()
        } )
    }

    generateChunkTiles () {
        return new Promise( resolve => {
            const worker = new Worker( './src/scripts/tools/xerxes/tools/terrain/workers/chunk/tiles.js' )

            this.group.chunkTiles = new Array()

            worker.postMessage( [ 
                this.group.chunkFaces,
                this.group.chunkVertices,
                this.biomes,
                this.group.size.width,
                this.group.size.height,
                this.settings.chunk.size
            ] )

            worker.onmessage = e => {
                this.group.chunks.forEach( ( c, ix ) => {
                    c.tiles = e.data[ 0 ][ ix ]

                    this.group.chunkTiles.push( c.tiles )
                } )

                this.group.allTiles = e.data[ 1 ]
                this.group.chunkFacesRelTiles = e.data[ 2 ]
                this.group.chunkFaces = e.data[ 3 ]

                this.group.chunkFaces.forEach( ( cf, ix ) => {
                    this.group.chunks[ ix ].faces = cf
                } )

                resolve()
            }
        } )
    }
    
    generateChunkTreeInstances () {
        return new Promise ( resolve => {
            addFoliageInstancesToTiles( this.group, this.trees )
                .then( () => resolve() )
        } )
    }

    separateChunkTilesByBiome () {
        return new Promise ( resolve => {
            const worker = new Worker( './src/scripts/tools/xerxes/tools/terrain/workers/chunk/biometiles.js' )

            worker.postMessage( [ 
                this.group.chunkTiles,
                this.biomes,
                JSON.stringify( this.trees ),
                this.group.allTiles
            ] )

            worker.onmessage = e => {
                this.group.chunkTiles = new Array()

                this.group.chunks.forEach( ( c, ix ) => {
                    c.tilesByBiome = e.data[ 0 ][ ix ]
                    c.waterTiles = e.data[ 1 ][ ix ]
                    c.tiles = e.data[ 2 ][ ix ]

                    this.group.chunkTiles.push( c.tiles )
                } )

                this.group.allTiles = e.data[ 3 ]
                this.group.allTilesByBiome = JSON.parse( e.data[ 4 ] )
                this.group.allWaterTiles = e.data[ 5 ]

                resolve()
            }
        } )
    }

    generateWater ( camera ) {
        return new Promise ( resolve => {
                this.water = new Water_LowPoly( this.group, camera, {}, 200, 200, 200, 200 )
        
                this.water.mesh.rotation.x = Math.PI * - 0.5;
    
                resolve()
        } )
    }
    
    generateFog ( geoParams ) {
        return new Promise( resolve => {
            this.group.fogMask = []

            const area = geoParams.width * geoParams.height

            for ( let i = 0; i < area; i++ ) this.group.fogMask.push( 1 )

            if ( area == 250000 ) {
                this.group.fogMask[ 249498 ] = 0
                this.group.fogMask[ 249497 ] = 0
                this.group.fogMask[ 249496 ] = 0

                this.group.fogMask[ 248998 ] = 0
                this.group.fogMask[ 248997 ] = 0
                this.group.fogMask[ 248996 ] = 0

                this.group.fogMask[ 248498 ] = 0
                this.group.fogMask[ 248497 ] = 0
                this.group.fogMask[ 248496 ] = 0
            }
         
            //create a typed array to hold texture data
            const data = new Uint8Array( this.group.fogMask.length )

            //copy mask into the typed array
            data.set( this.group.fogMask.map( v => v * 255 ) )

            //create the texture
            const texture = new XBase.texture.data( 
                data, 
                geoParams.width, 
                geoParams.height, 
                XBase.luminanceFormat, 
                XBase.unassigned.byteType 
            )
         
            texture.flipY = true
            texture.wrapS = XBase.clampToEdgeWrapping
            texture.wrapT = XBase.clampToEdgeWrapping

            //it's likely that our texture will not have "power of two" size, meaning that mipmaps are not going to be supported on WebGL 1.0, so let's turn them off
            texture.generateMipmaps = false
         
            texture.magFilter = XBase.linearFilter
            texture.minFilter = XBase.linearFilter
         
            texture.needsUpdate = true
         
            const geometry = new XBase.geometry.buffer.plane( 
                geoParams.width, 
                geoParams.height, 
                geoParams.width, 
                geoParams.height 
            )

            const material = new XBase.mat.mesh.basic( {
                color: 0x000000, 
                alphaMap: texture, 
                transparent: true, 
                opacity:0.9
            } )
        
            /* construct a mesh */
            this.group.fog = new XBase.mesh.default( geometry, material )

            /* add the mesh to the group */
            this.group.add( this.group.fog )
        
            this.group.fog.rotation.x = XBase.util.math.degToRad( -90 )
            this.group.fog.position.y = 0.3

            resolve()
        } )
    }

    generateSpatialAudio () {
        return new Promise( resolve => {
            const listener = new XBase.audio.listener()
            program.environments.main.camera.add( listener )

            const sound = new XBase.audio.positional( listener )

            // load a sound and set it as the PositionalAudio object's buffer
            const audioLoader = new XBase.loader.audio()
            audioLoader.load( './sounds/environment/seagulls.mp3', function( buffer ) {
	            sound.setBuffer( buffer )
	            sound.setRefDistance( 10 )
                sound.loop = true
                sound.autoplay = true
	            sound.play()
            } )

            this.group.add( sound )

            resolve()
        } )
    }

    scaleOut ( val, smin, smax, emin, emax ) {
        const tx = ( val - smin ) / ( smax - smin )

        return ( emax - emin ) * tx + emin
    }

    getDefaultTreeSettings ( minScale, maxScale ) {
        return {
            maxOffsetX: 0.25,
            maxOffsetY: -0.05,
            maxOffsetZ: 0.25,
            maxRotX: 5,
            maxRotY: 360,
            maxRotZ: 5,
            maxScale: maxScale ? maxScale : 1,
            minOffsetX: -0.25,
            minOffsetY: -0.2,
            minOffsetZ: -0.25,
            minRotX: -5,
            minRotY: -360,
            minRotZ: -5,
            minScale: minScale ? minScale : 1,
        }
    }

    loadTrees ( storageObject ) {
        return new Promise( ( resolve, reject ) => {
            setLoaderPath( './public/assets/models/trees/' )
                .then( () => storeInstancedFoliage( 'temp-decid.average', true, storageObject, this.getDefaultTreeSettings( 0.25, 0.3 ) ) )
                .then( () => storeInstancedFoliage( 'temp-decid.moderate', true, storageObject, this.getDefaultTreeSettings( 0.25, 0.3 ) ) )
                .then( () => storeInstancedFoliage( 'temp-decid.tall', true, storageObject, this.getDefaultTreeSettings( 0.25, 0.3 ) ) )
                .then( () => storeInstancedFoliage( 'taiga.tall', true, storageObject, this.getDefaultTreeSettings( 0.174, 0.176 ) ) )
                .then( () => storeInstancedFoliage( 'tundra.tall', true, storageObject, this.getDefaultTreeSettings( 0.174, 0.176 ) ) )
                .then( () => storeInstancedFoliage( 'sub-trop-desert.tall', true, storageObject, this.getDefaultTreeSettings( 0.00274, 0.00276 ) ) )
                .then( () => resolve() )
        } )
    }

    generateRandomBuildings () {
        return new Promise( ( resolve, reject ) => {
            this.group.allTiles.forEach( t => {
                if ( !t.hasTree && !t.isCrust && !t.isCoast ) {
                    if ( ( Math.random() > 0.99 ) == true ) {
                        const Loader = new GLTFLoader()
                        Loader.load( './public/assets/models/buildings/mill.gltf', model => {
                            // const entity = new Entity( model, this.group, 'spin' )

                            // entity.model.scene.position.set(
                            //     t.center[ 0 ] + 0.25,
                            //     t.maxHeight,
                            //     t.center[ 1 ]
                            // )
                        } )
                    }
                }
            } )

            resolve()
        } )
    }
}

export { Chunk, ChunkMap }