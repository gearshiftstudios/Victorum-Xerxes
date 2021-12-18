import * as XBase from '../../base/base.js'
import { BokehDepthShader } from '../../modules/shaders/bokeh2.js'

class Bokeh {
    constructor ( camera ) {
        this.enabled = true

        this.waterDepthShader = BokehDepthShader
        
        this.waterMatDepth = new XBase.mat.shader( {
            uniforms: this.waterDepthShader.uniforms,
            vertexShader: this.waterDepthShader.vertexShader,
            fragmentShader: this.waterDepthShader.fragmentShader
        } )

        this.waterMatDepth.uniforms[ 'mNear' ].value = camera.near
        this.waterMatDepth.uniforms[ 'mFar' ].value = camera.far

        this.scene = new XBase.scene()

		this.camera = new XBase.camera.flat( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 10000, 10000 )
		this.camera.position.z = 600

		this.scene.add( this.camera )

        this.settings = {
            rings: 3,
            samples: 7
        }

		this.pars = { minFilter: XBase.linearFilter, magFilter: XBase.linearFilter, format: XBase.rgb.format }
		this.rtTextureDepth = new XBase.webgl.renderTarget.default( window.innerWidth, window.innerHeight, this.pars )
		this.rtTextureColor = new XBase.webgl.renderTarget.default( window.innerWidth, window.innerHeight, this.pars )

		const bokeh_shader = XBase.shaders.bokeh2.default

		this.bokeh_uniforms = XBase.util.uniforms.clone( bokeh_shader.uniforms )

		this.bokeh_uniforms[ 'tColor' ].value = this.rtTextureColor.texture
		this.bokeh_uniforms[ 'tDepth' ].value = this.rtTextureDepth.texture
		this.bokeh_uniforms[ 'textureWidth' ].value = window.innerWidth
	    this.bokeh_uniforms[ 'textureHeight' ].value = window.innerHeight

		this.materialBokeh = new XBase.mat.shader( {
			uniforms: this.bokeh_uniforms,
			vertexShader: bokeh_shader.vertexShader,
			fragmentShader: bokeh_shader.fragmentShader,
			defines: {
				RINGS: this.settings.rings,
				SAMPLES: this.settings.samples
			}
		} )

		this.quad = new XBase.mesh.default( new XBase.geometry.buffer.plane( window.innerWidth, window.innerHeight ), this.materialBokeh )
		this.quad.position.z = - 1000
		this.scene.add( this.quad )
    }

    linearize ( depth ) {
        const zfar = camera.far
        const znear = camera.near
        return - zfar * znear / ( depth * ( zfar - znear ) - zfar )
    }

    resize () {
        this.camera.left = window.innerWidth / - 2
        this.camera.right = window.innerWidth / 2
        this.camera.top = window.innerHeight / 2
        this.camera.bottom = window.innerHeight / - 2
        this.camera.updateProjectionMatrix()

        this.rtTextureDepth = new XBase.webgl.renderTarget.default( window.innerWidth, window.innerHeight, this.pars )
		this.rtTextureColor = new XBase.webgl.renderTarget.default( window.innerWidth, window.innerHeight, this.pars )

        this.bokeh_uniforms[ 'tColor' ].value = this.rtTextureColor.texture
		this.bokeh_uniforms[ 'tDepth' ].value = this.rtTextureDepth.texture
        this.bokeh_uniforms[ 'textureWidth' ].value = window.innerWidth
	    this.bokeh_uniforms[ 'textureHeight' ].value = window.innerHeight

        this.scene.remove( this.quad )

        this.quad = new XBase.mesh.default( new XBase.geometry.buffer.plane(
            window.innerWidth, window.innerHeight
        ), this.materialBokeh )

		this.quad.position.z = - 500
		this.scene.add( this.quad )

        this.shaderUpdate()
    }

    saturate ( x ) {
        return Math.max( 0, Math.min( 1, x ) )
    }

    shaderUpdate () {
        this.materialBokeh.defines.RINGS = this.settings.rings
        this.materialBokeh.defines.SAMPLES = this.settings.samples
        this.materialBokeh.needsUpdate = true
    }

    smoothstep ( near, far, depth ) {
        const x = saturate( ( depth - near ) / ( far - near ) )
        return x * x * ( 3 - 2 * x )
    }
}

export { Bokeh }