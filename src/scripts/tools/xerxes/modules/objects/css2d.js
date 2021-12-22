import { Object3D } from '../../base/base.js'

class CSS2DObject extends Object3D {
	constructor ( element = document.createElement( 'div' ) ) {
		super()

		this.element = element
		this.element.style.position = 'absolute'
		this.element.style.userSelect = 'none'
		this.element.setAttribute( 'draggable', false );

		this.addEventListener( 'removed', function () {
			this.traverse( function ( object ) {
				if ( object.element instanceof Element && object.element.parentNode !== null ) {
					object.element.parentNode.removeChild( object.element )
				}
			} )
		} )
	}

	copy ( source, recursive ) {
		super.copy( source, recursive )

		this.element = source.element.cloneNode( true )

		return this
	}
}

CSS2DObject.prototype.isCSS2DObject = true

export default CSS2DObject