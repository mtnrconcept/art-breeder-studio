
// Catalogue central des modèles Fal.ai

export type ToolId =
    | 'text-to-image'
    | 'style-transfer'
    | 'inpaint'
    | 'outpaint'
    | 'extension'
    | 'change-background'
    | 'relight'
    | 'composer'
    | 'upscale'
    | 'virtual-try-on'
    | 'fashion-factory'
    | 'tuner';

export type VideoToolId =
    | 'text-to-video'
    | 'image-to-video'
    | 'lip-sync'
    | 'talking-avatar';

export type AudioToolId = 'sound-effects';

export const MODELS = {
    IMAGE: {
        FLUX_PRO: "fal-ai/flux-pro/v1.1-ultra",
        FLUX_DEV: "fal-ai/flux/dev",
        VTON: "fal-ai/idm-vton",
        UPSCALE: "fal-ai/aura-sr"
    },
    VIDEO: {
        KLING_STD: "fal-ai/kling-video/v1/standard/text-to-video",
        LIPSYNC: "fal-ai/sync-lipsync",
        HELLO_MEME: "fal-ai/hello-meme"
    },
    AUDIO: {
        STABLE_AUDIO: "fal-ai/stable-audio"
    },
    EDIT: {
        INPAINT: "fal-ai/flux/dev/inpainting",
        IC_LIGHT: "fal-ai/ic-light"
    }
};

export const TOOLS: Record<ToolId | VideoToolId | AudioToolId, { name: string, description: string, functionType: 'image' | 'video' | 'audio', model: string }> = {
    'text-to-image': { name: "Generate Image", description: "Flux Pro 1.1", functionType: 'image', model: MODELS.IMAGE.FLUX_PRO },
    'composer': { name: "Composer", description: "Flux Pro", functionType: 'image', model: MODELS.IMAGE.FLUX_PRO },
    'inpaint': { name: "Inpaint", description: "Replace area", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'outpaint': { name: "Outpaint", description: "Extend image", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'extension': { name: "Extension", description: "Extend image", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'style-transfer': { name: "Style Transfer", description: "Flux Pro", functionType: 'image', model: MODELS.IMAGE.FLUX_PRO },
    'upscale': { name: "Upscale", description: "Aura SR", functionType: 'image', model: MODELS.IMAGE.UPSCALE },
    'virtual-try-on': { name: "Virtual Try-On", description: "VTON", functionType: 'image', model: MODELS.IMAGE.VTON },
    'fashion-factory': { name: "Fashion Factory", description: "Flux Pro", functionType: 'image', model: MODELS.IMAGE.FLUX_PRO },
    'tuner': { name: "Tuner", description: "Enhancement", functionType: 'image', model: MODELS.IMAGE.FLUX_PRO },
    'change-background': { name: "Change BG", description: "", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'relight': { name: "Relight", description: "", functionType: 'image', model: MODELS.EDIT.IC_LIGHT },

    // Video
    'text-to-video': { name: "Text to Video", description: "Kling", functionType: 'video', model: MODELS.VIDEO.KLING_STD },
    'image-to-video': { name: "Image to Video", description: "Kling", functionType: 'video', model: "fal-ai/kling-video/v1/standard/image-to-video" },
    'lip-sync': { name: "Lip Sync", description: "Sync lips", functionType: 'video', model: MODELS.VIDEO.LIPSYNC },
    'talking-avatar': { name: "Talking Avatar", description: "Avatar animation", functionType: 'video', model: MODELS.VIDEO.HELLO_MEME },

    // Audio
    'sound-effects': { name: "Sound Effects", description: "Stable Audio", functionType: 'audio', model: MODELS.AUDIO.STABLE_AUDIO }
};
