

export async function siliconFlowPostJson<T>(endpoint: string, model: string, payload: any): Promise<T> {
    const SILICON_KEY = Deno.env.get("SILICONFLOW_API_KEY");
    if (!SILICON_KEY) throw new Error("SILICONFLOW_API_KEY_MISSING");

    const url = `https://api.siliconflow.com/v1/${endpoint}`;

    const body: any = {
        model,
        ...payload
    };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SILICON_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`SiliconFlow Error: ${res.status} - ${errorText}`);
    }

    return await res.json() as T;
}

// Specialty for Video (Hunyuan/Mochi)
export async function siliconFlowSubmitVideo(model: string, payload: any): Promise<string> {
    const sfPayload = {
        model,
        prompt: payload.prompt,
        image: payload.image_url,
    };
    const data: any = await siliconFlowPostJson("video/generations", model, sfPayload);
    const requestId = data.requestId || data.id;
    if (!requestId) throw new Error(`SiliconFlow Video failed to start: ${JSON.stringify(data)}`);
    return requestId;
}

export async function siliconFlowGetVideoStatus(requestId: string): Promise<any> {
    const SILICON_KEY = Deno.env.get("SILICONFLOW_API_KEY");
    if (!SILICON_KEY) throw new Error("SILICONFLOW_API_KEY_MISSING");

    const url = "https://api.siliconflow.com/v1/video/get-result";

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SILICON_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ requestId })
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`SiliconFlow Status Error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data; // { code: 20000, message: "...", data: { status: "Succeed", results: { video: "..." } } }
}
