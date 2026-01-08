
import { supabase } from '@/integrations/supabase/client';
// We don't import backend types directly to avoid bundler issues with Deno paths if strict
// Redefining Types for Client Side
const FORCE_FREE_MODE = true; // Set to true to bypass Fal.ai and test free providers

export type ToolId =
    | 'text-to-image'
    | 'style-transfer'
    | 'inpaint'
    | 'outpaint'
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

export interface PromptComponents {
    subject?: string;
    action?: string;
    environment?: string;
    style?: string;
    camera?: string;
    lighting?: string;
    constraints?: string;
    avoid?: string;
    inputImageRef?: boolean;
    preserve?: string;
    change?: string;
    aspectRatio?: string;
    width?: number;
    height?: number;
}

interface GenerateRequest {
    tool: ToolId;
    components: PromptComponents;
    prompt?: string;
    baseImage?: string;
    maskImage?: string;
    styleImage?: string;
    charImage?: string;
    objectImage?: string;
    quality?: 'draft' | 'quality';
    userId?: string;
    width?: number;
    height?: number;
    aspectRatio?: string; // Top level fallback
    useFallback?: boolean;
}

export interface VideoGenerationRequest {
    tool: VideoToolId;
    components: PromptComponents;
    prompt?: string;
    imageUrl?: string;
    duration?: number;
    userId?: string;
    quality?: 'draft' | 'quality';
    width?: number;
    height?: number;
    aspectRatio?: string;
    motionAmount?: number; // Added motionAmount for Image to Video
    useFallback?: boolean;
}

type VideoRequest = VideoGenerationRequest;

export interface GenerationResult {
    success: boolean;
    imageUrl?: string;
    videoUrl?: string;
    error?: string;
    operationName?: string;
}

export async function getCurrentUserId(): Promise<string | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch (e) {
        console.warn("Auth check failed (user likely not logged in):", e);
        return null;
    }
}

// --- GENERIC HANDLER ---
async function callEdgeGen(func: 'generate-image' | 'generate-video', body: any): Promise<GenerationResult> {
    const userId = await getCurrentUserId();
    const execute = async (payload: any) => {
        const { data, error } = await supabase.functions.invoke(func, {
            body: { ...payload, userId, useFallback: payload.useFallback || FORCE_FREE_MODE }
        });

        if (error) {
            console.error(`[Invoke Error] ${func}:`, error);
            // On 500, data might contain the JSON response from our function
            let msg = error.message;
            if (data && typeof data === 'object' && data.error) {
                msg = data.error;
            }
            throw new Error(`Edge Function ${func} failed: ${msg}`);
        }
        if (data?.error && !payload.useFallback) {
            console.error(`[Data Error] ${func}:`, data.error);
            throw new Error(data.error);
        }
        return data;
    };

    try {
        const data = await execute(body);
        return {
            success: true,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            operationName: data.operationName
        };
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn(`Primary ${func} failed, attempting fallback... Reason:`, errorMessage);
        try {
            // Attempt fallback
            const fallbackData = await execute({ ...body, useFallback: true });
            return {
                success: true,
                imageUrl: fallbackData.imageUrl,
                videoUrl: fallbackData.videoUrl,
                operationName: fallbackData.operationName
            };
        } catch (fallbackError: any) {
            const fbMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            console.error(`Fallback ${func} also failed:`, fbMessage);
            return { success: false, error: fbMessage };
        }
    }
}

// --- EXPORTED FUNCTIONS (MAPPED TO OLD SIGNATURES WHERE POSSIBLE, OR NEW) ---

// 1. Text to Image
export async function textToImage(prompt: string, options?: { negativePrompt?: string; aspectRatio?: string; width?: number; height?: number; style?: string; quality?: 'draft' | 'quality' }): Promise<GenerationResult> {
    const components: PromptComponents = {
        subject: prompt,
        avoid: options?.negativePrompt,
        aspectRatio: options?.aspectRatio,
        width: options?.width,
        height: options?.height,
        style: options?.style
    };
    return callEdgeGen('generate-image', {
        tool: 'text-to-image',
        components,
        aspectRatio: options?.aspectRatio,
        width: options?.width,
        height: options?.height,
        quality: options?.quality || 'draft'
    } as GenerateRequest);
}

// 2. Composer
export async function composeImages(images: string[], prompt: string, opts?: {
    styleImages?: string[];
    characterImages?: string[];
    objectImages?: string[];
    styleStrength?: number;
    contentStrength?: number;
    aspectRatio?: string;
    width?: number;
    height?: number;
}): Promise<GenerationResult> {
    const body: GenerateRequest = {
        tool: 'composer',
        components: {
            subject: prompt,
            aspectRatio: opts?.aspectRatio,
            width: opts?.width,
            height: opts?.height
        },
        prompt: prompt,
        baseImage: images[0],
        styleImage: opts?.styleImages?.[0],
        charImage: opts?.characterImages?.[0],
        objectImage: opts?.objectImages?.[0],
        aspectRatio: opts?.aspectRatio,
        width: opts?.width,
        height: opts?.height
    };
    return callEdgeGen('generate-image', body);
}

// 3. Style Transfer
export async function styleTransfer(imageUrl: string, styleImageUrl: string, prompt: string, strength?: number, aspectRatio?: string, width?: number, height?: number): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'style-transfer',
        baseImage: imageUrl,
        styleImage: styleImageUrl,
        aspectRatio,
        width,
        height,
        components: {
            style: "Reference Style",
            change: prompt,
            aspectRatio,
            width,
            height
        }
    } as GenerateRequest);
}

// 4. Inpaint
export async function inpaintImage(imageUrl: string, maskUrl: string, prompt: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'inpaint',
        baseImage: imageUrl,
        maskImage: maskUrl,
        components: { action: prompt } // "Replace masked area with..."
    } as GenerateRequest);
}

// 5. Relight
export async function relightScene(imageUrl: string, lightingPrompt: string, aspectRatio?: string, width?: number, height?: number): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'relight',
        baseImage: imageUrl,
        aspectRatio,
        width,
        height,
        components: { lighting: lightingPrompt, aspectRatio, width, height }
    } as GenerateRequest);
}

// 6. Outpaint
export async function outpaintImage(imageUrl: string, prompt: string, direction: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'outpaint',
        baseImage: imageUrl,
        components: { action: `Extend ${direction}`, constraints: prompt }
    } as GenerateRequest);
}

// 7. Video (Text to Video)
export async function textToVideo(prompt: string, options?: { duration?: number; aspectRatio?: string; width?: number; height?: number }): Promise<GenerationResult> {
    return callEdgeGen('generate-video', {
        tool: 'text-to-video',
        components: { subject: prompt, aspectRatio: options?.aspectRatio, width: options?.width, height: options?.height },
        aspectRatio: options?.aspectRatio,
        width: options?.width,
        height: options?.height,
        duration: options?.duration
    } as VideoRequest);
}

// 8. Image to Video
export async function imageToVideo(imageUrl: string, prompt: string, options?: { duration?: number; aspectRatio?: string; width?: number; height?: number }): Promise<GenerationResult> {
    return callEdgeGen('generate-video', {
        tool: 'image-to-video',
        imageUrl: imageUrl,
        prompt: prompt,
        components: { action: prompt, aspectRatio: options?.aspectRatio, width: options?.width, height: options?.height },
        aspectRatio: options?.aspectRatio,
        width: options?.width,
        height: options?.height,
        duration: options?.duration
    } as VideoRequest);
}


// 9. Change Backdrop
export async function changeBackdrop(imageUrl: string, prompt: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'change-background',
        baseImage: imageUrl,
        components: { action: prompt }
    } as GenerateRequest);
}

// 10. Portrait
export async function generatePortrait(prompt: string, options?: { aspectRatio?: string; width?: number; height?: number; style?: string; baseImage?: string }): Promise<GenerationResult> {
    // If we have a base image, we want to emphasize consistency
    const enhancedPrompt = options?.baseImage
        ? `Maintain exactly the same character, face, identity, and overall composition from the reference image. The ONLY change is: ${prompt}. Do not change the person's features.`
        : prompt;

    return callEdgeGen('generate-image', {
        tool: 'text-to-image',
        baseImage: options?.baseImage,
        aspectRatio: options?.aspectRatio,
        width: options?.width,
        height: options?.height,
        components: {
            subject: enhancedPrompt,
            aspectRatio: options?.aspectRatio,
            width: options?.width,
            height: options?.height,
            style: options?.style
        }
    } as GenerateRequest);
}

// 11. Splicer
export async function spliceImages(images: string[], prompt?: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'composer',
        prompt: prompt || "Splice these images together seamlessly",
        baseImage: images[0],
        styleImage: images[1],
        charImage: images[2],
        objectImage: images[3]
    } as GenerateRequest);
}

// 12. Pattern
export async function patternGenerate(patternUrl: string, prompt: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'text-to-image',
        baseImage: patternUrl,
        components: { subject: prompt }
    } as GenerateRequest);
}

// 13. Generative Edit
export async function generativeEdit(imageUrl: string, prompt: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'text-to-image',
        baseImage: imageUrl,
        components: { action: prompt }
    } as GenerateRequest);
}

// 14. Check Video Status
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

// 14b. Polling Video
export async function pollVideo(operationName: string, intervalSeconds: number = 2): Promise<GenerationResult> {
    let attempts = 0;
    while (attempts < 60) { // Max 2 mins
        const status = await getVideoStatus(operationName);
        if (status.done) {
            if (status.videoUrl) return { success: true, videoUrl: status.videoUrl };
            return { success: false, error: status.error || "Generation failed" };
        }
        await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
        attempts++;
    }
    return { success: false, error: "Poll timeout" };
}

// 15. Upscale
export async function upscaleImage(imageUrl: string, factor: string = '2'): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'upscale',
        baseImage: imageUrl,
        components: { aspectRatio: '1:1' },
        prompt: `Upscale ${factor}x`
    } as GenerateRequest);
}

// 16. Virtual Try On
export async function virtualTryOn(modelImage: string, clothingImage: string, category: string, aspectRatio?: string, width?: number, height?: number): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'virtual-try-on',
        baseImage: modelImage,
        styleImage: clothingImage,
        aspectRatio,
        width,
        height,
        components: { subject: category, aspectRatio, width, height }
    } as GenerateRequest);
}

// 17. Fashion Factory
export async function fashionFactory(productImage: string, modelImages: string[], pose: string, setting: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'fashion-factory',
        baseImage: productImage,
        styleImage: modelImages[0], // Reference model
        prompt: `Professional fashion shot of product, pose: ${pose}, setting: ${setting}`
    } as GenerateRequest);
}

// 18. Sound Effects
export async function generateSoundEffects(prompt: string, duration: number, category: string): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
    const userId = await getCurrentUserId();
    const execute = async (payload: any) => {
        const { data, error } = await supabase.functions.invoke('generate-audio', {
            body: { ...payload, userId }
        });
        if (error) throw error;
        if (data?.error && !payload.useFallback) throw new Error(data.error);
        return data;
    };

    try {
        const data = await execute({ tool: 'sound-effects', prompt: `${category}: ${prompt}`, duration, useFallback: FORCE_FREE_MODE });
        return { success: true, audioUrl: data.audioUrl };
    } catch (e: any) {
        console.warn(`Primary audio generation failed, attempting fallback...`, e.message);
        try {
            const fallbackData = await execute({ tool: 'sound-effects', prompt: `${category}: ${prompt}`, duration, useFallback: true });
            return { success: true, audioUrl: fallbackData.audioUrl };
        } catch (fbErr: any) {
            console.error(`Audio fallback also failed:`, fbErr.message);
            return { success: false, error: fbErr.message };
        }
    }
}

// 19. Lip Sync
export async function syncLips(portraitUrl: string, audioText: string): Promise<GenerationResult> {
    return callEdgeGen('generate-video', {
        tool: 'lip-sync',
        imageUrl: portraitUrl,
        components: { subject: audioText }
    } as VideoRequest);
}

// 20. Talking Avatar
export async function createTalkingAvatar(imageUrl: string, script: string): Promise<GenerationResult> {
    return callEdgeGen('generate-video', {
        tool: 'talking-avatar',
        imageUrl: imageUrl,
        components: { subject: script }
    } as VideoRequest);
}

// 21. Tuner
export async function tuneImage(imageUrl: string, prompt: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'tuner',
        baseImage: imageUrl,
        prompt: prompt
    } as GenerateRequest);
}

// Legacy / Aliases
export async function generateImage(prompt: string, options?: any) { return textToImage(prompt, options); }

export async function generateVideo(prompt: string, options?: any) {
    if (options?.imageUrl) {
        return imageToVideo(options.imageUrl, prompt, options);
    }
    return textToVideo(prompt, options);
}

