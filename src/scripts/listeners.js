import * as InterfaceTools from './tools/interface.js'

const keyboard = {
    down: {
        code: null,
    },
    up: {
        code: null,
    },
}

async function init () {
    document.onkeydown = function ( e ) {
        keyboard.down.code = e.code
    }
    
    document.onkeyup = function ( e ) {
        keyboard.up.code = e.code
    
        switch ( e.code ) {
            case 'F2':
                if ( InterfaceTools.ui.dev.open ) {
                    InterfaceTools.setAnimation( InterfaceTools.getUI( 'dev' ), 'ui-dev-slide-out 0.15s forwards' )
    
                    InterfaceTools.ui.dev.open = false
                } else {
                    InterfaceTools.setAnimation( InterfaceTools.getUI( 'dev' ), 'ui-dev-slide-in 0.15s forwards' )
    
                    InterfaceTools.ui.dev.open = true
                }
        }
    }
}

export { init, keyboard }