import Rejections from '../base/rejections.js'

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

export {
    stylizeBody,
}