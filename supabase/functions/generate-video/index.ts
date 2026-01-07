
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoGenerateRequest {
    prompt: string;
    negativePrompt?: string;
    duration?: number;
    aspectRatio?: string;
    imageUrl?: string;
    cameraMotion?: string;
    userId?: string;
}

// --- AUTH HELPER FOR SERVICE ACCOUNT ---
async function getServiceAccountToken(serviceAccountJson: string): Promise<string> {
    try {
        const credentials = JSON.parse(serviceAccountJson);
        const pemHeader = "-----BEGIN PRIVATE KEY-----";
        const pemFooter = "-----END PRIVATE KEY-----";
        let pemContents = credentials.private_key;
        if (pemContents.startsWith(pemHeader)) {
            pemContents = pemContents.substring(pemHeader.length, pemContents.length - pemFooter.length).trim();
        }
        const binaryDerString = atob(pemContents.replace(/\s/g, ''));
        const binaryDer = new Uint8Array(binaryDerString.length);
        for (let i = 0; i < binaryDerString.length; i++) {
            binaryDer[i] = binaryDerString.charCodeAt(i);
        }
        const key = await crypto.subtle.importKey(
            "pkcs8", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"]
        );
        const jwt = await create({ alg: "RS256", typ: "JWT" }, {
            iss: credentials.client_email,
            scope: "https://www.googleapis.com/auth/cloud-platform",
            aud: "https://oauth2.googleapis.com/token",
            exp: getNumericDate(3600), iat: getNumericDate(0),
        }, key);

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
        });
        if (!tokenRes.ok) throw new Error(await tokenRes.text());
        return (await tokenRes.json()).access_token;
    } catch (e) {
        console.error("SA Auth Error:", e);
        throw e;
    }
}

async function callVeo(params: VideoGenerateRequest): Promise<any> {
    // 1. Try Service Account
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    let accessToken = "";
    let isServiceAccount = false;
    let projectId = "gen-lang-client-0546349933";

    if (saJson) {
        try {
            accessToken = await getServiceAccountToken(saJson);
            isServiceAccount = true;
            const creds = JSON.parse(saJson);
            if (creds.project_id) projectId = creds.project_id;
        } catch (e) { console.warn("SA failed, using keys."); }
    }

    const model = "veo-2.0-generate-001";
    const region = "us-central1";
    const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict`;

    // Body
    const instances: any = [{ prompt: params.prompt }];
    if (params.imageUrl) {
        const b64 = params.imageUrl.split(',')[1] || params.imageUrl;
        instances[0].image = { bytesBase64Encoded: b64 };
    }
    const parameters: any = {
        aspectRatio: params.aspectRatio || "16:9",
        durationSeconds: params.duration || 5,
        personGeneration: "allow_adult"
    };

    const body = { instances, parameters };

    if (isServiceAccount) {
        console.log(`[Veo] Using SA for ${projectId}...`);
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Veo SA Error: ${await res.text()}`);
        return await res.json();
    }

    // Fallback Keys
    const keys = [Deno.env.get("GEMINI_API_KEY"), Deno.env.get("GEMINI_API_KEY_2")].filter(Boolean) as string[];
    let lastError = null;

    for (const apiKey of keys) {
        try {
            const isVerifierToken = apiKey.startsWith('AQ.');
            const url = isVerifierToken ? endpoint : `${endpoint}?key=${apiKey}`;
            const headers: any = { "Content-Type": "application/json" };
            if (isVerifierToken) headers["Authorization"] = `Bearer ${apiKey}`;

            console.log(`[Veo] Using Key...`);
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (!res.ok) {
                if ([401, 403, 429].includes(res.status)) {
                    lastError = new Error(await res.text());
                    continue;
                }
                throw new Error(await res.text());
            }
            return await res.json();
        } catch (e) { lastError = e; }
    }
    throw lastError || new Error("Auth failed");
}

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const params: VideoGenerateRequest = await req.json();
        console.log(`[generate-video] Request: ${params.prompt.substring(0, 50)}...`);

        const data = await callVeo(params);

        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        let videoUrl = "";

        if (b64) {
            videoUrl = `data:video/mp4;base64,${b64}`;
        } else {
            console.warn("Veo response structure:", JSON.stringify(data).substring(0, 200));
            throw new Error("No video content returned directly.");
        }

        return new Response(JSON.stringify({
            success: true,
            videoUrl,
            operationName: null
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
        console.error("[generate-video] Fatal:", err);
        const msg = err instanceof Error ? err.message : "Unknown Error";
        return new Response(JSON.stringify({ error: msg }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
