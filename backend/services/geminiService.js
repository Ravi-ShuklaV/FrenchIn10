import "dotenv/config";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =========================
// TEXT GENERATION
// =========================

export async function generateResponse(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: prompt,
  });

  return response.text;
}

// =========================
// HANDWRITING ANALYSIS
// =========================

export async function analyzeHandwriting({
  imageBase64,
  mimeType,
  expectedAnswer,
  acceptedAnswers = [],
}) {
  const prompt = `
You are evaluating a French learner's handwritten answer.

The learner was asked to write:

"${expectedAnswer}"

Accepted variants are:

${acceptedAnswers.join("\n")}

Analyze the handwriting image.

Your job:

1. Read the handwritten text.
2. Determine whether the detected text is French.
3. Determine whether the learner wrote the expected answer or an accepted variant.
4. Ignore differences in capitalization.
5. Ignore minor punctuation differences.
6. Ignore missing or different accents when the underlying French words are clearly correct.
7. Do not be overly strict about handwriting imperfections.
8. Do not invent text that cannot reasonably be read.

Return ONLY valid JSON in exactly this format:

{
  "detectedText": "string",
  "isFrench": true,
  "matchesExpected": true,
  "confidence": 0.95
}

confidence must be a number between 0 and 1.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
  });

  const text = response.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(text);
}