export type GoogleApiError = {
    error?: { code?: number; message?: string; status?: string };
};

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export function getGeminiApiKey(): string {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("Missing GEMINI_API_KEY env var");
    return key;
}

export async function googlePostJson<T>(
    path: string,
    body: unknown,
): Promise<T> {
    const apiKey = getGeminiApiKey();
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const txt = await res.text();
        // Return the underlying message when possible
        let msg = `Google API error ${res.status}`;
        try {
            const parsed = JSON.parse(txt) as GoogleApiError;
            if (parsed?.error?.message) msg = parsed.error.message;
        } catch {
            // ignore
        }
        throw new Error(`${msg} | raw=${txt}`);
    }

    return await res.json() as T;
}

export async function googleGetJson<T>(fullOperationName: string): Promise<T> {
    // fullOperationName looks like: operations/xxxx or models/.../operations/...
    const apiKey = getGeminiApiKey();
    const url = `${BASE_URL}/${fullOperationName}`;

    const res = await fetch(url, {
        method: "GET",
        headers: {
            "x-goog-api-key": apiKey,
        },
    });

    if (!res.ok) {
        const txt = await res.text();
        let msg = `Google API error ${res.status}`;
        try {
            const parsed = JSON.parse(txt) as GoogleApiError;
            if (parsed?.error?.message) msg = parsed.error.message;
        } catch {
            // ignore
        }
        throw new Error(`${msg} | raw=${txt}`);
    }

    return await res.json() as T;
}
