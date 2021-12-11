import * as XBase from '../../base/base.js'

const EditorControls = function ( object, domElement, orientRing ) {
    if ( domElement === undefined ) console.warn( 'M3D Movement Controls: The second parameter "domElement" is now mandatory.' )
    if ( domElement === document ) console.error( 'M3D Movement Controls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' )

    // if ( !document.body.querySelector( 'cursor-pan' ) ) {
    //     const element = document.createElement( `cursor-pan` )
        
    //     element.setAttribute( 'style', `
    //         position: absolute;
    //         left: 0;
    //         top: 0;

    //         width: 64px;
    //         height: 32px;

    //         animation: opacity-cursor 1s ease forwards;
    //         background-image: url( '../../assets/cursors/metal/arrow.pan.long.32.png' );
    //         background-position: center;
    //         background-repeat: no-repeat;
    //         background-size: contain;
    //         display: none;
    //         transform: translate( -32px, -16px );

    //         cursor: none;

    //         pointer-events: none;

    //         z-index: 99999;
    //     ` )

    //     document.body.appendChild( element )
    // }

    // if ( !document.body.querySelector( 'cursor-pan-center' ) ) {
    //     const element = document.createElement( `cursor-pan-center` )
        
    //     element.setAttribute( 'style', `
    //         position: absolute;
    //         left: 50vw;
    //         top: 50vh;

    //         width: 32px;
    //         height: 32px;

    //         animation: opacity-cursor 1s ease forwards;
    //         background-image: url( '../../assets/cursors/metal/pan.ring.32.png' );
    //         background-position: center;
    //         background-repeat: no-repeat;
    //         background-size: contain;
    //         display: none;
    //         transform: translate( -16px, -16px );

    //         cursor: none;

    //         pointer-events: none;
        
    //         z-index: 1000000;
    //     ` )

    //     document.body.appendChild( element )
    // }

    /* local variables */ 
    let zoomEnd = 0

    this.domElement = domElement
    this.object = object
    this.orientRing = orientRing ? orientRing : false

    /* mouse detection stuff */ 
    this.mouseInDOM = false

    this.mouse = {
        inScreenPanZone: false,
        screen: new XBase.vec2(),
        world: new XBase.vec2(),

        angle: {
            toCenter: 0,
        },

        distance: {
            fromCenter: 0,
        },
    }

    this.domElement.onpointerenter = () => this.mouseInDOM = true
    this.domElement.onpointerleave = () => this.mouseInDOM = false

    /* smooth zoom variables */ 
    this.smoothZoom = true
	this.zoomStart = 0

    /* Set to false to disable this control */
    this.enabled = true

    /* "target" sets the location of focus, where the object 
       orbits around */
    this.target = new XBase.vec3()

    /* How far you can dolly in and out ( PerspectiveCamera only ) */
    this.minDistance = 0
    this.maxDistance = Infinity

    /* How far you can zoom in and out ( OrthographicCamera only ) */
    this.minZoom = 0
    this.maxZoom = Infinity

    /* How far you can orbit vertically, upper and lower limits.
       Range is 0 to Math.PI radians. */
    this.minPolarAngle = 0 // radians
    this.maxPolarAngle = Math.PI // radians

    /* How far you can orbit horizontally, upper and lower limits.
       If set, the interval [ min, max ] must be a sub-interval 
       of [ - 2 PI, 2 PI ], with ( max - min < 2 PI ) */
    this.minAzimuthAngle = - Infinity // radians
    this.maxAzimuthAngle = Infinity // radians

    /* Set to true to enable damping (inertia)
       If damping is enabled, you must call controls.update() in 
       your animation loop */
    this.enableDamping = false
    this.dampingFactor = 0.05

    /* This option actually enables dollying in and out; left as 
       "zoom" for backwards compatibility.
       Set to false to disable zooming */
    this.enableZoom = true
    this.zoomSpeed = 1.0

    /* Set to false to disable rotating */
    this.enableRotate = true
    this.rotateSpeed = 1.0

    /* Set to false to disable panning */
    this.enablePan = true
    this.anglePanSpeed = 0.0005
    this.panSpeed = 1.0
    this.screenSpacePanning = true // if false, pan orthogonal to world-space direction camera.up
    this.keyPanSpeed = 7.0	// pixels moved per arrow key push

    /* Set to true to automatically rotate around the target
       If auto-rotate is enabled, you must call controls.update() in 
       your animation loop */
    this.autoRotate = false
    this.autoRotateSpeed = 2.0 // 30 seconds per round when fps is 60

    /* Set to false to disable use of the keys */
    this.enableKeys = true

    /* The four arrow keys */
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 }

    /* Mouse buttons */
    this.mouseButtons = { LEFT: XBase.mouse.ROTATE, MIDDLE: XBase.mouse.DOLLY, RIGHT: XBase.mouse.PAN }

    /* Touch fingers */
    this.touches = { ONE: XBase.touch.ROTATE, TWO: XBase.touch.DOLLY_PAN }

    /* for reset */
    this.target0 = this.target.clone()
    this.position0 = this.object.position.clone()
    this.zoom0 = this.object.zoom

    /* public methods */
    this.getAzimuthalAngle = function () {
        return spherical.theta
    }

    this.getPolarAngle = function () {
        return spherical.phi
    }

    this.reset = function () {
        scope.target.copy( scope.target0 )
        scope.object.position.copy( scope.position0 )
        scope.object.zoom = scope.zoom0

        scope.object.updateProjectionMatrix()
        scope.dispatchEvent( changeEvent )

        scope.update()

        state = STATE.NONE
    }

    this.saveState = function () {
        scope.target0.copy( scope.target )
        scope.position0.copy( scope.object.position )
        scope.zoom0 = scope.object.zoom
    }

    this.smoothZoomUpdate = function () {
		let factor = 1.0 + ( zoomEnd - this.zoomStart ) * this.zoomSpeed

		scale *= factor

		this.zoomStart += ( zoomEnd - this.zoomStart ) * this.dampingFactor
	}

    /* this should go in the animation loop */ 
    this.update = function () {
        var offset = new XBase.vec3(),

        // so camera.up is the orbit axis
        quat = new XBase.quaternion().setFromUnitVectors( object.up, new XBase.vec3( 0, 1, 0 ) ),
        quatInverse = quat.clone().invert(),

        lastPosition = new XBase.vec3(),
        lastQuaternion = new XBase.quaternion(),

        twoPI = 2 * Math.PI

        return function update () {
            var position = scope.object.position

            offset.copy( position ).sub( scope.target )

            // rotate offset to "y-axis-is-up" space
            offset.applyQuaternion( quat )

            // angle from z-axis around y-axis
            spherical.setFromVector3( offset )

            if ( scope.autoRotate && state === STATE.NONE ) rotateLeft( getAutoRotationAngle() )

            if ( scope.enableDamping ) {
                spherical.theta += sphericalDelta.theta * scope.dampingFactor
                spherical.phi += sphericalDelta.phi * scope.dampingFactor

				let factor = 1.0 + ( zoomEnd - scope.zoomStart ) * scope.zoomSpeed

			    scale *= factor

			    scope.zoomStart += ( zoomEnd - scope.zoomStart ) * scope.dampingFactor
            } else {
                spherical.theta += sphericalDelta.theta
                spherical.phi += sphericalDelta.phi
            }

            // restrict theta to be between desired limits
            var min = scope.minAzimuthAngle,
            max = scope.maxAzimuthAngle

            if ( isFinite( min ) && isFinite( max ) ) {
                if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI
                if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI

                if ( min <= max ) spherical.theta = Math.max( min, Math.min( max, spherical.theta ) )
                else spherical.theta = ( spherical.theta > ( min + max ) / 2 ) ?
                    Math.max( min, spherical.theta ) :
                    Math.min( max, spherical.theta )
            }

            // restrict phi to be between desired limits
            spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) )

            spherical.makeSafe()

            spherical.radius *= scale

            // restrict radius to be between desired limits
            spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) )

            // move target to panned location
            if ( scope.enableDamping === true ) scope.target.addScaledVector( panOffset, scope.dampingFactor )
            else scope.target.add( panOffset )

            offset.setFromSpherical( spherical )

            // rotate offset back to "camera-up-vector-is-up" space
            offset.applyQuaternion( quatInverse )

            position.copy( scope.target ).add( offset )

            scope.object.lookAt( scope.target )

            if ( scope.enableDamping === true ) {
                sphericalDelta.theta *= ( 1 - scope.dampingFactor )
                sphericalDelta.phi *= ( 1 - scope.dampingFactor )

                panOffset.multiplyScalar( 1 - scope.dampingFactor )
            } else {
                sphericalDelta.set( 0, 0, 0 )

                panOffset.set( 0, 0, 0 )
            }

            scale = 1

            switch ( state ) {
                case STATE.RINGPAN:
                case STATE.SCREENPAN:
                    const speed = scope.anglePanSpeed * ( scope.mouse.distance.fromCenter * 3 )

                    scope.panLeft( -speed * Math.cos( scope.mouse.angle.toCenter ) )
                    scope.panUp( -speed * Math.sin( scope.mouse.angle.toCenter ) )

                    break
            }

            // update condition is:
            // min(camera displacement, camera rotation in radians)^2 > EPS
            // using small-angle approximation cos(x/2) = 1 - x^2 / 8

            if ( zoomChanged ||
                lastPosition.distanceToSquared( scope.object.position ) > EPS ||
                8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

                scope.dispatchEvent( changeEvent )

                lastPosition.copy( scope.object.position )

                lastQuaternion.copy( scope.object.quaternion )

                zoomChanged = false

                return true
            }

            return false
        }
    }()

    this.dispose = function () {
        scope.domElement.removeEventListener( 'contextmenu', onContextMenu, false )
        scope.domElement.removeEventListener( 'pointerdown', onPointerDown, false )
        scope.domElement.removeEventListener( 'wheel', onMouseWheel, false )
        scope.domElement.removeEventListener( 'touchstart', onTouchStart, false )
        scope.domElement.removeEventListener( 'touchend', onTouchEnd, false )
        scope.domElement.removeEventListener( 'touchmove', onTouchMove, false )

        scope.domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove, false )
        scope.domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp, false )

        scope.domElement.removeEventListener( 'keydown', onKeyDown, false )

        //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
    }

    //
    // internals
    //

    var scope = this,

    changeEvent = { type: 'change' },
    startEvent = { type: 'start' },
    endEvent = { type: 'end' },

    STATE = {
        NONE: - 1,
        ROTATE: 0,
        DOLLY: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_PAN: 4,
        TOUCH_DOLLY_PAN: 5,
        TOUCH_DOLLY_ROTATE: 6,
        RINGPAN: 7,
        SCREENPAN: 8,
    },

    state = STATE.NONE,

    EPS = 0.000001,

    // current position in spherical coordinates
    spherical = new XBase.spherical(),
    sphericalDelta = new XBase.spherical(),

    scale = 1,
    panOffset = new XBase.vec3(),
    zoomChanged = false,

    rotateStart = new XBase.vec2(),
    rotateEnd = new XBase.vec2(),
    rotateDelta = new XBase.vec2(),

    panStart = new XBase.vec2(),
    panEnd = new XBase.vec2(),
    panDelta = new XBase.vec2(),

    dollyStart = new XBase.vec2(),
    dollyEnd = new XBase.vec2(),
    dollyDelta = new XBase.vec2()

    function getAutoRotationAngle () {
        return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed
    }

    function getZoomScale () {
        return Math.pow( 0.95, scope.zoomSpeed )
    }

    function rotateLeft ( angle ) {
        sphericalDelta.theta -= angle
    }

    function rotateUp ( angle ) {
        sphericalDelta.phi -= angle
    }

    this.rotateLeft = function ( angle ) {
        sphericalDelta.theta -= angle
    }

    this.rotateUp = function ( angle ) {
        sphericalDelta.phi -= angle
    }

    this.panTo = function () {
        return function panTo ( left, up, objectMatrix = scope.object.matrix ) {
            const tarX = scope.target.x,
                tarZ = scope.target.z

            scope.panLeft( tarX - left, objectMatrix )
            scope.panUp( tarZ - up, objectMatrix )
        }
    }()

    this.panLeft = function () {
        const v = new XBase.vec3()

        return function panLeft ( distance, objectMatrix = scope.object.matrix ) {
            v.setFromMatrixColumn( objectMatrix, 0 ) // get X column of objectMatrix
            v.multiplyScalar( - distance )

            panOffset.add( v )
        }
    }()

    this.panUp = function () {
        const v = new XBase.vec3()

        return function panUp ( distance, objectMatrix = scope.object.matrix ) {
            if ( scope.screenSpacePanning === true ) v.setFromMatrixColumn( objectMatrix, 1 )
            else {
                v.setFromMatrixColumn( objectMatrix, 0 )
                v.crossVectors( scope.object.up, v )
            }

            v.multiplyScalar( distance )

            panOffset.add( v )
        }
    }()

    // deltaX and deltaY are in pixels; right and down are positive
    const pan = function () {
        const offset = new XBase.vec3()

        return function pan ( deltaX, deltaY ) {
            const element = scope.domElement

            if ( scope.object.isDepthCamera ) {

                const position = scope.object.position

                offset.copy( position ).sub( scope.target )

                var targetDistance = offset.length()

                targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 )

                scope.panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix )
                scope.panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix )
            } else if ( scope.object.isFlatCamera ) {
                scope.panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix )
                scope.panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix )
            } else {
                console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' )

                scope.enablePan = false
            }
        }
    }()

    this.angleAddFactor = 1
    this.angleFactor = 0

    function dollyOut ( dollyScale ) {
        if ( scope.object.isDepthCamera ) {
            scale /= dollyScale
        } else if ( scope.object.isFlatCamera ) {
            scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) )
            scope.object.updateProjectionMatrix()

            zoomChanged = true
        } else {
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' )

            scope.enableZoom = false
        }
    }

    function dollyIn ( dollyScale ) {
        if ( scope.object.isDepthCamera ) {
            scale *= dollyScale
        } else if ( scope.object.isFlatCamera ) {
            scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) )
            scope.object.updateProjectionMatrix()

            zoomChanged = true
        } else {
            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' )

            scope.enableZoom = false
        }
    }

    //
    // event callbacks - update the object state
    //

    function handleMouseDownRotate ( event ) {
        rotateStart.set( event.clientX, event.clientY )
    }

    function handleMouseDownDolly ( event ) {
        dollyStart.set( event.clientX, event.clientY )
    }

    function handleMouseDownPan ( event ) {
        panStart.set( event.clientX, event.clientY )
    }

    function handleMouseDownRingPan ( event ) {
        if ( document.body.querySelector( 'cursor-pan' ) ) document.body.querySelector( 'cursor-pan' ).show()
        if ( document.body.querySelector( 'cursor-pan-center' ) ) document.body.querySelector( 'cursor-pan-center' ).show()
    }

    function handleMouseMoveRotate ( event ) {
        rotateEnd.set( event.clientX, event.clientY )

        rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed )

        var element = scope.domElement

        rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ) // yes, height

        rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight )

        rotateStart.copy( rotateEnd )

        scope.update()
    }

    function handleMouseMoveDolly ( event ) {
        dollyEnd.set( event.clientX, event.clientY )

        dollyDelta.subVectors( dollyEnd, dollyStart )

        if ( dollyDelta.y > 0 ) dollyOut( getZoomScale() )
        else if ( dollyDelta.y < 0 ) dollyIn( getZoomScale() )

        dollyStart.copy( dollyEnd )

        scope.update()
    }

    function handleMouseMovePan ( event ) {
        panEnd.set( event.clientX, event.clientY )

        panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed )

        pan( panDelta.x, panDelta.y )

        panStart.copy( panEnd )

        scope.update()
    }

    function handleMouseMoveRingPan ( event ) {}

    function handleMouseUp ( event ) {  }

    function handleMouseWheel ( event ) {

        var delta = 0
        
        if ( scope.smoothZoom !== false ) {
			if ( event.wheelDelta ) {
				delta = event.wheelDelta / 40;
			}

			scope.zoomStart += delta * 0.001;
		} else {
			if ( event.wheelDelta !== undefined ) {
				delta = event.wheelDelta
			}

			if ( delta > 0 ) {
				scope.dollyOut( getZoomScale() );
			} else if ( delta < 0 ) {
				scope.dollyIn( getZoomScale() );
			}
		}

        scope.update()
    }

    function handleKeyDown ( event ) {
        var needsUpdate = false

        switch ( event.keyCode ) {
            case scope.keys.UP:
                pan( 0, scope.keyPanSpeed )
                needsUpdate = true
                break

            case scope.keys.BOTTOM:
                pan( 0, - scope.keyPanSpeed )
                needsUpdate = true
                break

            case scope.keys.LEFT:
                pan( scope.keyPanSpeed, 0 )
                needsUpdate = true
                break

            case scope.keys.RIGHT:
                pan( - scope.keyPanSpeed, 0 )
                needsUpdate = true
                break
        }

        if ( needsUpdate ) {
            event.preventDefault()

            scope.update()
        }
    }

    function handleTouchStartRotate ( event ) {
        if ( event.touches.length == 1 ) rotateStart.set( event.touches[0].pageX, event.touches[0].pageY )
        else {
            var x = 0.5 * ( event.touches[0].pageX + event.touches[1].pageX ),
                y = 0.5 * ( event.touches[0].pageY + event.touches[1].pageY )

            rotateStart.set( x, y )
        }
    }

    function handleTouchStartPan ( event ) {
        if ( event.touches.length == 1 ) panStart.set( event.touches[0].pageX, event.touches[0].pageY )
        else {
            var x = 0.5 * ( event.touches[0].pageX + event.touches[1].pageX ),
                y = 0.5 * ( event.touches[0].pageY + event.touches[1].pageY )

            panStart.set( x, y )
        }
    }

    function handleTouchStartDolly ( event ) {
        var dx = event.touches[0].pageX - event.touches[1].pageX,
            dy = event.touches[0].pageY - event.touches[1].pageY,
            distance = Math.sqrt( dx * dx + dy * dy )

        dollyStart.set( 0, distance )
    }

    function handleTouchStartDollyPan ( event ) {
        if ( scope.enableZoom ) handleTouchStartDolly( event )
        if ( scope.enablePan ) handleTouchStartPan( event )
    }

    function handleTouchStartDollyRotate ( event ) {
        if ( scope.enableZoom ) handleTouchStartDolly( event )
        if ( scope.enableRotate ) handleTouchStartRotate( event )
    }

    function handleTouchMoveRotate ( event ) {
        if ( event.touches.length == 1 ) rotateEnd.set( event.touches[0].pageX, event.touches[0].pageY )
        else {
            var x = 0.5 * ( event.touches[0].pageX + event.touches[1].pageX ),
                y = 0.5 * ( event.touches[0].pageY + event.touches[1].pageY )

            rotateEnd.set( x, y )
        }

        rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed )

        var element = scope.domElement

        rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ) // yes, height

        rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight )

        rotateStart.copy( rotateEnd )
    }

    function handleTouchMovePan ( event ) {
        if ( event.touches.length == 1 ) panEnd.set( event.touches[0].pageX, event.touches[0].pageY )
        else {
            var x = 0.5 * ( event.touches[0].pageX + event.touches[1].pageX ),
                y = 0.5 * ( event.touches[0].pageY + event.touches[1].pageY )

            panEnd.set( x, y )
        }

        panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed )

        pan( panDelta.x, panDelta.y )

        panStart.copy( panEnd )
    }

    function handleTouchMoveDolly ( event ) {
        var dx = event.touches[0].pageX - event.touches[1].pageX,
            dy = event.touches[0].pageY - event.touches[1].pageY,
            distance = Math.sqrt( dx * dx + dy * dy )

        dollyEnd.set( 0, distance )

        dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) )

        dollyOut( dollyDelta.y )

        dollyStart.copy( dollyEnd )
    }

    function handleTouchMoveDollyPan ( event ) {
        if ( scope.enableZoom ) handleTouchMoveDolly( event )
        if ( scope.enablePan ) handleTouchMovePan( event )
    }

    function handleTouchMoveDollyRotate ( event ) {
        if ( scope.enableZoom ) handleTouchMoveDolly( event )
        if ( scope.enableRotate ) handleTouchMoveRotate( event )
    }

    function handleTouchEnd ( /*event*/ ) { }

    //
    // event handlers - FSM: listen for events and reset state
    //

    function onPointerDown ( event ) {
        if ( scope.enabled === false ) return

        switch ( event.pointerType ) {
            case 'mouse':
            case 'pen':
                onMouseDown( event )
                break
        }
    }

    function onPointerMove ( event ) {
        if ( scope.enabled === false ) return

        switch ( event.pointerType ) {
            case 'mouse':
            case 'pen':
                onMouseMove( event )
                break
        }
    }

    function onPointerUp ( event ) {
        switch ( event.pointerType ) {
            case 'mouse':
            case 'pen':
                onMouseUp( event )
                break
        }
    }

    function onMouseDown ( event ) {
        // Prevent the browser from scrolling.
        event.preventDefault()

        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.

        scope.domElement.focus ? scope.domElement.focus() : window.focus()

        var mouseAction

        switch ( event.button ) {
            case 0:
                mouseAction = scope.mouseButtons.LEFT
                break
            case 1:
                mouseAction = scope.mouseButtons.MIDDLE
                break
            case 2:
                mouseAction = scope.mouseButtons.RIGHT
                break
            default:
                mouseAction = - 1
        }

        switch ( mouseAction ) {
            case XBase.mouse.DOLLY:
                if ( scope.enableZoom === false ) return

                handleMouseDownDolly( event )

                state = STATE.DOLLY

                break
            case XBase.mouse.ROTATE:
                if ( event.ctrlKey || event.metaKey || event.shiftKey ) {
                    if ( scope.enablePan === false ) return

                    handleMouseDownPan( event )

                    state = STATE.PAN
                } else {
                    if ( scope.enableRotate === false ) return

                    handleMouseDownRotate( event )

                    state = STATE.ROTATE
                }

                break
            case XBase.mouse.PAN:
                if ( event.ctrlKey || event.metaKey || event.shiftKey ) {
                    if ( scope.enableRotate === false ) return

                    handleMouseDownRotate( event )

                    state = STATE.ROTATE
                } else {
                    if ( scope.enablePan === false ) return

                    handleMouseDownPan( event )

                    state = STATE.PAN
                }

                break
            case XBase.mouse.RINGPAN:
                if ( scope.enablePan === false ) return

                handleMouseDownRingPan( event )
                
                state = STATE.RINGPAN

                break
            default:
                state = STATE.NONE
        }

        if ( state !== STATE.NONE ) {
            scope.domElement.ownerDocument.addEventListener( 'pointermove', onPointerMove, false )
            scope.domElement.ownerDocument.addEventListener( 'pointerup', onPointerUp, false )

            scope.dispatchEvent( startEvent )
        }
    }

    function onMouseMove ( event ) {
        if ( scope.enabled === false ) return

        event.preventDefault()

        scope.mouse.screen.x = event.clientX
        scope.mouse.screen.y = event.clientY
            
        scope.mouse.angle.toCenter = Math.atan2(
            event.clientY - scope.domElement.offsetHeight / 2,
            event.clientX - scope.domElement.offsetWidth / 2
        )

        const distanceX = event.clientX - ( scope.domElement.offsetWidth / 2 ),
            distanceY = event.clientY - ( scope.domElement.offsetHeight / 2 )

        scope.mouse.distance.fromCenter = Math.sqrt( ( distanceX * distanceX ) + ( distanceY * distanceY ) )

        // if ( document.body.querySelector( 'cursor-pan' ) ) {
        //     document.body.querySelector( 'cursor-pan' ).style.left = `${ event.clientX }px`
        //     document.body.querySelector( 'cursor-pan' ).style.top = `${ event.clientY }px`

        //     if ( !scope.orientRing ) {
        //         document.body.querySelector( 'cursor-pan' ).style.transform = `translate( -32px, -16px ) rotateZ( ${ scope.mouse.angle.toCenter }rad )`

        //         if ( document.body.querySelector( 'cursor-pan-center' ) ) document.body.querySelector( 'cursor-pan-center' ).style.transform = `translate( -16px, -16px )`
        //     } else {
        //         document.body.querySelector( 'cursor-pan' ).style.transform = `translate( -32px, -16px ) rotateX( -${ scope.getPolarAngle() }rad ) rotateZ( ${ scope.mouse.angle.toCenter }rad )`

        //         if ( document.body.querySelector( 'cursor-pan-center' ) ) document.body.querySelector( 'cursor-pan-center' ).style.transform = `translate( -16px, -16px ) rotateX( ${ scope.getPolarAngle() }rad )`
        //     }

        //     if ( scope.enablePan == true ) {
        //         if (
        //             scope.mouse.screen.x >= scope.domElement.offsetWidth - 15 ||
        //             scope.mouse.screen.x <= 15 ||
        //             scope.mouse.screen.y >= scope.domElement.offsetHeight - 15 ||
        //             scope.mouse.screen.y <= 15
        //         ) {
        //             if ( state != STATE.RINGPAN ) {
        //                 document.body.style.cursor = 'none'
                        
        //                 if ( document.body.querySelector( 'cursor-pan' ) ) document.body.querySelector( 'cursor-pan' ).show()

        //                 state = STATE.SCREENPAN
        //             }
        //         } else {
        //             if ( state == STATE.SCREENPAN ) {
        //                 engine.ui.cursors.reset()

        //                 document.body.querySelector( 'cursor-pan' ).hide()

        //                 state = STATE.NONE
        //             } else if ( state == STATE.RINGPAN ) {
        //                 document.body.style.cursor = 'none'

        //                 if ( document.body.querySelector( 'cursor-pan' ) ) document.body.querySelector( 'cursor-pan' ).show()
        //             }
        //         }
        //     }
        // }

        switch ( state ) {
            case STATE.ROTATE:
                if ( scope.enableRotate === false ) return

                handleMouseMoveRotate( event )

                break
            case STATE.DOLLY:
                if ( scope.enableZoom === false ) return

                handleMouseMoveDolly( event )

                break
            case STATE.PAN:
                if ( scope.enablePan === false ) return

                handleMouseMovePan( event )

                break
            case STATE.RINGPAN:
                if ( scope.enablePan === false ) return

                handleMouseMoveRingPan( event )

                break
        }
    }

    function onMouseUp ( event ) {
        scope.domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove, false )
        scope.domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp, false )

        if ( scope.enabled === false ) return

        // engine.ui.cursors.reset()

        // if ( document.body.querySelector( 'cursor-pan' ) ) document.body.querySelector( 'cursor-pan' ).hide()
        // if ( document.body.querySelector( 'cursor-pan-center' ) ) document.body.querySelector( 'cursor-pan-center' ).hide()

        handleMouseUp( event )

        scope.dispatchEvent( endEvent )

        state = STATE.NONE
    }

    function onMouseWheel ( event ) {
        if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return

        event.preventDefault()
        event.stopPropagation()

        scope.dispatchEvent( startEvent )

        handleMouseWheel( event )

        scope.dispatchEvent( endEvent )
    }

    function onKeyDown ( event ) {
        if ( scope.enabled === false || scope.enableKeys === false || scope.enablePan === false ) return

        handleKeyDown( event )
    }

    function onTouchStart ( event ) {
        if ( scope.enabled === false ) return

        event.preventDefault() // prevent scrolling

        switch ( event.touches.length ) {
            case 1:
                switch ( scope.touches.ONE ) {
                    case XBase.touch.ROTATE:
                        if ( scope.enableRotate === false ) return

                        handleTouchStartRotate( event )

                        state = STATE.TOUCH_ROTATE

                        break
                    case XBase.touch.PAN:
                        if ( scope.enablePan === false ) return

                        handleTouchStartPan( event )

                        state = STATE.TOUCH_PAN

                        break
                    default:
                        state = STATE.NONE
                }

                break
            case 2:
                switch ( scope.touches.TWO ) {
                    case XBase.touch.DOLLY_PAN:
                        if ( scope.enableZoom === false && scope.enablePan === false ) return

                        handleTouchStartDollyPan( event )

                        state = STATE.TOUCH_DOLLY_PAN

                        break
                    case XBase.touch.DOLLY_ROTATE:
                        if ( scope.enableZoom === false && scope.enableRotate === false ) return

                        handleTouchStartDollyRotate( event )

                        state = STATE.TOUCH_DOLLY_ROTATE

                        break
                    default:
                        state = STATE.NONE
                }

                break
            default:
                state = STATE.NONE
        }

        if ( state !== STATE.NONE ) scope.dispatchEvent( startEvent )
    }

    function onTouchMove ( event ) {
        if ( scope.enabled === false ) return

        event.preventDefault() // prevent scrolling
        event.stopPropagation()

        switch ( state ) {
            case STATE.TOUCH_ROTATE:
                if ( scope.enableRotate === false ) return

                handleTouchMoveRotate( event )

                scope.update()

                break
            case STATE.TOUCH_PAN:
                if ( scope.enablePan === false ) return

                handleTouchMovePan( event )

                scope.update()

                break
            case STATE.TOUCH_DOLLY_PAN:
                if ( scope.enableZoom === false && scope.enablePan === false ) return

                handleTouchMoveDollyPan( event )

                scope.update()

                break
            case STATE.TOUCH_DOLLY_ROTATE:
                if ( scope.enableZoom === false && scope.enableRotate === false ) return

                handleTouchMoveDollyRotate( event )

                scope.update()

                break
            default:
                state = STATE.NONE
        }
    }

    function onTouchEnd ( event ) {
        if ( scope.enabled === false ) return

        handleTouchEnd( event )

        scope.dispatchEvent( endEvent )

        state = STATE.NONE
    }

    function onContextMenu ( event ) {
        if ( scope.enabled === false ) return

        event.preventDefault()
    }

    scope.domElement.addEventListener( 'contextmenu', onContextMenu, false )
    scope.domElement.addEventListener( 'pointerdown', onPointerDown, false )
    scope.domElement.addEventListener( 'wheel', onMouseWheel, false )
    scope.domElement.addEventListener( 'touchstart', onTouchStart, false )
    scope.domElement.addEventListener( 'touchend', onTouchEnd, false )
    scope.domElement.addEventListener( 'touchmove', onTouchMove, false )
    scope.domElement.addEventListener( 'keydown', onKeyDown, false )
    scope.domElement.addEventListener( 'pointerup', onPointerUp, false )
    scope.domElement.addEventListener( 'pointermove', onPointerMove, false )

    this.update()
}

EditorControls.prototype = Object.create( XBase.eventDispatcher.prototype )
EditorControls.prototype.constructor = EditorControls
EditorControls.prototype.isControls = true

export default EditorControls
