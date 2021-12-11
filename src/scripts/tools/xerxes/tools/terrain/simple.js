import * as XBase from '../xerxes/base/base.js'
import { SimplexNoise } from '../xerxes/libs/simplex.js'
import { Face, Vertex } from './geometry.js'

const Settings = {
    terrain: {
        height: 100,
        width: 100,

        colors: [
            0x4c8529,
            0x518f2f,
            0x468026
        ],

        materials: {
            liveview: {
                flatShading: true,
                shininess: 0,
                vertexColors: true,
            },
            mapview: {
                flatShading: true,
                shininess: 0,
                vertexColors: true,
            },
        },
    },
}

function map( val, smin, smax, emin, emax ) {
    const t = ( val - smin ) / ( smax - smin )

    return ( emax - emin ) * t + emin
}

function getRandomTerrainColor () {
    return Settings.terrain.colors[ Math.floor( Math.random() * Settings.terrain.colors.length ) ]
}

function generateHeightMap ( simplex, width = Settings.terrain.width, height = Settings.terrain.height, additive = width / 20 ) {
    return new Promise( ( resolve, reject ) => {
        try {
            const canvas = buildMapCanvas( width, height, true )

            const c = canvas.getContext( '2d' )
            c.fillStyle = 'black'
            c.fillRect( 0, 0, canvas.width, canvas.height )

            for ( let i = 1; i <= canvas.width - 2; i++ ) {
                for ( let j = 1; j <= canvas.height - 2; j++ ) {
                    let v = octave( simplex, i / ( canvas.width - 2 ), j / ( canvas.height - 2 ), 16 )

                    const per = ( ( 100 + ( width == 100 ) ? 100 : 100 + additive ) * v ).toFixed( 2 ) + '%'

                    c.fillStyle = `rgb(${ per },${ per },${ per })`
                    c.fillRect( i, j, 1, 1 )
                }
            }

            resolve( {
                canvas: canvas,
                data: c.getImageData( 0, 0, canvas.width, canvas.height ),
                isHeightMap: true,
            } )
        } catch {
            reject()
        }
    } )
}

function noise ( simplex, nx, ny ) {
    return map( simplex.noise2D( nx, ny ), -1, 1, 0, 1 )
}

function octave ( simplex, nx, ny, octaves ) {
    let val = 0, freq = 1, max = 0, amp = 1

    for( let i = 0; i < octaves; i++ ) {
        val += noise( simplex, nx * freq, ny * freq ) * amp
        max += amp
        amp /= 2
        freq  *= 2
    }

    return val / max
}

function searchZValues ( geometry, face, useIndexed ) {
    const zValues = new Array()

    if ( geometry && face ) {
        if ( useIndexed ) face.vertices.indexed.forEach( v => zValues.push( geometry.vertices.indexed[ v ].indexes[ 2 ] ) )
        else face.vertices.nonIndexed.forEach( v => zValues.push( 
            geometry.attributes.position.array[ geometry.vertices.nonIndexed[ v ].indexes[ 2 ] ]
        ) )

        return zValues
    }
}

function calcMaxHeight ( geometry, face, useIndexed = false ) {
    if ( geometry && face ) {
        const zValues = searchZValues( geometry, face, useIndexed )

        return Math.max( ...zValues )
    }
}

function calcMinHeight ( geometry, face, useIndexed = false ) {
    if ( geometry && face ) {
        const zValues = searchZValues( geometry, face, useIndexed )

        return Math.min( ...zValues )
    }
}

function buildMapCanvas ( width = Settings.terrain.width, height = Settings.terrain.height ,addToDOM = true ) {
    const canvas = document.createElement( 'canvas' )

    canvas.style.display = 'none'
    canvas.setAttribute( 'width', width + 3 )
    canvas.setAttribute( 'height', height + 3 )
    
    if ( addToDOM ) document.body.appendChild( canvas )

    return canvas
}

function generateGeometry ( width = Settings.terrain.width, height = Settings.terrain.height, heightMap ) {
    return new Promise( ( resolve, reject ) => {
        try {
            if ( heightMap && heightMap.isHeightMap ) {
                const geometry = new XBase.geometry.buffer.plane( 
                    width + 2, 
                    height + 2,
                    width + 2, 
                    height + 2
                )
            
                geometry.vertices = {
                    indexed: new Array(),
                    nonIndexed: new Array(),
                    positionSortedNI: new Array(),
                    simplifiedNI: new Array(),
                }
            
                geometry.faces = new Array()
            
                let vertex = new Vertex(), vCount = 0
            
                geometry.attributes.position.array.forEach( ( v ,ix ) => {
                    vertex.indexes.push( ix )
                    vertex.position.push( v )
            
                    vCount++
            
                    if ( vCount == 3 ) {
                        geometry.vertices.indexed.push( vertex )
            
                        vCount = 0
                            
                        vertex = new Vertex()
                    }
                } )
            
                for ( let j = 0; j < heightMap.data.height; j++ ) {
                    for ( let i = 0; i < heightMap.data.width; i++ ) {
                        const nC = ( j * ( heightMap.data.height ) + i )
                        const nX = 0 + ( nC * 3 )
                        const nY = 1 + ( nC * 3 )
                        const nV = 2 + ( nC * 3 )
                        const col = heightMap.data.data[ nC * 4 ] // the red channel
            
                        const vertices = geometry.attributes.position.array
            
                        vertices[ nV ] = map( col, 0, 255, -10, 10 ) //map from 0:255 to -10:10
                        
                        if ( vertices[ nV ] < 0 ) {
                            if (
                                j == 1 ||
                                j == heightMap.data.height - 2 ||
                                i == 1 ||
                                i == heightMap.data.width - 2
                            ) vertices[ nV ] = -0.015
                        }

                        if (
                            j == 0 ||
                            j == heightMap.data.height - 1 ||
                            i == 0 ||
                            i == heightMap.data.width - 1
                        ) vertices[ nV ] = -10.1

                        if ( vertices[ nX ] == ( width + 2 ) / 2 ) vertices[ nX ] = ( ( width + 2 ) / 2 ) - 1
                        if ( vertices[ nY ] == ( height + 2 ) / 2 ) vertices[ nY ] = ( ( height + 2 ) / 2 ) - 1
                        if ( vertices[ nX ] == - ( width + 2 ) / 2 ) vertices[ nX ] = - ( ( width + 2 ) / 2 ) + 1
                        if ( vertices[ nY ] == - ( height + 2 ) / 2 ) vertices[ nY ] = - ( ( height + 2 ) / 2 ) + 1

                        if ( vertices[ nV ] > 2.5 ) vertices[ nV ] *= 1 + ( ( vertices[ nV ] - 2.5 ) * 0.125 )
                    }
                }
            
                geometry.attributes.position.needsUpdate = true
    
                resolve( geometry )
            }
        } catch {
            reject()
        }
    } )
}

function generateLiveMaterial () {
    return new Promise( ( resolve, reject ) => {
        try {
            const material = new XBase.mat.mesh.phong( Settings.terrain.materials.liveview )

            resolve( material )
        } catch {
            reject()
        }
    } )
}

function generateMapMaterial () {
    return new Promise( ( resolve, reject ) => {
        try {
            const material = new XBase.mat.shader( {
                fragmentShader: `
                    varying vec3 vUv; 
                    varying vec4 WorldPosition;

                    void main() {
                        if ( WorldPosition.y < 0.0 ) gl_FragColor = vec4( 0.16, 0.41, 0.43, 1.0 );
                        if ( WorldPosition.y <= -0.125 && WorldPosition.y > -0.135 ) gl_FragColor = vec4( 0.18, 0.46, 0.49, 1.0 );
                        if ( WorldPosition.y <= -0.25 && WorldPosition.y > -0.26 ) gl_FragColor = vec4( 0.18, 0.46, 0.49, 1.0 );
                        if ( WorldPosition.y <= -0.375 && WorldPosition.y > -0.385 ) gl_FragColor = vec4( 0.18, 0.46, 0.49, 1.0 );
                        if ( WorldPosition.y <= -0.5 && WorldPosition.y > -0.51 ) gl_FragColor = vec4( 0.18, 0.46, 0.49, 1.0 );

                        if ( WorldPosition.y >= 0.0 && WorldPosition.y < 0.75 ) gl_FragColor = vec4( 0.81, 0.72, 0.56, 1.0 );
                        if ( WorldPosition.y >= 0.25 && WorldPosition.y < 0.27 ) gl_FragColor = vec4( 0.67, 0.60, 0.47, 1.0 );
                        if ( WorldPosition.y >= 0.5 && WorldPosition.y < 0.52 ) gl_FragColor = vec4( 0.67, 0.60, 0.47, 1.0 );

                        if ( WorldPosition.y >= 0.75 && WorldPosition.y < 2.5 ) gl_FragColor = vec4( 0.67, 0.60, 0.47, 1.0 );
                        if ( WorldPosition.y >= 1.0 && WorldPosition.y < 1.02 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );
                        if ( WorldPosition.y >= 1.25 && WorldPosition.y < 1.27 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );
                        if ( WorldPosition.y >= 1.5 && WorldPosition.y < 1.52 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );
                        if ( WorldPosition.y >= 1.75 && WorldPosition.y < 1.77 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );
                        if ( WorldPosition.y >= 2.0 && WorldPosition.y < 2.02 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );
                        if ( WorldPosition.y >= 2.25 && WorldPosition.y < 2.27 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );

                        if ( WorldPosition.y >= 2.5 && WorldPosition.y < 6.0 ) gl_FragColor = vec4( 0.54, 0.48, 0.38, 1.0 );
                        if ( WorldPosition.y >= 2.75 && WorldPosition.y < 2.77 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 3.0 && WorldPosition.y < 3.02 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 3.25 && WorldPosition.y < 3.27 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 3.5 && WorldPosition.y < 3.52 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 3.75 && WorldPosition.y < 3.77 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 4.0 && WorldPosition.y < 4.02 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 4.25 && WorldPosition.y < 4.27 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 4.5 && WorldPosition.y < 4.52 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 4.75 && WorldPosition.y < 4.77 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 5.0 && WorldPosition.y < 5.02 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 5.25 && WorldPosition.y < 5.27 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 5.5 && WorldPosition.y < 5.52 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 5.75 && WorldPosition.y < 5.77 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );

                        if ( WorldPosition.y >= 6.0 && WorldPosition.y < 7.0 ) gl_FragColor = vec4( 0.4, 0.36, 0.28, 1.0 );
                        if ( WorldPosition.y >= 6.25 && WorldPosition.y < 6.27 ) gl_FragColor = vec4( 0.26, 0.23, 0.18, 1.0 );
                        if ( WorldPosition.y >= 6.5 && WorldPosition.y < 6.52 ) gl_FragColor = vec4( 0.26, 0.23, 0.18, 1.0 );
                        if ( WorldPosition.y >= 6.75 && WorldPosition.y < 6.77 ) gl_FragColor = vec4( 0.26, 0.23, 0.18, 1.0 );

                        if ( WorldPosition.y >= 7.0 ) gl_FragColor = vec4( 1.0 );
                    }
                `,
                vertexShader: `
                    varying vec3 vUv; 
                    varying vec4 WorldPosition;

                    void main() {
                        vUv = position; 

                        WorldPosition = modelMatrix * vec4(position, 1.0);
            
                        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * modelViewPosition; 
                    }
                `,
            } )

            resolve( material )
        } catch {
            reject()
        }
    } )
}

function generateFaces ( geometry ) {
    return new Promise( ( resolve, reject ) => {
        try {
            if ( geometry ) {
                let vertex = new Vertex(), vertexCount = 0

                let face = new Face(),
                indexedCount = 0,
                nonIndexedCount = 0,
                faceCount = 0

                geometry.index.array.forEach( v => {
                    face.vertices.indexed.push( v )

                    indexedCount++

                    if ( indexedCount == 3 ) {
                        geometry.faces.push( face )

                        indexedCount = 0
                
                        face = new Face()
                    }
                } )

                const IndexedGeo = {
                    faces: geometry.faces,
                    geometry: geometry.toNonIndexed(),
                    vertices: geometry.vertices,
                }

                geometry = IndexedGeo.geometry
                geometry.faces = IndexedGeo.faces
                geometry.vertices = IndexedGeo.vertices

                geometry.attributes.position.array.forEach( ( v, index ) => {
                    vertex.indexes.push( index )
                    vertex.position.push( v )

                    vertexCount++

                    if ( vertexCount == 3 ) {
                        geometry.vertices.nonIndexed.push( vertex )

                        vertexCount = 0
                
                        vertex = new Vertex()
                    }
                } )

                geometry.vertices.nonIndexed.forEach( ( v, index ) => {
                    geometry.faces[ faceCount ].vertices.nonIndexed.push( index )

                    nonIndexedCount++

                    if ( nonIndexedCount == 3 ) {
                        nonIndexedCount = 0

                        faceCount++
                    }
                } )

                resolve( geometry )
            } else reject()
        } catch {
            reject()
        }
    } )
}

async function generateSimpleTerrain ( object3D, width = Settings.terrain.width, height = Settings.terrain.height ) {
    const simplex = new SimplexNoise()

    const Maps = {
        height: await generateHeightMap( simplex, width, height ),
    }
    
    const Terrain = {
        geometry: await generateGeometry( width, height, Maps.height ),

        materials: {
            live: await generateLiveMaterial(),
            map: await generateMapMaterial(),
        },
    }

    Terrain.geometry = await generateFaces( Terrain.geometry )

    /* color faces */ 

    Terrain.geometry.setAttribute( 'color', new XBase.attribute.buffer( 
        new Float32Array( Terrain.geometry.vertices.nonIndexed.length * 3 ), 
        3 
    ) )

    const color = new XBase.color(),
        colorXYZ = Terrain.geometry.attributes.color

    Terrain.geometry.faces.forEach( ( f, ix ) => {
        const min = calcMinHeight( Terrain.geometry, f )
        const max = calcMaxHeight( Terrain.geometry, f )
        
        if ( min < 3 ) {
            if ( max - min >= 1 ) {
                f.isCliff = true
    
                f.terrainColor = 0x4a4924
            } else {
                f.terrainColor = getRandomTerrainColor()
            }
        } else {
            if ( max - min >= 0.4 ) {
                f.isCliff = true
    
                f.terrainColor = 0x4a4924
            } else {
                f.terrainColor = getRandomTerrainColor()
            }
        }
        
        if ( min > 6 ) f.terrainColor = 0x4a4924
        if ( min > 7 ) f.terrainColor = 0xffffff
        if ( max < 0.75 ) f.terrainColor = 0xFFEA91
        if ( min < -10 ) f.terrainColor = 0x4a4924

        color.setHex( f.terrainColor )
        
        f.vertices.nonIndexed.forEach( v => colorXYZ.setXYZ( v, color.r, color.g, color.b ) )
    } )

    colorXYZ.needsUpdate = true

    /* create mesh */ 

    const mesh = new XBase.mesh.default( Terrain.geometry, Terrain.materials.live )
    mesh.rotateX( -1.57 )
    // mesh.castShadow = true
    // mesh.receiveShadow = true
    
    if ( object3D && object3D.isObject3D ) object3D.add( mesh )

    return {
        mesh: mesh,
        materials: Terrain.materials,

    }
}

export { generateSimpleTerrain }