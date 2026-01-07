
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  style?: string;
  baseImageUrl?: string;
  baseImages?: string[];
  styleImages?: string[];
  characterImages?: string[];
  objectImages?: string[];
  maskImageUrl?: string;
  type?: string;
  styleStrength?: number;
  contentStrength?: number;
  patternImageUrl?: string;
  direction?: string;
  expansionAmount?: number;
  userId?: string;
}

// --- AUTH HELPER FOR SERVICE ACCOUNT ---
async function getServiceAccountToken(serviceAccountJson: string): Promise<string> {
  try {
    const credentials = JSON.parse(serviceAccountJson);
    let pemContents = credentials.private_key;
    if (pemContents.includes("\\n")) pemContents = pemContents.replace(/\\n/g, "\n");
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    if (pemContents.includes(pemHeader)) {
      const start = pemContents.indexOf(pemHeader) + pemHeader.length;
      const end = pemContents.indexOf(pemFooter);
      pemContents = pemContents.substring(start, end).trim();
    }
    const binaryDerString = atob(pemContents.replace(/\s/g, ''));
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) binaryDer[i] = binaryDerString.charCodeAt(i);
    const key = await crypto.subtle.importKey("pkcs8", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"]);
    const jwt = await create({ alg: "RS256", typ: "JWT" }, {
      iss: credentials.client_email, scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token", exp: getNumericDate(3600), iat: getNumericDate(0),
    }, key);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    });
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
    return (await tokenRes.json()).access_token;
  } catch (e) { throw e; }
}
// ---------------------------------------

function isHttpUrl(s: string) { return /^https?:\/\//i.test(s); }
function isDataUrl(s: string) { return /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(s); }

async function fetchAsBase64(url: string): Promise<{ mimeType: string; b64: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image URL (${res.status})`);
    const contentType = res.headers.get("content-type") || "image/png";
    const bytes = new Uint8Array(await res.arrayBuffer());
    const b64 = btoa(String.fromCharCode(...bytes));
    return { mimeType: contentType, b64 };
  } catch (e) { throw e; }
}

function dataUrlToBase64(dataUrl: string): { mimeType: string; b64: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
  if (!match) throw new Error("Invalid data URL");
  return { mimeType: match[1], b64: match[2] };
}

async function normalizeImageInput(input?: string): Promise<{ mimeType: string; b64: string } | null> {
  if (!input) return null;
  if (isDataUrl(input)) return dataUrlToBase64(input);
  if (isHttpUrl(input)) return await fetchAsBase64(input);
  return { mimeType: "image/png", b64: input };
}

// --- GEMINI VISION HELPER FOR COMPOSER ---
// Generates a descriptive prompt merging multiple images
async function generateFusedPrompt(params: GenerateRequest, apiKey: string): Promise<string> {
  const geminiModel = "gemini-1.5-flash"; // Good enough for description
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;

  const parts: any[] = [];
  parts.push({ text: `Analyze these images and creates a detailed image generation prompt that combines them into a single coherent scene based on this user instruction: "${params.prompt}".\n` });

  // Helper to add image
  const addImg = async (url: string, role: string) => {
    const n = await normalizeImageInput(url);
    if (n) {
      parts.push({ text: `\n[Image: ${role}]` });
      parts.push({ inline_data: { mime_type: n.mimeType, data: n.b64 } });
    }
  };

  if (params.styleImages?.[0]) await addImg(params.styleImages[0], "Style Reference");
  if (params.characterImages?.[0]) await addImg(params.characterImages[0], "Character Reference");
  if (params.objectImages?.[0]) await addImg(params.objectImages[0], "Object/Prop Reference");
  if (params.baseImageUrl) await addImg(params.baseImageUrl, "Composition/Layout Reference");

  parts.push({ text: "\nOutput ONLY the final detailed prompt string, nothing else." });

  const body = { contents: [{ parts }] };

  try {
    console.log("Calling Gemini Vision for prompt fusion...");
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json();
    const generatedPrompt = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedPrompt) {
      console.log("Fused Prompt:", generatedPrompt);
      return generatedPrompt;
    }
  } catch (e) {
    console.error("Gemini Vision failed:", e);
  }
  return params.prompt; // Fallback
}


async function callImagen3(params: GenerateRequest): Promise<string> {
  const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
  const geminiKey = Deno.env.get("GEMINI_API_KEY"); // For Vision
  let accessToken = "";
  let isServiceAccount = false;
  let projectId = "gen-lang-client-0546349933";

  if (saJson) {
    try {
      // Get Project ID from JSON
      const creds = JSON.parse(saJson);
      if (creds.project_id) projectId = creds.project_id;

      accessToken = await getServiceAccountToken(saJson);
      isServiceAccount = true;
    } catch (e) {
      console.warn("SA Auth failed", e);
    }
  }

  // Decide prompt
  let finalPrompt = params.prompt;

  // If we have "Composer" inputs (style/char/obj), let's use Gemini to fuse them first
  // Only if we have a simple API key (required for generative language API usually, or we could use Vertex Gemini)
  // For simplicity, we use the simple key for Gemini Vision if available.
  if (geminiKey && (params.styleImages?.length || params.characterImages?.length || params.objectImages?.length)) {
    finalPrompt = await generateFusedPrompt(params, geminiKey);
  }

  // Config
  const model = "imagen-3.0-generate-001";
  const region = "us-central1";
  const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict`;

  const instances = [{ prompt: finalPrompt }];

  // Handle baseImageUrl (Layout) - Imagen accepts one image for reference/editing
  // If we used it in Vision, we might still want to pass it to Imagen for structure if strictly needed.
  // Let's pass it if it exists.
  let imgInput = params.baseImageUrl || (params.baseImages && params.baseImages[0]);
  if (imgInput) {
    const norm = await normalizeImageInput(imgInput);
    if (norm) {
      // @ts-ignore
      instances[0].image = { bytesBase64Encoded: norm.b64 };
    }
  }

  const parameters: any = {
    sampleCount: 1,
    aspectRatio: params.aspectRatio || "1:1",
    personGeneration: "allow_adult",
    safetyFilterLevel: "block_few"
  };

  const body = { instances, parameters };

  // Call Imagen
  let res;
  if (isServiceAccount) {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
      body: JSON.stringify(body)
    });
  } else {
    // Fallback key logic (simplified for brevity, main path is SA)
    const k = Deno.env.get("GEMINI_API_KEY");
    res = await fetch(`${endpoint}?key=${k}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  if (!res.ok) {
    const txt = await res.text();
    console.error(txt);
    throw new Error(`Vertex AI Error: ${txt}`);
  }

  const json = await res.json();
  return json.predictions?.[0]?.bytesBase64Encoded;
}

async function uploadToStorage(supabase: any, imageDataUrl: string, userId: string, type: string) {
  const timestamp = Date.now();
  const fileName = `${userId}/${type}/${timestamp}.png`;
  const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const { error } = await supabase.storage.from("generations").upload(fileName, binaryData, { contentType: "image/png", upsert: false });
  if (error) return "";
  const { data } = supabase.storage.from("generations").getPublicUrl(fileName);
  return data.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const params: GenerateRequest = await req.json();
    console.log(`[generate-image] Type: ${params.type}, Prompt: ${params.prompt.substring(0, 30)}...`);

    const b64 = await callImagen3(params);
    if (!b64) throw new Error("No image data returned.");

    let imageUrl = `data:image/png;base64,${b64}`;
    if (params.userId) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const stored = await uploadToStorage(supabase, imageUrl, params.userId, params.type || 'gen');
      if (stored) imageUrl = stored;
    }

    return new Response(JSON.stringify({ imageUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Fatal:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown Error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
