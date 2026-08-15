import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lessonsFolder = path.join(__dirname, "../lessons");

export function getLessons(req, res) {
  try {
    const files = fs
      .readdirSync(lessonsFolder)
      .filter((file) => file.endsWith(".json"));

    const lessons = files.map((file) => {
      const lesson = JSON.parse(
        fs.readFileSync(
          path.join(lessonsFolder, file),
          "utf8"
        )
      );

      return {
        id: lesson.id,
        title: lesson.title,
        scenario: lesson.scenario,
        difficulty: lesson.difficulty,
      };
    });

    lessons.sort((a, b) => a.id - b.id);

    res.json(lessons);
  } catch (error) {
    console.error("GET LESSONS ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
}

export function getLesson(req, res) {
  try {
    const lessonPath = path.join(
      lessonsFolder,
      `lesson${req.params.id}.json`
    );

    if (!fs.existsSync(lessonPath)) {
      return res.status(404).json({
        message: "Lesson not found",
      });
    }

    const lesson = JSON.parse(
      fs.readFileSync(lessonPath, "utf8")
    );

    res.json(lesson);
  } catch (error) {
    console.error("GET LESSON ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
}