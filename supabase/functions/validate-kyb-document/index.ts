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

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/** Similarity ratio 0-1 based on Levenshtein */
function similarity(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function crossValidate(
  extraction: any,
  expectedFields?: { razon_social?: string; nit?: string; representante_legal?: string }
): string[] {
  const anomalies: string[] = [];
  if (!expectedFields || !extraction.fields) return anomalies;

  const fields = extraction.fields;

  // NIT: compare only first 9 digits (ignore verification digit)
  if (expectedFields.nit && fields.nit) {
    const expectedNit = expectedFields.nit.replace(/[^0-9]/g, "").substring(0, 9);
    const extractedNit = String(fields.nit).replace(/[^0-9]/g, "").substring(0, 9);
    if (expectedNit && extractedNit && expectedNit !== extractedNit) {
      anomalies.push(
        `NIT no coincide: registrado=${expectedNit}, documento=${extractedNit}`
      );
    }
  }

  // Razón social: fuzzy match with 80% similarity threshold
  if (expectedFields.razon_social && fields.razon_social) {
    const expected = normalizeText(expectedFields.razon_social);
    const extracted = normalizeText(fields.razon_social);
    if (expected && extracted) {
      const sim = similarity(expected, extracted);
      const containsMatch = expected.includes(extracted) || extracted.includes(expected);
      if (!containsMatch && sim < 0.8) {
        anomalies.push(
          `Razón social no coincide (similitud ${Math.round(sim * 100)}%): registrada="${expectedFields.razon_social}", documento="${fields.razon_social}"`
        );
      }
    }
  }

  // Representante legal: check if all words from the shorter name appear in the longer one
  if (expectedFields.representante_legal && fields.representante_legal) {
    const expected = normalizeText(expectedFields.representante_legal);
    const extracted = normalizeText(fields.representante_legal);
    if (expected && extracted) {
      const expectedWords = expectedFields.representante_legal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 1);
      const extractedWords = String(fields.representante_legal).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(w => w.length > 1);
      const shorterWords = expectedWords.length <= extractedWords.length ? expectedWords : extractedWords;
      const longerText = expectedWords.length <= extractedWords.length ? extractedWords.join(" ") : expectedWords.join(" ");
      const allWordsFound = shorterWords.every(w => longerText.includes(w));
      const sim = similarity(expected, extracted);
      const containsMatch = expected.includes(extracted) || extracted.includes(expected);
      if (!allWordsFound && !containsMatch && sim < 0.6) {
        anomalies.push(
          `Representante legal no coincide (similitud ${Math.round(sim * 100)}%): registrado="${expectedFields.representante_legal}", documento="${fields.representante_legal}"`
        );
      }
    }
  }

  return anomalies;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");

    if (!MISTRAL_API_KEY) {
      throw new Error("Missing MISTRAL_API_KEY");
    }

    const { file, mimeType, docType, expectedFields } = await req.json();

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

    const currentDate = new Date().toISOString().split("T")[0];
    console.log(`Processing ${docType} (${mimeType}, ${isImage ? "image" : "document"}), server date: ${currentDate}`);

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

    // Step 2: Field extraction + validation with Mistral Chat
    const systemPrompt = `Eres un motor de extracción documental para KYB en Colombia.
Recibes el texto OCR de un documento. Tu tarea es extraer campos estructurados y evaluar la coherencia del documento.
Este sistema se usa tanto para empresas generadoras de residuos como para empresas recolectoras.

LA FECHA ACTUAL DEL SERVIDOR ES: ${currentDate}. Usa esta fecha para cualquier validación temporal.

Responde ÚNICAMENTE en JSON válido, sin markdown ni backticks, con esta estructura:
{
  "doc_type": "rut|camara_comercio|cedula|licencia_ambiental|registro_rua_respel|plan_manejo_ambiental|otro",
  "fields": {
    "nit": "solo los 9 dígitos principales SIN dígito de verificación, o null",
    "razon_social": "string o null",
    "fecha_documento": "YYYY-MM-DD o null",
    "fecha_vencimiento": "YYYY-MM-DD o null",
    "representante_legal": "string o null",
    "numero_resolucion": "string o null",
    "autoridad_emisora": "string o null",
    "categorias_residuos": ["array de categorías autorizadas, o []"],
    "actividad_economica": "código CIIU de 2 a 4 dígitos o null",
    "vigente": true o false o null,
    "numero_documento": "número de cédula o null"
  },
  "structural_signals": ["textos clave encontrados que confirman autenticidad"],
  "anomalies": ["descripción de cada anomalía detectada"],
  "confidence": 0
}

REGLAS IMPORTANTES SOBRE CAMPOS:
- NIT: Extrae SOLO los 9 dígitos principales. El dígito de verificación (después del guión) NO debe incluirse. Ejemplo: de "900.277.945-9" extrae "900277945".
- Código CIIU (actividad_economica): Tiene entre 2 y 4 dígitos. Si encuentras un código más largo, probablemente incluye datos adicionales; extrae solo los primeros 4 dígitos.
- Fechas: Las diferencias entre "fecha de inicio de actividad" y "fecha de constitución" son normales y NO deben reportarse como anomalías.
- Nombres y razón social: Las variaciones menores en formato (mayúsculas, puntos, abreviaciones como S.A.S vs SAS vs S.A.S.) NO son anomalías.

Señales estructurales esperadas por tipo de documento (busca estos textos clave):
- rut: "Registro Único Tributario", "DIAN", "Dirección de Impuestos y Aduanas Nacionales", "Número de Identificación Tributaria"
- camara_comercio: "Certificado de existencia y representación legal", "Cámara de Comercio", "matrícula mercantil", "objeto social"
- cedula: "República de Colombia", "Cédula de Ciudadanía", "Registraduría Nacional", "NUIP"
- licencia_ambiental: "Resolución", nombre de autoridad ambiental (ANLA, CAR, Corpoboyacá, etc.), "otorga licencia ambiental"
- registro_rua_respel: "IDEAM", "RUA", "RESPEL", "Registro Único Ambiental"
- plan_manejo_ambiental: "Plan de Manejo Ambiental", "medidas de manejo", "impacto ambiental"

Reglas de evaluación:
- Si encuentras las señales estructurales esperadas para el tipo declarado, el confidence debe ser alto (70-100).
- Si el texto no contiene las señales esperadas, reporta anomalías y baja el confidence.
- Si el tipo declarado no coincide con el contenido real, indica el tipo correcto en doc_type y agrega la anomalía.
- Verifica coherencia: que el NIT tenga 9 dígitos, que las fechas sean razonables respecto a la fecha actual (${currentDate}).
- NO reportes como anomalía diferencias entre fecha de inicio de actividad y fecha de constitución.
- NO reportes como anomalía variaciones de formato en nombres o razón social.
- confidence es 0-100: qué tan seguro estás de que el documento es auténtico, legible y del tipo correcto.`;

    const maxOcrLength = 30000;
    const truncatedOcrText = ocrText.length > maxOcrLength
      ? ocrText.substring(0, maxOcrLength) + "\n\n[... texto truncado ...]"
      : ocrText;

    const chatResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tipo de documento declarado: ${docType}\n\nTexto OCR extraído:\n${truncatedOcrText}` },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!chatResponse.ok) {
      const errText = await chatResponse.text();
      console.error("Mistral Chat error:", chatResponse.status, errText);
      throw new Error(`AI analysis failed: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const rawText = chatData.choices?.[0]?.message?.content || "";

    console.log("Mistral analysis response length:", rawText.length);

    const extraction = await extractJsonFromResponse(rawText);

    // Step 3: Cross-validation against expected fields from registration
    if (expectedFields) {
      const crossAnomalies = crossValidate(extraction, expectedFields);
      if (crossAnomalies.length > 0) {
        extraction.anomalies = [...(extraction.anomalies || []), ...crossAnomalies];
        const penalty = crossAnomalies.length * 15;
        extraction.confidence = Math.max(0, (extraction.confidence || 0) - penalty);
        console.log(`Cross-validation found ${crossAnomalies.length} mismatches, confidence reduced by ${penalty}`);
      }
    }

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
