
import { supabase } from '@/integrations/supabase/client';
// We don't import backend types directly to avoid bundler issues with Deno paths if strict
// Redefining Types for Client Side

export type ToolId =
    | 'text-to-image'
    | 'style-transfer'
    | 'inpaint'
    | 'outpaint'
    | 'change-background'
    | 'relight'
    | 'composer'
    | 'upscale';

export type VideoToolId = 'text-to-video' | 'image-to-video';

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
}

interface VideoRequest {
    tool: VideoToolId;
    components: PromptComponents;
    prompt?: string;
    imageUrl?: string;
    duration?: number;
    userId?: string;
    quality?: 'draft' | 'quality';
}

export interface GenerationResult {
    success: boolean;
    imageUrl?: string;
    videoUrl?: string;
    error?: string;
}

export async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

// --- GENERIC HANDLER ---
async function callEdgeGen(func: 'generate-image' | 'generate-video', body: any): Promise<GenerationResult> {
    try {
        const userId = await getCurrentUserId();
        const { data, error } = await supabase.functions.invoke(func, {
            body: { ...body, userId }
        });

        if (error) { console.error(`${func} error:`, error); return { success: false, error: error.message }; }
        if (data.error) return { success: false, error: data.error };

        return { success: true, imageUrl: data.imageUrl, videoUrl: data.videoUrl };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

// --- EXPORTED FUNCTIONS (MAPPED TO OLD SIGNATURES WHERE POSSIBLE, OR NEW) ---

// 1. Text to Image
export async function textToImage(prompt: string, options?: { negativePrompt?: string; aspectRatio?: string; style?: string; quality?: 'draft' | 'quality' }): Promise<GenerationResult> {
    const components: PromptComponents = {
        subject: prompt, // Simple mapping for now
        avoid: options?.negativePrompt,
        aspectRatio: options?.aspectRatio,
        style: options?.style
    };
    return callEdgeGen('generate-image', {
        tool: 'text-to-image',
        components,
        quality: options?.quality || 'draft'
    } as GenerateRequest);
}

// 2. Composer
export async function composeImages(images: string[], prompt: string, opts?: { styleImages?: string[]; characterImages?: string[]; objectImages?: string[] }): Promise<GenerationResult> {
    // Legacy support: map 'images' to baseImage if single? Or array?
    // Composer V2 usually takes specific slots
    const body: GenerateRequest = {
        tool: 'composer',
        components: { subject: prompt },
        prompt: prompt,
        baseImage: images[0], // Primary layout
        styleImage: opts?.styleImages?.[0],
        charImage: opts?.characterImages?.[0],
        objectImage: opts?.objectImages?.[0]
    };
    return callEdgeGen('generate-image', body);
}

// 3. Style Transfer
export async function styleTransfer(imageUrl: string, styleImageUrl: string, prompt: string, strength?: number): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'style-transfer',
        baseImage: imageUrl,
        styleImage: styleImageUrl, // Backend treats this as 'styleImage' or we map it
        // Actually Style Transfer uses 'style-transfer' tool template
        components: {
            style: "Reference Style", // Template will use "Use input image..."
            change: prompt // "Change color palette..." etc
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
export async function relightScene(imageUrl: string, lightingPrompt: string): Promise<GenerationResult> {
    return callEdgeGen('generate-image', {
        tool: 'relight',
        baseImage: imageUrl,
        components: { lighting: lightingPrompt }
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
export async function textToVideo(prompt: string, options?: { duration?: number; aspectRatio?: string }): Promise<GenerationResult> {
    return callEdgeGen('generate-video', {
        tool: 'text-to-video',
        components: { subject: prompt, aspectRatio: options?.aspectRatio },
        duration: options?.duration
    } as VideoRequest);
}

// 8. Image to Video
export async function imageToVideo(imageUrl: string, prompt: string, options?: { duration?: number }): Promise<GenerationResult> {
    return callEdgeGen('generate-video', {
        tool: 'image-to-video',
        imageUrl: imageUrl,
        components: { action: prompt },
        duration: options?.duration
    } as VideoRequest);
}

// Legacy / Aliases
export async function generateImage(req: any) { return textToImage(req.prompt); } // Fallback
export async function generateVideo(req: any) { return textToVideo(req.prompt); } // Fallback
