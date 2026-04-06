import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function extractJsonFromResponse(response: string): Promise<any> {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.search(/[\{\[]/);
  const jsonEnd = cleaned.lastIndexOf(
    jsonStart !== -1 && cleaned[jsonStart] === "[" ? "]" : "}"
  );

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!MISTRAL_API_KEY) {
      throw new Error("Missing MISTRAL_API_KEY");
    }
    if (!LOVABLE_API_KEY) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const { file, mimeType, docType } = await req.json();

    if (!file || !mimeType || !docType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: file, mimeType, docType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: OCR with Mistral
    const isImage = mimeType.startsWith("image/");
    const documentPayload = isImage
      ? { type: "image_url", image_url: `data:${mimeType};base64,${file}` }
      : { type: "document_url", document_url: `data:${mimeType};base64,${file}` };

    console.log(`Processing ${docType} (${mimeType}, ${isImage ? "image" : "document"})`);

    const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: documentPayload,
      }),
    });

    if (!ocrResponse.ok) {
      const errText = await ocrResponse.text();
      console.error("Mistral OCR error:", ocrResponse.status, errText);
      throw new Error(`OCR failed: ${ocrResponse.status}`);
    }

    const ocrData = await ocrResponse.json();
    const ocrText = (ocrData.pages || []).map((p: any) => p.markdown).join("\n\n");

    if (!ocrText || ocrText.trim().length < 10) {
      return new Response(
        JSON.stringify({
          extraction: {
            doc_type: docType,
            fields: {},
            structural_signals: [],
            anomalies: ["No se pudo extraer texto del documento"],
            confidence: 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OCR extracted ${ocrText.length} chars`);

    // Step 2: Field extraction + validation with Lovable AI (Gemini)
    const systemPrompt = `Eres un motor de extracción documental para KYB en Colombia, especializado en empresas recolectoras de residuos.
Recibes texto OCR de un documento. Extrae campos y evalúa autenticidad.
Responde ÚNICAMENTE en JSON válido, sin markdown ni backticks:
{
  "doc_type": "licencia_ambiental|rut|camara_comercio|registro_rua_respel|plan_manejo_ambiental|cedula|otro",
  "fields": {
    "nit": "solo dígitos sin puntos ni dígito de verificación, o null",
    "razon_social": "string o null",
    "fecha_documento": "YYYY-MM-DD o null",
    "fecha_vencimiento": "YYYY-MM-DD o null",
    "representante_legal": "string o null",
    "numero_resolucion": "string o null (licencia_ambiental)",
    "autoridad_ambiental": "string o null (licencia_ambiental)",
    "categorias_residuos": ["array de categorías autorizadas, o []"],
    "actividad_economica": "código CIIU o null"
  },
  "structural_signals": ["textos clave encontrados que confirman autenticidad"],
  "anomalies": ["descripción de cada anomalía detectada"],
  "confidence": 0
}
Señales estructurales esperadas por tipo:
- licencia_ambiental: "Resolución", nombre de autoridad ambiental (ANLA, CAR, etc.), "otorga licencia ambiental"
- rut: "Registro Único Tributario", "DIAN", "Dirección de Impuestos"
- camara_comercio: "Certificado de existencia y representación legal", nombre de Cámara de Comercio
- registro_rua_respel: "IDEAM", "RUA", "RESPEL", "registro único ambiental"
- plan_manejo_ambiental: "Plan de Manejo Ambiental", "medidas de manejo", "impacto ambiental"
confidence es 0-100: qué tan seguro estás de que el documento es auténtico y legible.`;

    // Truncate OCR text if too long to avoid token limits
    const maxOcrLength = 30000;
    const truncatedOcrText = ocrText.length > maxOcrLength 
      ? ocrText.substring(0, maxOcrLength) + "\n\n[... texto truncado ...]"
      : ocrText;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Doc type: ${docType}\n\nOCR text:\n${truncatedOcrText}` },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    console.log("AI raw response length:", rawText.length);

    const extraction = await extractJsonFromResponse(rawText);

    return new Response(JSON.stringify({ extraction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-kyb-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
