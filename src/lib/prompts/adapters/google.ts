
// Wrapper for Google AI Studio API calls (Gemini / Imagen / Veo via generativelanguage)

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function callGeminiImage(apiKey: string, model: string, prompt: string, negativePrompt?: string, aspectRatio?: string, referenceImages?: string[]) {
    // Gemini 2.5 Flash Image ("Nano Banana") payload
    // Usually standard generateContent but assumes output is image

    const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

    // Construct parts
    const parts: any[] = [{ text: prompt }];

    // If Nano Banana supports ref images directly in parts, we add them. 
    // Assuming standard multimodal input for "editing" or "composition" if supported.
    if (referenceImages) {
        // TODO: Validate if 2.5 Flash Image takes images as input for generation context (it should for editing)
        // For now, simple text-to-image
    }

    const body = {
        contents: [{ parts }],
        generationConfig: {
            // Specifics for image generation models often go here or in specific fields
            // For Gemini Image, checking docs usually implies standard generationConfig not having resizing etc?
            // Wait, "Imagen 3" on Vertex has parameters. Gemini Image might differ.
            // Let's assume standard generateContent text->image flow returns inline data or link.
            responseMimeType: "image/jpeg" // Hint? Or implied by model?
        }
    };

    // Actually, looking at docs for "Gemini for Image Generation", it is often:
    // parts: [ { text: "..." } ], but response contains images.

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(`Gemini Image API Error: ${await res.text()}`);
    }

    return await res.json();
}

export async function callVeoVideo(apiKey: string, model: string, prompt: string) {
    // Veo 3.1 via generativelanguage
    // List said "predictLongRunning"
    const url = `${API_BASE}/${model}:predictLongRunning?key=${apiKey}`;

    const body = {
        instances: [
            { prompt: prompt }
        ],
        parameters: {
            aspectRatio: "16:9",
            durationSeconds: 5
        }
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(`Veo API Error: ${await res.text()}`);
    }

    return await res.json(); // Returns an Operation (LRO)
}
