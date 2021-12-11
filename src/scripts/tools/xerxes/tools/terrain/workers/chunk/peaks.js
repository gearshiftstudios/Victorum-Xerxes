onmessage = e => {
    const classes = {
        vertex: class {
            constructor () {
                this.indexes = new Array()
                this.position = new Array()
                this.surface = false
            }
        }
    }
    
    const methods = {
        scaleOut: ( val, smin, smax, emin, emax ) => {
            const tx = ( val - smin ) / ( smax - smin )
    
            return ( emax - emin ) * tx + emin
        }
    }

    const temp = {
        chunkGeo: e.data[ 1 ],
        chunkSize: e.data[ 2 ],
        elevMax: e.data[ 4 ],
        elevMin: e.data[ 3 ],
        heightMaps: e.data[ 0 ],
    }

    const vertices = new Array()

    for ( let i = 0; i < temp.chunkGeo.length; i++ ) {
        const chunkVertices = {
            indexed: new Array(),
            nonIndexed: new Array(),
            positionSortedNI: new Array(),
            simplifiedNI: new Array(),
        }

        let vertex = new classes.vertex(), count = 0

        temp.chunkGeo[ i ].forEach( ( v ,ix ) => {
            vertex.indexes.push( ix )
            vertex.position.push( v )

            count++

            if ( count == 3 ) {
                chunkVertices.indexed.push( vertex )

                count = 0
                    
                vertex = new classes.vertex()
            }
        } )

        for ( let hpx = 0; hpx < temp.heightMaps[ i ].height; hpx++ ) {
            for ( let wpx = 0; wpx < temp.heightMaps[ i ].width; wpx++ ) {
                const n = ( hpx * ( temp.heightMaps[ i ].height ) + wpx ),
                col = temp.heightMaps[ i ].data[ n * 4 ], // the red channel
    
                vertex = chunkVertices.indexed[ n ],
                x = vertex.indexes[ 0 ],
                y = vertex.indexes[ 1 ],
                z = vertex.indexes[ 2 ]
    
                vertex.surface = true
    
                temp.chunkGeo[ i ][ z ] = methods.scaleOut( col, 0, 255, temp.elevMin, temp.elevMax )

                let mMax = 4

                if ( temp.chunkGeo[ i ][ z ] > mMax ) temp.chunkGeo[ i ][ z ] *= 1 + ( ( temp.chunkGeo[ i ][ z ] - mMax ) * 0.125 )
    
                if (
                    hpx == 0 ||
                    hpx == temp.heightMaps[ i ].height - 1 ||
                    wpx == 0 ||
                    wpx == temp.heightMaps[ i ].width - 1
                ) {
                    vertex.surface = false

                    temp.chunkGeo[ i ][ z ] = -10

                    const trueChunkSize = temp.chunkSize + 2

                    if ( temp.chunkGeo[ i ][ x ] == trueChunkSize / 2 ) temp.chunkGeo[ i ][ x ] = ( trueChunkSize / 2 ) - 1
                    if ( temp.chunkGeo[ i ][ y ] == trueChunkSize / 2 ) temp.chunkGeo[ i ][ y ] = ( trueChunkSize / 2 ) - 1
                    if ( temp.chunkGeo[ i ][ x ] == - ( trueChunkSize / 2 ) ) temp.chunkGeo[ i ][ x ] = - ( trueChunkSize / 2 ) + 1
                    if ( temp.chunkGeo[ i ][ y ] == - ( trueChunkSize / 2 ) ) temp.chunkGeo[ i ][ y ] =  - ( trueChunkSize / 2 ) + 1
                }
    
                if ( temp.chunkGeo[ i ][ z ] > temp.elevMin ) {
                    if ( hpx != 0 &&
                        hpx != temp.heightMaps[ i ].height - 1 &&
                        wpx != 0 &&
                        wpx != temp.heightMaps[ i ].width - 1 &&
                        hpx != 1 &&
                        hpx != temp.heightMaps[ i ].height - 2 &&
                        wpx != 1 &&
                        wpx != temp.heightMaps[ i ].width - 2     
                    ) {
                        // temp.chunkGeo[ i ][ x ] += methods.scaleOut( Math.random(), 0, 1, -0.25, 0.25 ) //jitter x
                        // temp.chunkGeo[ i ][ y ] += methods.scaleOut( Math.random(), 0, 1, -0.25, 0.25 ) //jitter y
                    }
                } else {
                    if ( temp.chunkGeo[ i ][ z ] == temp.elevMin ) {
                        temp.chunkGeo[ i ][ z ] = -0.3
                    }
                }
    
                vertex.position[ 0 ] = temp.chunkGeo[ i ][ x ]
                vertex.position[ 1 ] = temp.chunkGeo[ i ][ y ]
                vertex.position[ 2 ] = temp.chunkGeo[ i ][ z ]
            }
        }

        vertices.push( chunkVertices )
    }

    postMessage( [ temp.chunkGeo, vertices ] )
}