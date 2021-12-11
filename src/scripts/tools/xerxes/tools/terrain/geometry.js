class Face {
    constructor () {
        this.vertices = { indexed: new Array(), nonIndexed: new Array() }
        this.terrainType = null
        this.terrainColor = null
        this.tile = 0
    }
}

class Vertex {
    constructor () {
        this.indexes = new Array()
        this.position = new Array()
        this.surface = false
    }
}

function searchZValues ( chunk, face ) {
    const zValues = new Array()

    face.vertices.nonIndexed.forEach( v => zValues.push( 
        chunk.mesh.geometry.attributes.position.array[ chunk.vertices.nonIndexed[ v ].indexes[ 2 ] ]
    ) )

    return zValues
}

function calcMaxHeight ( chunk, face ) {
    const zValues = searchZValues( chunk, face )

    return Math.max( ...zValues )
}

function calcMinHeight ( chunk, face ) {
    const zValues = searchZValues( chunk, face )

    return Math.min( ...zValues )
}

export { 
    calcMaxHeight, 
    calcMinHeight, 
    Face, 
    searchZValues, 
    Vertex 
}