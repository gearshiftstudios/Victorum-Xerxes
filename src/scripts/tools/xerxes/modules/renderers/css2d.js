import { Matrix4, Vector3 } from '../../base/base.js'

const _vector = new Vector3(),
    _viewMatrix = new Matrix4(),
    _viewProjectionMatrix = new Matrix4(),
    _a = new Vector3(),
    _b = new Vector3()

class CSS2DRenderer {
	constructor ( parameters = {} ) {
		const _this = this

		let _width, _height
		let _widthHalf, _heightHalf

		const cache = {
			objects: new WeakMap(),
		}

		const domElement = parameters.element !== undefined ? parameters.element : document.createElement( 'div' )
		domElement.style.overflow = 'hidden'

		this.domElement = domElement

		this.getSize = function () {
			return {
				width: _width,
				height: _height,
			}
		}

		this.render = function ( scene, camera ) {
			if ( scene.autoUpdate === true ) scene.updateMatrixWorld()
			if ( camera.parent === null ) camera.updateMatrixWorld()

			_viewMatrix.copy( camera.matrixWorldInverse )
			_viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix )

			renderObject( scene, scene, camera )
			zOrder( scene )
		}

		this.setSize = function ( width, height ) {
			_width = width
			_height = height

			_widthHalf = _width / 2
			_heightHalf = _height / 2

			domElement.style.width = `${ width }px`
			domElement.style.height = `${ height }px`

		}

		function renderObject( object, scene, camera ) {
			if ( object.isCSS2DObject ) {
				object.onBeforeRender( _this, scene, camera )

				_vector.setFromMatrixPosition( object.matrixWorld )
				_vector.applyMatrix4( _viewProjectionMatrix )

				const element = object.element

				if ( /apple/i.test( navigator.vendor ) ) element.style.transform = `translate(-50%,-50%) translate( ${ Math.round( _vector.x * _widthHalf + _widthHalf ) }px, ${ Math.round( - _vector.y * _heightHalf + _heightHalf ) }px )`
				else element.style.transform = `translate(-50%,-50%) translate( ${ ( _vector.x * _widthHalf + _widthHalf ) }px, ${ ( - _vector.y * _heightHalf + _heightHalf ) }px )`

				element.style.display = ( object.visible && _vector.z >= - 1 && _vector.z <= 1 ) ? '' : 'none'

				const objectData = {
					distanceToCameraSquared: getDistanceToSquared( camera, object ),
				}

				cache.objects.set( object, objectData )

				if ( element.parentNode !== domElement ) domElement.appendChild( element )

				object.onAfterRender( _this, scene, camera )
			}

			for ( let i = 0, l = object.children.length; i < l; i ++ ) {
				renderObject( object.children[ i ], scene, camera )
			}
		}

		function getDistanceToSquared( object1, object2 ) {
			_a.setFromMatrixPosition( object1.matrixWorld )
			_b.setFromMatrixPosition( object2.matrixWorld )

			return _a.distanceToSquared( _b )
		}

		function filterAndFlatten( scene ) {
			const result = new Array()

			scene.traverse( function ( object ) {
				if ( object.isCSS2DObject ) result.push( object )
			} )

			return result
		}

		function zOrder( scene ) {
			const sorted = filterAndFlatten( scene ).sort( function ( a, b ) {
				const distanceA = cache.objects.get( a ).distanceToCameraSquared
				const distanceB = cache.objects.get( b ).distanceToCameraSquared

				return distanceA - distanceB
			} )

			const zMax = sorted.length

			for ( let i = 0, l = sorted.length; i < l; i ++ ) {
				sorted[ i ].element.style.zIndex = zMax - i
			}
		}
	}
}

export default CSS2DRenderer
