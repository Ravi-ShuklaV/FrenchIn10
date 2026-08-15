import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useLessonEngine from "../hooks/useLessonEngine";

import { getLesson } from "../services/lessonService";

import LessonHeader from "../components/lesson/LessonHeader";
import Objectives from "../components/lesson/Objectives";
import Vocabulary from "../components/lesson/Vocabulary";
import DialogueList from "../components/lesson/DialogueList";
import PracticeSection from "../components/lesson/PracticeSection";
import QuizSection from "../components/lesson/QuizSection";

function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);

  const {
    pronunciationScore,
    setPronunciationScore,

    typingScore,
    setTypingScore,

    quizScore,
    setQuizScore,

    overallScore,

    completeLesson,
  } = useLessonEngine();

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await getLesson(id);
        setLesson(data);
      } catch (error) {
        console.error(error);
      }
    }

    loadLesson();
  }, [id]);

  async function handleCompleteLesson() {
    try {
      await completeLesson(lesson.id);

      navigate("/lesson-result", {
        state: {
          pronunciationScore,
          typingScore,
          quizScore,
          overallScore,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Failed to save progress.");
    }
  }

  if (!lesson) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <LessonHeader lesson={lesson} />

      <Objectives objectives={lesson.objectives} />

      <Vocabulary vocabulary={lesson.vocabulary} />

      <DialogueList
        lessonId={lesson.id}
        dialogue={lesson.dialogue}
        onScoreChange={setPronunciationScore}
      />

      <PracticeSection
        practice={lesson.practice}
        onScoreChange={setTypingScore}
      />

      <QuizSection
        quiz={lesson.quiz}
        onScoreChange={setQuizScore}
      />

      <div className="bg-gray-100 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          Current Scores
        </h2>

        <p>🎤 Pronunciation: {pronunciationScore}%</p>
        <p>⌨️ Typing: {typingScore}%</p>
        <p>📝 Quiz: {quizScore}%</p>

        <hr className="my-4" />

        <p className="text-xl font-bold">
          Overall: {overallScore}%
        </p>
      </div>

      <div className="flex justify-center py-10">
        <button
          onClick={handleCompleteLesson}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition"
        >
          Complete Lesson
        </button>
      </div>
    </div>
  );
}

export default Lesson;