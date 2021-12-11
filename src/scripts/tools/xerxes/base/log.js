import * as XSettings from './settings.js'

class Logger {
    constructor ( name = 'App', version = '1.0', stage = 'current' ) {
        this.name = name
        this.stage = stage
        this.version = version

        document.body.querySelector( 'terminal' )
            .querySelector( 'form' ).onsubmit = function ( e ) {
                e.preventDefault()

                const value = this.querySelector( 'input' ).value

                if (
                    value.charAt( 0 ) == '/' &&
                    value.charAt( 1 ) == 'j' &&
                    value.charAt( 2 ) == 's' &&
                    value.charAt( 3 ) == ' ' 
                ) {
                    eval( value.split( '/js ' )[ 1 ] )

                    write( 'Input JavaScript code was run.' )
                }

                this.querySelector( 'input' ).value = ''
            }
        
        write( 'Separate Logger has been built.' )
    }

    output ( type, message = 'Message logged' ) {
        return new Promise( ( resolve, reject ) => {
            try {
                console[ type ]( 
                    `%c ${ this.name } %c ${ this.version + this.stage.charAt( 0 ).toLowerCase() } %c ${ message }`,
                    'background: white; color: black; text-shadow: black 0 0 5px;',
                    'background: black; color: goldenrod;',
                    'background: transparent; color: white;'
                )

                switch ( type ) {
                    case 'error':
                        message = `<div style='display: inline; background: rgb( 128, 0, 0 ); color: red;'>&nbsp;&#9888; ${ message }</div>`
                        break
                    case 'log':
                        message = `&nbsp;${ message }`
                        break
                    case 'warn':
                        message = `<div style='display: inline; background: rgb( 107, 95, 0 ); color: goldenrod;'>&nbsp;&#9873; ${ message }</div>`
                        break
                }

                const line = document.createElement( 'line' )
                line.style.display = 'block'
                line.style.padding = '1px 0px 1px 0px'
                line.innerHTML = `
                    <div style='display: inline; background: white; color: black;'>&nbsp;${ this.name }&nbsp;</div>
                    <div style='display: inline; background: black; color: goldenrod;'>&nbsp;${ this.version + this.stage.charAt( 0 ).toLowerCase() }&nbsp;</div>
                    ${ message }`

                document.body.querySelector( 'terminal' ).querySelector( 'dialogue' ).appendChild( line )
    
                resolve()
            } catch {
                reject()
            }
        } )
    }
    
    error ( message = 'Error logged' ) {
        return new Promise( ( resolve, reject ) => {
            try {
                this.output( 'error', message )
    
                resolve()
            } catch {
                reject()
            }
        } )
    }
    
    warn ( message = 'Warning logged' ) {
        return new Promise( ( resolve, reject ) => {
            try {
                this.output( 'warn', message )
    
                resolve()
            } catch {
                reject()
            }
        } )
    }
    
    write ( message = 'Message logged' ) {
        return new Promise( ( resolve, reject ) => {
            try {
                this.output( 'log', message )
    
                resolve()
            } catch {
                reject()
            }
        } )
    }
}

function output ( type, message = 'Message logged' ) {
    return new Promise( ( resolve, reject ) => {
        try {
            console[ type ]( 
                `%c ${ XSettings.name } %c ${ XSettings.version + XSettings.stage.charAt( 0 ).toLowerCase() } %c ${ message }`,
                'background: turquoise; color: white; text-shadow: black 0 0 5px;',
                'background: goldenrod; color: black;',
                'background: transparent; color: white;'
            )

            switch ( type ) {
                case 'error':
                    message = `<div style='display: inline; background: rgb( 128, 0, 0 ); color: red;'>&nbsp;&#9888; ${ message }</div>`
                    break
                case 'log':
                    message = `&nbsp;${ message }`
                    break
                case 'warn':
                    message = `<div style='display: inline; background: rgb( 107, 95, 0 ); color: goldenrod;'>&nbsp;&#9873; ${ message }</div>`
                    break
            }

            const line = document.createElement( 'line' )
                line.style.display = 'block'
                line.style.padding = '1px 0px 1px 0px'
                line.innerHTML = `
                    <div style='display: inline; background: turquoise; color: white;'>&nbsp;${ XSettings.name }&nbsp;</div>
                    <div style='display: inline; background: goldenrod; color: black;'>&nbsp;${ XSettings.version + XSettings.stage.charAt( 0 ).toLowerCase() }&nbsp;</div>
                    ${ message }`

                document.body.querySelector( 'terminal' ).querySelector( 'dialogue' ).appendChild( line )

            resolve()
        } catch {
            reject()
        }
    } )
}

function error ( message = 'Error logged' ) {
    return new Promise( ( resolve, reject ) => {
        try {
            output( 'error', message )

            resolve()
        } catch {
            reject()
        }
    } )
}

function warn ( message = 'Warning logged' ) {
    return new Promise( ( resolve, reject ) => {
        try {
            output( 'warn', message )

            resolve()
        } catch {
            reject()
        }
    } )
}

function write ( message = 'Message logged' ) {
    return new Promise( ( resolve, reject ) => {
        try {
            output( 'log', message )

            resolve()
        } catch {
            reject()
        }
    } )
}

export { error, Logger, Logger as logger, output, warn, write }