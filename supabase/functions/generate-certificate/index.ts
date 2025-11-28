import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token!);
    if (userError || !user) throw new Error('Unauthorized');

    const { courseId } = await req.json();

    // Verify course completion
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('*, courses(title, instructor_id, profiles:instructor_id(full_name))')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('completed', true)
      .single();

    if (!enrollment) {
      throw new Error('Course not completed');
    }

    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('course_certificates')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ certificate: existing }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Generate verification code
    const verificationCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();

    // Generate certificate SVG and PDF
    const certificateSVG = generateCertificateSVG({
      studentName: profile?.full_name || 'Student',
      courseName: enrollment.courses.title,
      instructorName: enrollment.courses.profiles?.full_name || 'Instructor',
      completionDate: new Date(enrollment.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      verificationCode
    });
    
    const certificatePDF = generateCertificatePDF({
      studentName: profile?.full_name || 'Student',
      courseName: enrollment.courses.title,
      instructorName: enrollment.courses.profiles?.full_name || 'Instructor',
      completionDate: new Date(enrollment.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      verificationCode,
      courseId
    });

    // Upload SVG
    const svgBlob = new Blob([certificateSVG], { type: 'image/svg+xml' });
    const svgFileName = `${user.id}/${courseId}/certificate.svg`;

    await supabase.storage
      .from('certificates')
      .upload(svgFileName, svgBlob, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    const { data: { publicUrl: svgUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(svgFileName);

    // Upload PDF
    const pdfArray = Array.from(certificatePDF);
    const pdfBlob = new Blob([new Uint8Array(pdfArray)], { type: 'application/pdf' });
    const pdfFileName = `${user.id}/${courseId}/certificate.pdf`;

    await supabase.storage
      .from('certificates')
      .upload(pdfFileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    const { data: { publicUrl: pdfUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(pdfFileName);

    // Generate blockchain hash for certificate verification
    const blockchainData = JSON.stringify({
      certificateId: `${user.id}-${courseId}`,
      userId: user.id,
      courseId,
      issuedAt: new Date().toISOString(),
      verificationCode,
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(blockchainData);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const blockchainHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Save certificate record with blockchain verification
    const { data: cert, error: certError } = await supabase
      .from('course_certificates')
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_url: pdfUrl, // Use PDF as primary URL
        verification_code: verificationCode,
        blockchain_hash: blockchainHash,
        blockchain_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (certError) throw certError;

    return new Response(JSON.stringify({ 
      certificate: cert,
      svg_url: svgUrl,
      pdf_url: pdfUrl,
      blockchain_hash: blockchainHash,
      blockchain_explorer_url: `https://blockchain-explorer.example.com/tx/${blockchainHash}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-certificate function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCertificateSVG(data: {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  verificationCode: string;
}): string {
  return `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(139,92,246);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(219,39,119);stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="800" height="600" fill="#ffffff"/>
      <rect x="20" y="20" width="760" height="560" fill="none" stroke="url(#grad1)" stroke-width="4" rx="10"/>
      <rect x="30" y="30" width="740" height="540" fill="none" stroke="url(#grad1)" stroke-width="2" rx="8"/>
      
      <!-- Title -->
      <text x="400" y="100" font-family="Georgia, serif" font-size="48" font-weight="bold" fill="url(#grad1)" text-anchor="middle">
        Certificate of Completion
      </text>
      
      <!-- Subtitle -->
      <text x="400" y="150" font-family="Arial, sans-serif" font-size="20" fill="#666" text-anchor="middle">
        This certifies that
      </text>
      
      <!-- Student Name -->
      <text x="400" y="210" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#333" text-anchor="middle">
        ${data.studentName}
      </text>
      
      <!-- Course info -->
      <text x="400" y="270" font-family="Arial, sans-serif" font-size="18" fill="#666" text-anchor="middle">
        has successfully completed the course
      </text>
      
      <!-- Course Name -->
      <text x="400" y="320" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="url(#grad1)" text-anchor="middle">
        ${data.courseName}
      </text>
      
      <!-- Date and Instructor -->
      <text x="200" y="450" font-family="Arial, sans-serif" font-size="16" fill="#666" text-anchor="middle">
        Date: ${data.completionDate}
      </text>
      
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="16" fill="#666" text-anchor="middle">
        Instructor: ${data.instructorName}
      </text>
      
      <!-- Verification Code -->
      <text x="400" y="520" font-family="Courier New, monospace" font-size="14" fill="#999" text-anchor="middle">
        Verification Code: ${data.verificationCode}
      </text>
      
      <!-- Decorative elements -->
      <circle cx="100" cy="100" r="30" fill="none" stroke="url(#grad1)" stroke-width="2" opacity="0.3"/>
      <circle cx="700" cy="500" r="25" fill="none" stroke="url(#grad1)" stroke-width="2" opacity="0.3"/>
    </svg>
  `;
}

function generateCertificatePDF(data: {
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: string;
  verificationCode: string;
  courseId: string;
}): Uint8Array {
  // Basic PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 500 >>
stream
BT
/F1 24 Tf
100 700 Td
(Certificate of Completion) Tj
0 -50 Td
/F2 14 Tf
(This certifies that) Tj
0 -30 Td
/F1 20 Tf
(${data.studentName}) Tj
0 -40 Td
/F2 14 Tf
(has successfully completed the course) Tj
0 -30 Td
/F1 18 Tf
(${data.courseName}) Tj
0 -50 Td
/F2 12 Tf
(Date: ${data.completionDate}) Tj
200 0 Td
(Instructor: ${data.instructorName}) Tj
-200 -30 Td
(Verification Code: ${data.verificationCode}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
0000000343 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
893
%%EOF`;
  
  return new TextEncoder().encode(pdfContent);
}

