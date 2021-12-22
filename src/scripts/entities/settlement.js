import Xerxes from '../tools/xerxes/xerxes.js'

const data = {
    list: new Array(),
    map: new Array(),
}

class Settlement {
    constructor ( tileIndex, factionId, name ) {
        this.id = Xerxes.util.math.randomId()
        this.name = name
        this.owner = factionId
        this.tileIndex = tileIndex

        this.model = new Xerxes.mesh.default(
            new Xerxes.geometry.buffer.box( 0.8, 2, 0.8 ),
            new Xerxes.mat.mesh.phong( {
                color: 0xffffff,
                flatShading: true,
                shininess: 0,
            } )
        )
    }

    generateLabel () {
        return new Promise( resolve => {


            resolve()
        } )
    }

    addToDataMap () {
        return new Promise( resolve => {
            data.map[ this.tileIndex ] = this.id

            resolve()
        } )
    }
}

export { 
    data, 
    Settlement, 
    Settlement as class 
}