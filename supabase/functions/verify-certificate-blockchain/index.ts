import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { certificateId, action } = await req.json();
    console.log("Certificate blockchain action:", { certificateId, action });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch certificate details
    const { data: certificate, error: certError } = await supabase
      .from("course_certificates")
      .select("*, courses(title), profiles(full_name)")
      .eq("id", certificateId)
      .single();

    if (certError || !certificate) {
      throw new Error("Certificate not found");
    }

    if (action === "register") {
      // Generate blockchain hash (simplified simulation)
      const dataToHash = JSON.stringify({
        certificateId: certificate.id,
        userId: certificate.user_id,
        courseId: certificate.course_id,
        issuedAt: certificate.issued_at,
        verificationCode: certificate.verification_code,
      });

      // In production, this would interact with a real blockchain
      // For now, we simulate by creating a deterministic hash
      const encoder = new TextEncoder();
      const data = encoder.encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const blockchainHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Update certificate with blockchain hash
      const { error: updateError } = await supabase
        .from("course_certificates")
        .update({ 
          blockchain_hash: blockchainHash,
          blockchain_timestamp: new Date().toISOString(),
        })
        .eq("id", certificateId);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          blockchainHash,
          message: "Certificate registered on blockchain",
          explorerUrl: `https://blockchain-explorer.example.com/tx/${blockchainHash}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "verify") {
      // Verify certificate authenticity
      const { data: storedCert } = await supabase
        .from("course_certificates")
        .select("blockchain_hash, blockchain_timestamp")
        .eq("id", certificateId)
        .single();

      if (!storedCert?.blockchain_hash) {
        return new Response(
          JSON.stringify({
            verified: false,
            message: "Certificate not registered on blockchain",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          verified: true,
          blockchainHash: storedCert.blockchain_hash,
          timestamp: storedCert.blockchain_timestamp,
          message: "Certificate authenticity verified",
          certificate: {
            id: certificate.id,
            studentName: certificate.profiles?.full_name,
            courseName: certificate.courses?.title,
            issuedAt: certificate.issued_at,
            verificationCode: certificate.verification_code,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Error in verify-certificate-blockchain:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
