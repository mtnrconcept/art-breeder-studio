
// Catalogue central des outils AI Studio
// Définit les modèles et les configurations par défaut pour chaque outil (image/vidéo)

export type ToolId =
    | 'text-to-image'
    | 'style-transfer'
    | 'inpaint'
    | 'outpaint'
    | 'change-background'
    | 'relight'
    | 'composer'
    | 'upscale';

export type VideoToolId =
    | 'text-to-video'
    | 'image-to-video';

export interface ModelConfig {
    draft: string;
    quality: string;
    experimental?: string;
}

export const MODELS = {
    IMAGE: {
        DRAFT: "models/gemini-2.5-flash-image", // Nano Banana
        QUALITY: "models/imagen-4.0-ultra-generate-001", // Or Imagen 3 if 4 not public
        COMPLEX: "models/gemini-3-pro-image-preview" // Nano Banana Pro
    },
    VIDEO: {
        DRAFT: "models/veo-3.1-fast-generate-preview",
        QUALITY: "models/veo-3.1-generate-preview"
    }
};

export const TOOLS: Record<ToolId | VideoToolId, { name: string, description: string, functionType: 'image' | 'video', defaultModel: string }> = {
    // --- TEXT TO IMAGE ---
    'text-to-image': {
        name: "Generate Image",
        description: "Create an image from text.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT
    },

    // --- COMPOSER ---
    'composer': {
        name: "Composer",
        description: "Compose using style, char, object references.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT // As per spec eq. Artbreeder
    },

    // --- EDITING ---
    'style-transfer': {
        name: "Style Transfer",
        description: "Transform image style.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT
    },
    'inpaint': {
        name: "Inpaint",
        description: "Replace masked area.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT
    },
    'outpaint': {
        name: "Outpaint",
        description: "Extend image borders.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT
    },
    'change-background': {
        name: "Change Background",
        description: "Replace background only.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT
    },
    'relight': {
        name: "Relight",
        description: "Change lighting.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.DRAFT
    },
    'upscale': {
        name: "Upscale",
        description: "Enhance resolution/details.",
        functionType: 'image',
        defaultModel: MODELS.IMAGE.COMPLEX
    },

    // --- VIDEO ---
    'text-to-video': {
        name: "Text to Video",
        description: "Create video from text.",
        functionType: 'video',
        defaultModel: MODELS.VIDEO.QUALITY
    },
    'image-to-video': {
        name: "Image to Video",
        description: "Animate an image.",
        functionType: 'video',
        defaultModel: MODELS.VIDEO.QUALITY
    }
};
