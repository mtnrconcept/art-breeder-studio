

export async function huggingFacePost<T>(model: string, payload: any): Promise<T> {
    const HF_TOKEN = Deno.env.get("HUGGINGFACE_TOKEN");
    if (!HF_TOKEN) throw new Error("HUGGINGFACE_TOKEN_MISSING");

    const url = `https://router.huggingface.co/inference/v1/models/${model}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Hugging Face Error: ${res.status} - ${errorText}`);
    }

    // Usually returns audio blob or json. 
    // For Inference API text-to-audio, it returns a blob.
    return await res.blob() as unknown as T;
}
