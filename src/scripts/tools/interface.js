import VLog from '../log.js'

const ui = {
    created: {
        attr: 0,
        ui: 0,
    },
    dev: {
        open: false,
    },
}

/**
 * 
 * @param { Element } element Element in which this attribute will access
 * @param { String } name The name of the attribute
 */ 
function attr ( element = document.body, name = String( ui.created.attr ) ) {
    return {
        add: () => { return new Promise( resolve => {
            element.setAttribute( name, '' )

            resolve()
        } ) },
        get: () => { return new Promise( resolve => {
            element.getAttribute( name )

            resolve()
        } ) },

        /**
         * 
         * @param { String } value 
         */
        set: ( value = '' ) => { return new Promise( resolve => {
            element.setAttribute( name, value )

            resolve()
        } ) }
    }
}

/**
 * 
 * @param { Element } parent The element that it will be appended to.
 * @param { String } id The ID of it for organization.
 * @param { String } position Where to lock it. Options are 'lt', 'rt', 'lb', 'rb'.
 */

function createUISection ( parent = document.body, id = String( ui.created.ui ) , position = 'lt', width = 0, content = `` ) {
    return new Promise( resolve => {
        ui.created.ui++

        const section = document.createElement( 'section' )
        section.id = id
        section.innerHTML += content
        section.style.width = `${ width }px`
        attr( position ).add()

        parent.appendChild( section )

        resolve()
    } )
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

export { attr, createUISection, getUI, hide, setAnimation, show, ui }