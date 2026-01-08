
export interface PromptComponents {
    subject: string;
    scene?: string;
    style?: string; // key from DEFAULT_LENS or custom string
    camera?: string;
    lighting?: string;
    context?: string[]; // Extra details
    negative?: string;
}

export function buildImagePrompt(components: PromptComponents): string {
    const parts = [];

    // Core
    parts.push(components.subject);
    if (components.scene) parts.push(`in ${components.scene}`);

    // visual modifiers
    if (components.style) parts.push(`Style: ${components.style}`);
    if (components.lighting) parts.push(`Lighting: ${components.lighting}`);
    if (components.camera) parts.push(`Shot: ${components.camera}`);

    if (components.context && components.context.length > 0) {
        parts.push(`Details: ${components.context.join(', ')}`);
    }

    return parts.join(', ');
}

export function buildNegativePrompt(components: PromptComponents): string {
    return components.negative || "blurry, low quality, distorted, watermark, text, signature";
}
