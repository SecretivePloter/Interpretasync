// Public certificate verifier. Deploy with --no-verify-jwt because validators are public.
// It exposes only the fields needed to verify a certificate and returns a short-lived photo URL.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function platformSecretKey(): string {
  // New Supabase projects expose named secret keys as JSON. Retain the legacy
  // variable as a fallback while older projects complete their key migration.
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS")
  if (secretKeys) {
    const key = JSON.parse(secretKeys).default
    if (typeof key === "string" && key) return key
  }

  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (legacyKey) return legacyKey
  throw new Error("Supabase platform secret is unavailable")
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders })

  try {
    const { nomor } = await req.json()
    if (typeof nomor !== "string" || !nomor.trim() || nomor.trim().length > 120) {
      return new Response(JSON.stringify({ error: "Nomor sertifikat tidak valid" }), { status: 400, headers: corsHeaders })
    }

    const url = Deno.env.get("SUPABASE_URL")
    if (!url) throw new Error("Supabase URL is unavailable")
    const secretKey = platformSecretKey()
    const lookupKey = req.headers.get("apikey") ?? secretKey

    // Use only the apikey header. New secret keys are not JWTs and must not be
    // sent as a Bearer token, while legacy service-role JWTs work here too.
    const rpcResponse = await fetch(`${url}/rest/v1/rpc/verify_certificate`, {
      method: "POST",
      headers: {
        apikey: lookupKey,
        "Content-Type": "application/json",
        "Accept-Profile": "ichikara",
        "Content-Profile": "ichikara",
      },
      body: JSON.stringify({ p_nomor: nomor.trim() }),
    })
    if (!rpcResponse.ok) throw new Error(`Certificate RPC failed: ${await rpcResponse.text()}`)
    const rows = await rpcResponse.json()
    const data = Array.isArray(rows) ? rows[0] : null
    if (!data) return new Response(JSON.stringify({ certificate: null }), { headers: corsHeaders })

    let photoUrl: string | null = null
    if (data.photo_path) {
      const safePath = data.photo_path.split("/").map(encodeURIComponent).join("/")
      const signedResponse = await fetch(`${url}/storage/v1/object/sign/ichikara_sertifikat_photos/${safePath}`, {
        method: "POST",
        headers: { apikey: secretKey, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: 60 }),
      })
      if (signedResponse.ok) {
        const signed = await signedResponse.json()
        if (signed.signedURL) photoUrl = `${url}/storage/v1${signed.signedURL}`
      }
    }

    return new Response(JSON.stringify({ certificate: { ...data, photo_url: photoUrl } }), { headers: corsHeaders })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: "Gagal memverifikasi sertifikat" }), { status: 500, headers: corsHeaders })
  }
})
