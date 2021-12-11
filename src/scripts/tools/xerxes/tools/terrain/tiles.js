class Tile {
    constructor ( a, b, vNI, vMax, vMin ) {
        this.a = a
        this.b = b
        
        this.vertices = {
            max: vMax,
            min: vMin,
            nonIndexed: vNI,
        }
    }
}