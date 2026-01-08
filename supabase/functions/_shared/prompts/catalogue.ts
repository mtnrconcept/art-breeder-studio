
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
        FLUX_SCHNELL: "fal-ai/flux/schnell",
        VTON: "fal-ai/idm-vton",
        UPSCALE: "fal-ai/aura-sr"
    },
    VIDEO: {
        KLING_STD: "fal-ai/kling-video/v1/standard/text-to-video",
        KLING_IMG: "fal-ai/kling-video/v1/standard/image-to-video",
        LIPSYNC: "fal-ai/sync-lipsync",
        HELLO_MEME: "fal-ai/hello-meme",
        HUNYUAN: "fal-ai/hunyuan-video"
    },
    AUDIO: {
        STABLE_AUDIO: "fal-ai/stable-audio"
    },
    EDIT: {
        INPAINT: "fal-ai/flux/dev/inpainting",
        REDUX: "fal-ai/flux-pro/v1.1-ultra/redux",
        STYLE_TRANSFER: "fal-ai/image-apps-v2/style-transfer",
        IC_LIGHT: "fal-ai/ic-light"
    }
};

export const TOOLS: Record<ToolId | VideoToolId | AudioToolId, { name: string, description: string, functionType: 'image' | 'video' | 'audio', model: string }> = {
    'text-to-image': { name: "Generate Image", description: "Flux Pro 1.1 Ultra", functionType: 'image', model: MODELS.IMAGE.FLUX_PRO },
    'composer': { name: "Composer", description: "Flux Redux", functionType: 'image', model: MODELS.EDIT.REDUX },
    'inpaint': { name: "Inpaint", description: "Flux Dev Inpaint", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'outpaint': { name: "Outpaint", description: "Flux Dev Inpaint", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'extension': { name: "Extension", description: "Flux Dev Inpaint", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'style-transfer': { name: "Style Transfer", description: "Artistic style apply", functionType: 'image', model: MODELS.EDIT.STYLE_TRANSFER },
    'upscale': { name: "Upscale", description: "Aura SR", functionType: 'image', model: MODELS.IMAGE.UPSCALE },
    'virtual-try-on': { name: "Virtual Try-On", description: "IDM-VTON", functionType: 'image', model: MODELS.IMAGE.VTON },
    'fashion-factory': { name: "Fashion Factory", description: "VTON + Flux", functionType: 'image', model: MODELS.IMAGE.VTON },
    'tuner': { name: "Tuner", description: "Flux Dev", functionType: 'image', model: MODELS.IMAGE.FLUX_DEV },
    'change-background': { name: "Change BG", description: "Flux Dev Inpaint", functionType: 'image', model: MODELS.EDIT.INPAINT },
    'relight': { name: "Relight", description: "IC-Light", functionType: 'image', model: MODELS.EDIT.IC_LIGHT },

    // Video
    'text-to-video': { name: "Text to Video", description: "Kling 1.0", functionType: 'video', model: MODELS.VIDEO.KLING_STD },
    'image-to-video': { name: "Image to Video", description: "Kling 1.0", functionType: 'video', model: MODELS.VIDEO.KLING_IMG },
    'lip-sync': { name: "Lip Sync", description: "Sync lips", functionType: 'video', model: MODELS.VIDEO.LIPSYNC },
    'talking-avatar': { name: "Talking Avatar", description: "Hello Meme", functionType: 'video', model: MODELS.VIDEO.HELLO_MEME },

    // Audio
    'sound-effects': { name: "Sound Effects", description: "Stable Audio", functionType: 'audio', model: MODELS.AUDIO.STABLE_AUDIO }
};
