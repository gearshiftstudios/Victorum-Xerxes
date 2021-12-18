import VLog from '../log.js'

const ui = {
    dev: {
        open: true,
    },
}

function getUI ( id ) {
    if ( id ) {
        const elements = document.body.querySelectorAll( 'ui' )

        let found = null 

        for ( let i = 0; i < elements.length; i++ ) {
            if ( elements[ i ].id == id ) {
                found = elements[ i ]

                break
            }
        }

        if ( found != null ) return found
        else return
    } else return
}

function hide ( element ) {
    return new Promise( resolve => {
        if ( element ) {
            element.style.display = 'none'

            resolve()
        } else VLog.resolve( resolve ).error( `Couldn't hide element. Either the element does not exist or the syntax was incorrect.` )
    } )
}

function setAnimation ( element, animation ) {
    return new Promise( resolve => {
        if ( element ) {
            element.style.animation = animation

            resolve()
        } else VLog.resolve( resolve ).error( `Couldn't hide element. Either the element does not exist or the syntax was incorrect.` )
    } )
}

function show ( element ) {
    return new Promise( resolve => {
        if ( element ) {
            element.style.display = 'inline-block'

            resolve()
        } else VLog.resolve( resolve ).error( `Couldn't show element. Either the element does not exist or the syntax was incorrect.` )
    } )
}

export { getUI, hide, setAnimation, show, ui }