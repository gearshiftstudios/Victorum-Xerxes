import * as XBase from './base/base.js'
import * as CameraTools from './tools/camera.js'
import * as DOMTools from './tools/dom.js'
import * as LightingTools from './tools/lighting.js'
import * as PostProcessingTools from './tools/postprocessing.js'
import * as RendererTools from './tools/renderer.js'
import * as SceneTools from './tools/scene.js'
import * as TerrainTools from './tools/terrain.js'
import * as BVH from './libs/meshbvh.js'
import EditorControls from './modules/controls/editor.js'
import MapControls from './modules/controls/map.js'
import InfiniteGridHelper from './modules/helpers/infinitegrid.js'
import FXAAShader from './modules/shaders/fxaa.js'
import { ShaderPass } from './modules/postprocessing/shaderpass.js'
import { GLTFLoader } from './modules/loaders/gltf.js'
import { Water_Flow } from './modules/water/flow.js'
import { Water_SimpleFoam } from './modules/water/simplefoam.js'
import { Water_LowPoly } from './modules/water/lowpoly.js'
import { Reflector } from './modules/objects/reflector.js'
import { EffectComposer } from './modules/postprocessing/effectcomposer.js'
import { RenderPass } from './modules/postprocessing/renderpass.js'
import { BokehPass } from './modules/postprocessing/bokehpass.js'
import { BokehShader, BokehDepthShader } from './modules/shaders/bokeh2.js'

const Xerxes = XBase

Xerxes.geometry.buffer.default.prototype.computeBoundsTree = BVH.computeBoundsTree
Xerxes.geometry.buffer.default.prototype.disposeBoundsTree = BVH.disposeBoundsTree
Xerxes.mesh.default.prototype.raycast = BVH.acceleratedRaycast

Xerxes.composer.effect = EffectComposer

Xerxes.controls.editor = EditorControls
Xerxes.controls.map = MapControls

Xerxes.loader.gltf = GLTFLoader

Xerxes.tools.camera = {
    create: {
        depth: CameraTools.createDepthCamera,
        flat: CameraTools.createFlatCamera,
    },
}

Xerxes.tools.dom = {
    body: {
        stylize: DOMTools.stylizeBody,
    },
}

Xerxes.helper.inifinitegrid = InfiniteGridHelper

Xerxes.objects.water = {
    flow: Water_Flow,
    lowpoly: Water_LowPoly,
    simplefoam: Water_SimpleFoam,
}

Xerxes.objects.reflector = Reflector

Xerxes.pass.bokeh = BokehPass
Xerxes.pass.render = RenderPass
Xerxes.pass.shader = ShaderPass

Xerxes.shaders.bokeh2 = {
    default: BokehShader,
    depth: BokehDepthShader,
}

Xerxes.shaders.fxaa = FXAAShader

Xerxes.tools.postprocessing = {
    build: PostProcessingTools.buildPostProcessing,
}

Xerxes.tools.terrain = {
    build: {
        chunkmap: TerrainTools.buildChunkMap,
    }
}

Xerxes.tools.renderer = {
    webgl: {
        build: RendererTools.buildWebGLRenderer,

        create: {
            display: RendererTools.createRendererDataDisplay,

            target: {
                color: RendererTools.createColorTarget,
                depth: RendererTools.createDepthTarget,
            },
        },
    },
}

Xerxes.tools.scene = {
    build: SceneTools.buildScene,
    
    create: {
        background: SceneTools.createBackground,
        fog: SceneTools.createFog,
        skybox: SceneTools.createSkybox,
    },
}

Xerxes.tools.lighting = {
    basic: {
        build: LightingTools.buildBasicLighting,
    }
}

Xerxes.log.write( 'Engine is ready for use.' )

export default Xerxes