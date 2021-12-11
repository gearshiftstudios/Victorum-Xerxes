const Rejections = {
    dom: {
        body: {
            stylize: `Couldn't stylize the body of the document`,
        },
        container: {
            notVerified: 'The argument passed as <container> is not a verified DOM Element',
        },
    },
    object3D: {
        notVerified: 'The argument passed as <object3D> is not a verified Xerxes 3D Object.',
    },
    renderer: {
        build: 'Renderer build failed.',
        notVerified: 'The argument passed as <renderer> is not a verified Xerxes Renderer.',

        target: {
            color: 'Color Target creation failed.',
            depth: 'Depth Target creation failed.',
        },
    },
    scene: {
        build: 'Scene build failed.',
        notVerified: 'The argument passed as <scene> is not a verified Xerxes Scene.',
    },
}

export default Rejections