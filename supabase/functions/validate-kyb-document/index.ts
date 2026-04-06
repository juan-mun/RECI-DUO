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
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!MISTRAL_API_KEY || !ANTHROPIC_API_KEY) {
      throw new Error("Missing API keys");
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

    // Step 2: Field extraction + validation with Claude
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

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Doc type: ${docType}\n\nOCR text:\n${ocrText}` },
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude error:", claudeResponse.status, errText);
      throw new Error(`Claude failed: ${claudeResponse.status}`);
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData.content?.[0]?.text || "";

    console.log("Claude raw response length:", rawText.length);

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
