import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getLesson } from "../services/lessonService";
import useSessionStore from "../store/sessionStore";
import VocabularySection from "../components/session/VocabularySection";
import GrammarSection from "../components/session/GrammarSection";
import SentenceRecallSection from "../components/session/SentenceRecallSection";
import HandwritingSection from "../components/session/HandwritingSection";
import SpeakingSection from "../components/session/SpeakingSection";
import MissionSection from "../components/session/MissionSection";

function LessonSession() {
  const { lessonId } = useParams();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);

  const startSession = useSessionStore((state) => state.startSession);

  const currentSectionIndex = useSessionStore(
    (state) => state.currentSectionIndex,
  );

  useEffect(() => {
    async function loadLesson() {
      try {
        const data = await getLesson(lessonId);
        console.log(
          "GRAMMAR QUESTIONS:",
          data.concepts
            ?.filter((concept) => concept.type === "grammar")
            .map((concept) => ({
              conceptId: concept.conceptId,
              questions: concept.questions,
            })),
        );
        setLesson(data);

        startSession(Number(lessonId), data.session.sections);
      } catch (error) {
        console.error("Failed to load lesson:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [lessonId, startSession]);

  useEffect(() => {
    if (!lesson) return;

    const section = lesson.session.sections[currentSectionIndex];

    if (!section) return;

    setTimeLeft(section.timeLimitSeconds);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          if (currentSectionIndex < lesson.session.sections.length - 1) {
            setTimeout(() => {
              useSessionStore.getState().nextSection();
            }, 500);
          }

          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lesson, currentSectionIndex]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Lesson could not be loaded.</p>
      </div>
    );
  }

  const currentSection = lesson.session.sections[currentSectionIndex];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <p className="text-sm text-gray-500">Lesson {lesson.id}</p>

        <h1 className="text-3xl font-bold text-slate-800">{lesson.title}</h1>
        <button
          type="button"
          onClick={() => {
            useSessionStore.getState().nextSection();
          }}
          className="fixed bottom-5 right-5 z-50 rounded-xl bg-gray-800 px-4 py-2 text-sm font-semibold text-white opacity-70 hover:opacity-100"
        >
          Skip Section →
        </button>
        <p className="mt-2 text-gray-500">{lesson.scenario}</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-8">
        <p className="text-sm text-gray-500">
          Section {currentSectionIndex + 1} of {lesson.session.sections.length}
        </p>

        <h2 className="text-3xl font-bold mt-2 text-slate-800">
          {currentSection.label}
        </h2>

        <div className="mt-6">
          <p className="text-sm text-gray-500">Time remaining</p>

          <p className="text-4xl font-bold text-emerald-600">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </p>
        </div>

        <div className="mt-8">
          {currentSection.id === "vocabulary" && (
            <VocabularySection concepts={lesson.concepts} />
          )}

          {currentSection.id === "grammar" && (
            <GrammarSection concepts={lesson.concepts} />
          )}
          {currentSection.id === "sentenceRecall" && (
            <SentenceRecallSection concepts={lesson.concepts} />
          )}
          {currentSection.id === "speaking" && (
            <SpeakingSection concepts={lesson.concepts} />
          )}
          
          {currentSection.id === "mission" && (
            
            <MissionSection mission={lesson.mission} />
          )}
        </div>
      </div>
    </div>
  );
}

export default LessonSession;
