import { useState } from "react";
import { saveProgress } from "../services/progressService";

export default function useLessonEngine() {
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [typingScore, setTypingScore] = useState(0);
  const [quizScore, setQuizScore] = useState(0);

  const overallScore = Math.round(
    (pronunciationScore +
      typingScore +
      quizScore) / 3
  );

  async function completeLesson(lessonId) {
    await saveProgress({
      lessonId,
      pronunciationScore,
      typingScore,
      quizScore,
      overallScore,
    });
  }

  return {
    pronunciationScore,
    setPronunciationScore,

    typingScore,
    setTypingScore,

    quizScore,
    setQuizScore,

    overallScore,

    completeLesson,
  };
}