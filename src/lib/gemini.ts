import { supabase } from '@/integrations/supabase/client';

export async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// Types for AI requests
export interface ImageGenerationRequest {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    style?: string;
    baseImageUrl?: string;
    baseImages?: string[];
    maskImageUrl?: string;
    type?: 'text2img' | 'compose' | 'splice' | 'portrait' | 'pattern' | 'outpaint' | 'tune' | 'inpaint' | 'style-transfer' | 'backdrop' | 'relight';
    styleStrength?: number;
    contentStrength?: number;
    patternImageUrl?: string;
    direction?: string;
    expansionAmount?: number;
}

export interface VideoGenerationRequest {
    prompt: string;
    negativePrompt?: string;
    duration?: number;
    aspectRatio?: string;
    imageUrl?: string;
    cameraMotion?: string;
    motionAmount?: number;
}

export interface GenerationResult {
    success: boolean;
    imageUrl?: string;
    videoUrl?: string;
    error?: string;
}

// Generate image using Imagen 4 Ultra
export async function generateImage(
    requestOrPrompt: ImageGenerationRequest | string,
    optionalOptions?: Partial<ImageGenerationRequest>
): Promise<GenerationResult> {
    try {
        const userId = await getCurrentUserId();
        const request: ImageGenerationRequest = typeof requestOrPrompt === 'string'
            ? { prompt: requestOrPrompt, ...optionalOptions }
            : requestOrPrompt;

        const { data, error } = await supabase.functions.invoke('generate-image', {
            body: {
                ...request,
                userId,
            },
        });

        if (error) {
            console.error('Generate image error:', error);
            return { success: false, error: error.message };
        }

        if (data.error) {
            return { success: false, error: data.error };
        }

        return { success: true, imageUrl: data.imageUrl };
    } catch (error) {
        console.error('Generate image exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Generate video using Veo 3 Preview - returns operation name
export async function generateVideo(
    requestOrPrompt: VideoGenerationRequest | string,
    optionalOptions?: Partial<VideoGenerationRequest>
): Promise<GenerationResult & { operationName?: string }> {
    try {
        const userId = await getCurrentUserId();
        const request: VideoGenerationRequest = typeof requestOrPrompt === 'string'
            ? { prompt: requestOrPrompt, ...optionalOptions }
            : requestOrPrompt;

        const { data, error } = await supabase.functions.invoke('generate-video', {
            body: {
                ...request,
                userId,
            },
        });

        if (error) {
            console.error('Generate video error:', error);
            return { success: false, error: error.message };
        }

        if (data.error) {
            return { success: false, error: data.error };
        }

        return {
            success: true,
            operationName: data.operationName,
            videoUrl: data.videoUrl // Maybe returned dummy or if it was instant
        };
    } catch (error) {
        console.error('Generate video exception:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Check video generation status
export async function getVideoStatus(operationName: string): Promise<{ done: boolean, videoUrl?: string, error?: string }> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase.functions.invoke('get-video-operation', {
            body: { operationName, userId }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Check video status error:', error);
        return { done: true, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Text to Image
export async function textToImage(
    prompt: string,
    options?: {
        negativePrompt?: string;
        aspectRatio?: string;
        style?: string;
    }
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'text2img',
        ...options,
    });
}

// Inpaint image - replace masked area
export async function inpaintImage(
    imageUrl: string,
    maskUrl: string,
    prompt: string
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'inpaint',
        baseImageUrl: imageUrl,
        maskImageUrl: maskUrl,
    });
}

// Style transfer - transform content with style reference
export async function styleTransfer(
    imageUrl: string,
    styleImageUrl: string,
    prompt: string,
    styleStrength?: number
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'style-transfer',
        baseImageUrl: imageUrl,
        patternImageUrl: styleImageUrl,
        styleStrength,
    });
}

// Generative Edit - edit image based on prompt
export async function generativeEdit(
    imageUrl: string,
    prompt: string
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'tune',
        baseImageUrl: imageUrl,
    });
}

// Outpaint - extend image
export async function outpaintImage(
    imageUrl: string,
    prompt: string,
    direction: string,
    expansionAmount?: number
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'outpaint',
        baseImageUrl: imageUrl,
        direction,
        expansionAmount,
    });
}

// Change backdrop
export async function changeBackdrop(
    imageUrl: string,
    newBackdropPrompt: string
): Promise<GenerationResult> {
    return generateImage({
        prompt: newBackdropPrompt,
        type: 'backdrop',
        baseImageUrl: imageUrl,
    });
}

// Relight scene
export async function relightScene(
    imageUrl: string,
    lightingPrompt: string
): Promise<GenerationResult> {
    return generateImage({
        prompt: lightingPrompt,
        type: 'relight',
        baseImageUrl: imageUrl,
    });
}

// Generate portrait
export async function generatePortrait(
    prompt: string,
    options?: { aspectRatio?: string; style?: string }
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'portrait',
        ...options,
    });
}

// Compose images with prompt
export async function composeImages(
    images: string[],
    prompt: string,
    options?: { styleStrength?: number; contentStrength?: number }
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'compose',
        baseImages: images,
        ...options,
    });
}

// Splice/crossbreed images
export async function spliceImages(
    images: string[],
    prompt?: string
): Promise<GenerationResult> {
    return generateImage({
        prompt: prompt || 'Create a seamless hybrid of these images',
        type: 'splice',
        baseImages: images,
    });
}

// Pattern-based generation
export async function patternGenerate(
    patternImageUrl: string,
    prompt: string
): Promise<GenerationResult> {
    return generateImage({
        prompt,
        type: 'pattern',
        patternImageUrl,
    });
}

// Text to Video
export async function textToVideo(
    prompt: string,
    options?: {
        negativePrompt?: string;
        duration?: number;
        aspectRatio?: string;
        cameraMotion?: string;
        motionAmount?: number;
    }
): Promise<GenerationResult> {
    return generateVideo({
        prompt,
        ...options,
    });
}

// Image to Video
export async function imageToVideo(
    imageUrl: string,
    prompt: string,
    options?: {
        duration?: number;
        cameraMotion?: string;
        motionAmount?: number;
    }
): Promise<GenerationResult> {
    return generateVideo({
        prompt,
        imageUrl,
        ...options,
    });
}

