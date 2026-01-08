
export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    model: {
        preview: string;
        prod: string;
        type: 'image' | 'video';
    };
}

export const TOOLS: Record<string, ToolDefinition> = {
    textToImage: {
        id: 'text-to-image',
        name: 'Text to Image',
        description: 'Generate high-quality images from text descriptions.',
        model: {
            preview: 'models/gemini-2.5-flash-image-preview', // Nano Banana
            prod: 'models/gemini-2.5-flash-image',
            type: 'image'
        }
    },
    composer: {
        id: 'composer',
        name: 'Composer',
        description: 'Compose an image using style, character, and object references.',
        model: {
            preview: 'models/gemini-2.5-flash-image', // Capabilities might be same, simplified
            prod: 'models/gemini-2.5-flash-image',
            type: 'image'
        }
    },
    videoCreation: {
        id: 'video-creation',
        name: 'Text to Video',
        description: 'Generate videos from text or image prompts.',
        model: {
            preview: 'models/veo-3.1-generate-preview',
            prod: 'models/veo-3.1-generate-preview', // Only preview available?
            type: 'video'
        }
    }
};

export const DEFAULT_LENS = {
    photorealistic: "cinematic lighting, highly detailed, photorealistic, 8k resolution, shot on 35mm lens",
    anime: "anime style, cel shaded, vibrant colors, studio ghibli inspired",
    illustration: "digital illustration, vector art, clean lines, flat colors",
    clay: "claymation style, plasticine texture, soft lighting, depth of field"
};
