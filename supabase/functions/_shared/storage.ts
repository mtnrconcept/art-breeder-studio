import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { base64ToUint8Array } from "./base64.ts";

export function getServiceSupabaseClient() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    return createClient(supabaseUrl, serviceKey);
}

export async function uploadBase64ToBucket(params: {
    bucket: string;
    path: string;
    base64DataUrlOrRaw: string;
    contentType?: string;
}): Promise<string> {
    const supabase = getServiceSupabaseClient();
    const bytes = base64ToUint8Array(params.base64DataUrlOrRaw);

    const { error } = await supabase.storage.from(params.bucket).upload(
        params.path,
        bytes,
        { contentType: params.contentType || "image/png", upsert: false },
    );

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from(params.bucket).getPublicUrl(params.path);
    if (!data?.publicUrl) throw new Error("Storage public URL missing");
    return data.publicUrl;
}

// Keep alias for compatibility
export const uploadBase64PngToBucket = (params: any) => uploadBase64ToBucket({ ...params, contentType: "image/png" });
