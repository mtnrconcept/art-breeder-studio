
// Builders de Prompts structurés

export interface PromptComponents {
    subject?: string;
    action?: string;
    environment?: string;
    style?: string;
    camera?: string;
    lighting?: string;
    constraints?: string;
    avoid?: string; // Negative prompt

    // Edit specific
    inputImageRef?: boolean; // "Use input image as content reference"
    preserve?: string;
    change?: string;

    // Tech params
    aspectRatio?: string;
}

// 1. Text to Image
export function buildTextToImagePrompt(c: PromptComponents): string {
    const parts = [];
    if (c.subject) parts.push(c.subject);
    if (c.action) parts.push(c.action);
    if (c.environment) parts.push(`Environment: ${c.environment}`);
    if (c.style) parts.push(`Style: ${c.style}`);
    if (c.camera) parts.push(`Camera: ${c.camera}`);
    if (c.lighting) parts.push(`Lighting: ${c.lighting}`);
    if (c.constraints) parts.push(`Constraints: ${c.constraints}`);
    return parts.join('. ');
}

// 2. Style Transfer
export function buildStyleTransferPrompt(c: PromptComponents): string {
    const parts = ["Use the input image as content reference"];
    if (c.style) parts.push(`Target style: ${c.style}`);
    if (c.preserve) parts.push(`Preserve: ${c.preserve}`);
    if (c.change) parts.push(`Change: ${c.change}`);
    return parts.join('.\n');
}

// 3. Inpaint
export function buildInpaintPrompt(changeDescription: string): string {
    return `Replace the masked area with: ${changeDescription}.\nBlend seamlessly with surrounding image.\nMatch lighting and perspective.`;
}

// 4. Relight
export function buildRelightPrompt(lightingDesc: string): string {
    return `Relight the scene.\nNew lighting: ${lightingDesc}.\nPreserve colors and materials.`;
}

// 5. Video (Veo)
export function buildVideoPrompt(c: PromptComponents): string {
    // Veo needs specific shot specs
    const parts = [];
    if (c.style) parts.push(`${c.style} shot`);
    if (c.subject) parts.push(c.subject);
    if (c.action) parts.push(c.action);
    if (c.camera) parts.push(`Camera movement: ${c.camera}`);
    if (c.lighting) parts.push(`Lighting: ${c.lighting}`);
    if (c.constraints) parts.push(`Constraints: ${c.constraints}`);
    return parts.join('. ');
}

export function buildNegativePrompt(c: PromptComponents): string {
    const defaults = "watermark, text, signature, low quality, distorted, extra limbs, ugly, blurry";
    return c.avoid ? `${defaults}, ${c.avoid}` : defaults;
}
