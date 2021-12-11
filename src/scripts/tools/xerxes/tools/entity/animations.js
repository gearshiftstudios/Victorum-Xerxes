class AnimationList {
    constructor ( list ) {
        if ( Array.isArray( list ) ) {
            list.forEach( ( l, ix ) => {
                this[ l.name ] = ix
            } )
        }
    }
}

export { AnimationList }