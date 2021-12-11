import * as XLog from './log.js'

function init () {
    return new Promise( ( resolve, reject ) => {
        try {
            Element.prototype.getId = function () {
                return this.id
            }

            XLog.write( 'Engine JS and DOM core syntax and methods have been initialized.' )

            resolve()
        } catch {
            reject()
        }
    } )
}

export { init }