import { useEffect, useRef, useState } from "react";
import useSessionStore from "../../store/sessionStore";
import { normalize } from "../../utils/textUtils";
function SentenceRecallSection({ practice = [], onComplete }) {
  const addPerformance = useSessionStore((state) => state.addPerformance);

  const contentRef = useRef(null);

  const [typedAnswer, setTypedAnswer] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [feedback, setFeedback] = useState(null);

  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  // =========================
  // NORMALIZE PRACTICE DATA
  // =========================

  /*
   * Your current lesson JSON has:
   *
   * "practice": [
   *   {
   *     "question": "...",
   *     "answer": "..."
   *   }
   * ]
   *
   * Later we can move to:
   *
   * "practice": {
   *   "sentenceRecall": [...]
   * }
   *
   * This component supports both.
   */

  let questions = [];

  if (Array.isArray(practice)) {
    questions = practice;
  } else if (practice && Array.isArray(practice.sentenceRecall)) {
    questions = practice.sentenceRecall;
  }

  const currentQuestion = questions[currentIndex];

  // =========================
  // RESET QUESTION
  // =========================

  useEffect(() => {
    setSelectedAnswer(null);
    setFeedback(null);
    setTypedAnswer("");
    setQuestionStartedAt(Date.now());

    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentIndex]);

  // =========================
  // NO QUESTIONS
  // =========================

  if (!questions.length) {
    return (
      <div ref={contentRef} className="max-w-3xl mx-auto text-center py-12">
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Sentence Recall
        </p>

        <h2 className="text-3xl font-bold text-slate-800 mt-2">
          Nothing to practice yet
        </h2>

        <p className="text-gray-500 mt-3">
          This lesson does not have any sentence recall exercises configured
          yet.
        </p>

        <button
          type="button"
          onClick={onComplete}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl"
        >
          Continue →
        </button>
      </div>
    );
  }

  // =========================
  // CURRENT QUESTION
  // =========================

  if (!currentQuestion) {
    return null;
  }

  // =========================
  // GET QUESTION DATA
  // =========================

  const questionText = currentQuestion.question || currentQuestion.prompt || "";

  const options = currentQuestion.options || [];

  const correctAnswer =
    currentQuestion.correctAnswer || currentQuestion.answer || "";

  const conceptId =
  currentQuestion.conceptId ||
  currentQuestion.targetConcepts?.[0] ||
  null;

  // =========================
  // SUBMIT
  // =========================

  function handleAnswer(option) {
    if (feedback) {
      return;
    }

    setSelectedAnswer(option);

   const correct =
  normalize(option) === normalize(correctAnswer);

    const responseTime = Math.round((Date.now() - questionStartedAt) / 1000);

    // =========================
    // RECORD PERFORMANCE
    // =========================

   addPerformance({
  questionId: `sentenceRecall_${conceptId}_${currentIndex}`,

  conceptId,

  french: correctAnswer,
  english: questionText,
  type: "phrase",

  section: "sentenceRecall",

  attempts: 1,

  correct,

  score: correct ? 1 : 0,

  responseTime,

  hintsUsed: 0,

  isReinforcement: false,
});

    // =========================
    // CORRECT
    // =========================

    if (correct) {
      setFeedback({
        type: "correct",
        message: "Correct! 🎉",
      });

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          onComplete();
        }
      }, 600);

      return;
    }

    // =========================
    // WRONG
    // =========================

    setFeedback({
      type: "wrong",
      message: "Not quite.",
    });
  }

  // =========================
  // PROGRESS
  // =========================

  const progress = ((currentIndex + 1) / questions.length) * 100;

  // =========================
  // UI
  // =========================

  return (
    <div ref={contentRef} className="max-w-3xl mx-auto scroll-mt-6">
      {/* =========================
          HEADER
      ========================= */}

      <div className="text-center mb-8">
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Practice
        </p>

        <h2 className="text-3xl font-bold text-slate-800 mt-2">
          Sentence Recall
        </h2>

        <p className="text-gray-500 mt-2">Use what you just learned.</p>
      </div>

      {/* =========================
          PROGRESS
      ========================= */}

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Question {currentIndex + 1} / {questions.length}
          </span>

          <span>Practice</span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* =========================
          QUESTION CARD
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <p className="text-xl font-semibold text-slate-800 text-center">
          {questionText}
        </p>

        {/* =========================
            OPTIONS
        ========================= */}

        {options.length > 0 ? (
          <div className="mt-8 space-y-3">
            {options.map((option) => {
              const isSelected = selectedAnswer === option;

              const isCorrect =
                feedback?.type === "correct" && option === correctAnswer;

              const isWrong = feedback?.type === "wrong" && isSelected;

              let classes =
                "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50";

              if (isSelected) {
                classes = "border-emerald-500 bg-emerald-50";
              }

              if (isCorrect) {
                classes = "border-emerald-500 bg-emerald-100";
              }

              if (isWrong) {
                classes = "border-red-400 bg-red-50";
              }

              return (
                <button
                  key={option}
                  type="button"
                  disabled={!!feedback}
                  onClick={() => handleAnswer(option)}
                  className={`w-full text-left border-2 rounded-xl px-5 py-4 font-medium transition ${classes}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-8">
            <p className="text-sm text-gray-500 mb-2">Your answer</p>

            <input
              type="text"
              value={typedAnswer}
              disabled={!!feedback}
              onChange={(event) => {
                setTypedAnswer(event.target.value);
              }}
              placeholder="Type your answer..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(event) => {
                if (event.key !== "Enter" || feedback || !typedAnswer.trim()) {
                  return;
                }

                handleAnswer(typedAnswer.trim());
              }}
            />
          </div>
        )}

        {/* =========================
            FEEDBACK
        ========================= */}

        {feedback && (
          <div
            className={`mt-6 rounded-xl p-4 text-center font-semibold ${
              feedback.type === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}

            {feedback.type === "wrong" && (
              <>
                <p className="text-sm font-normal mt-1">Correct answer:</p>

                <p className="font-bold mt-1">{correctAnswer}</p>
              </>
            )}
          </div>
        )}

        {/* =========================
            TRY AGAIN
        ========================= */}

        {feedback?.type === "wrong" && (
          <button
            type="button"
            onClick={() => {
              setSelectedAnswer(null);
              setFeedback(null);
              setTypedAnswer("");
              setQuestionStartedAt(Date.now());
            }}
            className="w-full mt-5 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default SentenceRecallSection;
