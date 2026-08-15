import fs from "fs/promises";
import path from "path";

import {
  generateResponse,
  analyzeHandwriting,
} from "../services/geminiService.js";
export async function chatWithAI(req, res) {
  try {
    const { lessonId, messages } = req.body;

    const lessonPath = path.join(
      process.cwd(),
      "lessons",
      `lesson${lessonId}.json`
    );

    const lesson = JSON.parse(
      await fs.readFile(lessonPath, "utf8")
    );

    if (!lesson) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const conversation = messages
      .map((msg) =>
        `${msg.sender === "user" ? "Student" : "Assistant"}: ${msg.text}`
      )
      .join("\n");

    const prompt = `
You are a ${lesson.ai.role}.

Lesson Title:
${lesson.title}

Scenario:
${lesson.scenario}

Objectives:
${lesson.objectives.join("\n")}

Vocabulary:
${lesson.vocabulary
  .map((v) => `${v.french} = ${v.english}`)
  .join("\n")}

Dialogue:
${lesson.dialogue
  .map((d) => `${d.speaker}: ${d.french}`)
  .join("\n")}

Rules:
- You are roleplaying as the café employee.
- Continue the conversation naturally.
- Do NOT restart the conversation.
- Remember everything that has already been said.
- Respond only to the student's latest message.
- Use only beginner French.
- Keep replies under ${lesson.ai.maxWords} words.
- Stay inside the ${lesson.scenario} scenario.
- Never explain grammar.
- Never translate unless the student asks.
- Ask simple follow-up questions when appropriate.

Conversation:
${conversation}

Reply as the assistant only.
`;

    console.log("========== PROMPT ==========");
    console.log(prompt);
    console.log("============================");

    const reply = await generateResponse(prompt);

    res.json({ reply });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
}

// =========================
// HANDWRITING ANALYSIS
// =========================

export async function analyzeHandwritingController(
  req,
  res
) {
  try {
    const {
      expectedAnswer,
      acceptedAnswers = [],
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Handwriting image is required.",
      });
    }

    if (!expectedAnswer) {
      return res.status(400).json({
        message: "Expected answer is required.",
      });
    }

    const result = await analyzeHandwriting({
      imageBase64:
        req.file.buffer.toString("base64"),

      mimeType:
        req.file.mimetype,

      expectedAnswer,

      acceptedAnswers,
    });

    res.json(result);
  } catch (error) {
    console.error(
      "Handwriting analysis error:",
      error
    );

    res.status(500).json({
      message:
        error.message ||
        "Failed to analyze handwriting.",
    });
  }
}