export function stripDataUrlPrefix(input: string): string {
    // Accept either raw base64 or data URL: data:image/png;base64,....
    const idx = input.indexOf("base64,");
    if (idx !== -1) return input.slice(idx + "base64,".length);
    return input;
}

export function isProbablyBase64(s: string): boolean {
    // Light heuristic
    return /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 100;
}

export function base64ToUint8Array(b64: string): Uint8Array {
    const clean = stripDataUrlPrefix(b64).replace(/\s/g, "");
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}
