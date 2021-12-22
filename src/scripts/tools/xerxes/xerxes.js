import * as XBase from './base/base.js'

/* import tools */ 

import * as CameraTools from './tools/camera.js'
import * as ControlTools from './tools/controls.js'
import * as DOMTools from './tools/dom.js'
import * as LightingTools from './tools/lighting.js'
import * as PostProcessingTools from './tools/postprocessing.js'
import * as RendererTools from './tools/renderer.js'
import * as SceneTools from './tools/scene.js'
import * as TerrainTools from './tools/terrain.js'

/* import controls */

import EditorControls from './modules/controls/editor.js'
import MapControls from './modules/controls/map.js'

/* import controls */

import CSS2DObject from './modules/objects/css2d.js'
import InfiniteGridHelper from './modules/helpers/infinitegrid.js'
import Reflector from './modules/objects/reflector.js'
import Refractor from './modules/objects/refractor.js'

/* import renderers */

import CSS2DRenderer from './modules/renderers/css2d.js'

/* import optimizers */ 

import * as BVH from './libs/meshbvh.js'

import FXAAShader from './modules/shaders/fxaa.js'
import TerrainCamera from './modules/camera/terrain.js'
import UnrealBloomPass from './modules/postprocessing/unrealbloompass.js'
import { ShaderPass } from './modules/postprocessing/shaderpass.js'
import { GLTFLoader } from './modules/loaders/gltf.js'
import { Water_Flow } from './modules/water/flow.js'
import { Water_SimpleFoam } from './modules/water/simplefoam.js'
import { Water_LowPoly } from './modules/water/lowpoly.js'
import { EffectComposer } from './modules/postprocessing/effectcomposer.js'
import { RenderPass } from './modules/postprocessing/renderpass.js'
import { BokehPass } from './modules/postprocessing/bokehpass.js'
import { BokehShader, BokehDepthShader } from './modules/shaders/bokeh2.js'

const Xerxes = XBase

/* moduify base with BVH */ 

Xerxes.geometry.buffer.default.prototype.computeBoundsTree = BVH.computeBoundsTree
Xerxes.geometry.buffer.default.prototype.disposeBoundsTree = BVH.disposeBoundsTree
Xerxes.mesh.default.prototype.raycast = BVH.acceleratedRaycast

/* camera */ 

Xerxes.camera.terrain = TerrainCamera

/* composer */ 

Xerxes.composer.effect = EffectComposer

/* controls */ 

Xerxes.controls.editor = EditorControls
Xerxes.controls.map = MapControls

/* helpers */ 

Xerxes.helper.inifinitegrid = InfiniteGridHelper

/* loaders */ 

Xerxes.loader.gltf = GLTFLoader

/* objects */ 

Xerxes.objects.css2d = CSS2DObject
Xerxes.objects.reflector = Reflector
Xerxes.objects.refractor = Refractor

Xerxes.objects.water = {
    flow: Water_Flow,
    lowpoly: Water_LowPoly,
    simplefoam: Water_SimpleFoam,
}

/* passes */ 

Xerxes.pass.bokeh = BokehPass
Xerxes.pass.render = RenderPass
Xerxes.pass.shader = ShaderPass
Xerxes.pass.unrealbloom = UnrealBloomPass

/* renderers */

Xerxes.renderer.css2d = CSS2DRenderer

/* shaders */ 

Xerxes.shaders.fxaa = FXAAShader

Xerxes.shaders.bokeh2 = {
    default: BokehShader,
    depth: BokehDepthShader,
}

/* tools */ 

Xerxes.tools.camera = {
    create: {
        depth: CameraTools.createDepthCamera,
        flat: CameraTools.createFlatCamera,
        terrain: CameraTools.createTerrainCamera,
    },
}

Xerxes.tools.controls = {
    build: ControlTools.buildControls,
}

Xerxes.tools.dom = {
    body: {
        stylize: DOMTools.stylizeBody,
    },

    set: {
        filter: DOMTools.setFilter,
    },
}

Xerxes.tools.lighting = {
    basic: {
        build: LightingTools.buildBasicLighting,
    }
}

Xerxes.tools.postprocessing = {
    build: PostProcessingTools.buildPostProcessing,
}

Xerxes.tools.renderer = {
    css2d: {
        build: RendererTools.buildCSS2DRenderer,
    },
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

Xerxes.tools.terrain = {
    build: {
        chunkmap: TerrainTools.buildChunkMap,
    }
}

Xerxes.log.write( 'Engine is ready for use.' )

window.xerxes = Xerxes

export default Xerxes