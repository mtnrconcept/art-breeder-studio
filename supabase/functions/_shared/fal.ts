
export type FalApiError = {
    detail?: string;
    message?: string;
};

const FAL_KEY = Deno.env.get("FAL_KEY") || "";

// Generic Post to Fal (Queue or Sync)
export async function falPostJson<T>(
    modelPath: string,
    body: unknown,
): Promise<T> {
    if (!FAL_KEY) throw new Error("Missing FAL_KEY env var");

    // Fal "fal.run" endpoint usually calls the model. 
    // For long running, we might need to handle queue. 
    // Standard simple fetch to fal.run/model_id usually handles submit->wait->return for reasonably fast models
    // Or returns a request_id for slower ones if using specific headers.
    // Fal JS client does this automatically. Here in simple fetch:

    const url = `https://fal.run/${modelPath}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": "application/json",
            // "X-Fal-Wait-For-Result": "true" // Force sync wait if possible?
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const txt = await res.text();
        let msg = `Fal API error ${res.status}`;
        try {
            const parsed = JSON.parse(txt);
            if (parsed?.detail) msg = parsed.detail;
            if (parsed?.message) msg = parsed.message;
        } catch { }
        throw new Error(`${msg} | raw=${txt}`);
    }

    return await res.json() as T;
}

// Queue Specific (Submit -> Request ID)
export async function falSubmit(modelPath: string, body: unknown): Promise<string> {
    if (!FAL_KEY) throw new Error("Missing FAL_KEY");

    // fal.queue.submit usually maps to `POST https://queue.fal.run/model_id`
    const url = `https://queue.fal.run/${modelPath}`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Key ${FAL_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Fal Submit Error: ${txt}`);
    }

    const json = await res.json();
    // Usually returns { request_id: "..." }
    if (json.request_id) return json.request_id;
    throw new Error(`No request_id in response: ${JSON.stringify(json)}`);
}

// Check Status
export async function falStatus(requestId: string): Promise<any> {
    const url = `https://queue.fal.run/requests/${requestId}/status`;
    const res = await fetch(url, {
        headers: { "Authorization": `Key ${FAL_KEY}` }
    });
    if (!res.ok) throw new Error("Fal Status Check Failed");
    return await res.json();
}

// Get Result
export async function falResult(requestId: string): Promise<any> {
    const url = `https://queue.fal.run/requests/${requestId}`;
    const res = await fetch(url, {
        headers: { "Authorization": `Key ${FAL_KEY}` }
    });
    if (!res.ok) throw new Error("Fal Result Fetch Failed");
    return await res.json();
}
