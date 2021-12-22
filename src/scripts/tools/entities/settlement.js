import * as Settlements from '../../entities/settlement.js'
import * as FactionTools from '../factions.js'
import VLog from '../../log.js'

/**
 * 
 * @param { Number } tilesWide The amount of tiles the map is horizontally.
 * @param { Number } tilesHigh The amount of tiles the map is vertically.
 */ 
function generateMap ( tilesWide, tilesHigh ) {
    return new Promise( resolve => {
        Settlements.data.map = new Array()

        for ( let i = 0; i < tilesWide * tilesHigh; i++ ) Settlements.data.map.push( 0 )

        resolve()
    } )
}

/**
 * 
 * @param { Object } tile The tile-data of the tile you wish to place this settlement on.
 * @param { String } factionId The ID of the faction who will own this settlement.
 * @param { String } name The name of this settlement.
 */
function generateSettlement ( tile, factionId, name ) {
    return new Promise( resolve => {
        verifyTile( tile ).then( emptyTile => {
            if ( emptyTile ) FactionTools.verifyFaction( factionId ).then( inGameFaction => {
                if ( inGameFaction ) checkExistanceByName( factionId, name ).then( settlementExists => {
                    if ( !settlementExists ) {
                        Settlements.data.list.push( new Settlements.class( tile.mapIndex, factionId, name ) )
                        
                        Settlements.data.list[ Settlements.data.list.length - 1 ].addToDataMap().then( () => {
                            resolve()
                        } )
                    } else VLog.resolve( resolve ).error( `Settlement with this name already exists within this faction.` )
                } )

                else VLog.resolve( resolve ).error( `Faction does not exist.` )
            } )
                
            else VLog.resolve( resolve ).error( `Can't place this settlement here. There is already something placed on this tile.` )
        } )
    } )
}

/**
 * 
 * @param { Object } tile The tile-data of the tile you wish to place the city on.
 */
function verifyTile ( tile ) {
    return new Promise( resolve => {
        if ( tile.isTile ) {
            if ( Settlements.data.map[ tile.mapIndex ] == 0 ) resolve( true )
            else resolve( false )
        } else {
            VLog.error( `Data given doesn't match the Tile class.` )

            resolve( false )
        }
    } )
}

/**
 * @param { String } factionId The ID of the faction who will owns the settlement.
 * @param { String } name The name of the settlement to check for.
 */ 
function checkExistanceByName ( factionId, name ) {
    return new Promise( resolve => {
        let results = 0

        for ( let i = 0; i < Settlements.data.list.length; i++ ) {
            if ( 
                Settlements.data.list[ i ].owner == factionId &&
                Settlements.data.list[ i ].name == name 
            ) {
                results++

                break
            }
        }

        if ( results > 0 ) resolve( true )
        else resolve( false )
    } )
}

export { 
    generateMap, 
    generateSettlement, 
    generateSettlement as generate,
    checkExistanceByName,
    verifyTile 
}