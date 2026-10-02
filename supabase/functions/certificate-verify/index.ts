// Public certificate verifier. Deploy with --no-verify-jwt because validators are public.
// It exposes only the fields needed to verify a certificate and returns a short-lived photo URL.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders })

  try {
    const { nomor } = await req.json()
    if (typeof nomor !== "string" || !nomor.trim() || nomor.trim().length > 120) {
      return new Response(JSON.stringify({ error: "Nomor sertifikat tidak valid" }), { status: 400, headers: corsHeaders })
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    )
    const { data, error } = await admin.schema("ichikara").rpc("verify_certificate", { p_nomor: nomor.trim() }).maybeSingle()
    if (error) throw error
    if (!data) return new Response(JSON.stringify({ certificate: null }), { headers: corsHeaders })

    let photoUrl: string | null = null
    if (data.photo_path) {
      const { data: signed, error: signError } = await admin.storage
        .from("ichikara_sertifikat_photos")
        .createSignedUrl(data.photo_path, 60)
      if (!signError) photoUrl = signed.signedUrl
    }

    return new Response(JSON.stringify({ certificate: { ...data, photo_url: photoUrl } }), { headers: corsHeaders })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: "Gagal memverifikasi sertifikat" }), { status: 500, headers: corsHeaders })
  }
})
