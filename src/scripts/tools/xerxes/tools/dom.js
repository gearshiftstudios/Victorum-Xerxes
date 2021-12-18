import * as XLog from '../base/log.js'

function stylizeBody () {
    return new Promise( ( resolve, reject ) => {
        try {
            document.body.style.background = 'background: linear-gradient(to bottom, #154277 0%,#576e71 30%,#e1c45e 70%,#b26339 100%);'
            document.body.style.width = '100vw'
            document.body.style.height = '100vh'
            document.body.style.margin = '0'
            document.body.style.overflow = 'hidden'
            document.body.style.padding = '0'

            resolve()
        } catch {
            reject( Rejections.dom.body.stylize )
        }
    } )
}

/**
 * 
 * @param { Element } element 
 * @param { string } filter 
 * @param { * } value 
 * @returns 
 */

function setFilter ( element, filter, value ) {
    return new Promise( resolve => {
        if ( element ) {
            if ( filter && value ) {
                element.style.filter = `${ filter }( ${ value } )`

                resolve()
            } else XLog.resolve( resolve ).error( 'You must pass a filter and value' )
        } else XLog.resolve( resolve ).error( `You must pass an element. If you did then this element doesn't exist within the DOM at the time this was called.` )
    } )
}

export {
    setFilter,
    stylizeBody,
}