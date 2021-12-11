function getRandom ( array ) {
    if ( array && Array.isArray( array ) ) {
        return array[ Math.floor( Math.random() * array.length ) ]
    }
}

export { getRandom }