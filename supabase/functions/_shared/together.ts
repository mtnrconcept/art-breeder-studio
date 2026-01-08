

export async function togetherPostJson<T>(model: string, payload: any): Promise<T> {
    const TOGETHER_KEY = Deno.env.get("TOGETHER_API_KEY");
    if (!TOGETHER_KEY) throw new Error("TOGETHER_API_KEY_MISSING");

    const url = "https://api.together.xyz/v1/images/generations";

    // Adjust payload for Together API format
    const body = {
        model,
        prompt: payload.prompt,
        n: 1,
        size: payload.width && payload.height ? `${payload.width}x${payload.height}` : "1024x768",
        steps: 4, // Fast for Schnell
        response_format: "url"
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${TOGETHER_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Together AI Error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    if (!data.data?.[0]?.url) {
        throw new Error(`Together AI Response Missing Data: ${JSON.stringify(data)}`);
    }
    return {
        images: [{ url: data.data[0].url }]
    } as unknown as T;
}
