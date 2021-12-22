import * as Factions from '../factions.js'

/**
 * 
 * @param { Number } id The ID of the faction you're verifying.
 */ 
function verifyFaction ( id ) {
    return new Promise( resolve => {
        let found = false

        for ( let i = 0; i < Factions.data.list.length; i++ ) {
            if ( Factions.data.list[ i ].id == id ) {
                found = true

                break
            }
        }

        resolve( found )
    } )
}

export { verifyFaction }