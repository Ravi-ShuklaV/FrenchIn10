import { useEffect, useRef, useState } from "react";
import useSessionStore from "../../store/sessionStore";
import { normalize } from "../../utils/textUtils";

function SentenceRecallSection({ practice = [], onComplete }) {
  const addPerformance = useSessionStore(
    (state) => state.addPerformance
  );

  const contentRef = useRef(null);

  const [typedAnswer, setTypedAnswer] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] =
    useState(Date.now());

  // ==========================================
  // GET SENTENCE RECALL QUESTIONS
  // ==========================================

  const questions = Array.isArray(practice)
    ? practice
    : Array.isArray(practice?.sentenceRecall)
      ? practice.sentenceRecall
      : [];

  const currentQuestion = questions[currentIndex];

  // ==========================================
  // RESET WHEN QUESTION CHANGES
  // ==========================================

  useEffect(() => {
    setTypedAnswer("");
    setFeedback(null);
    setQuestionStartedAt(Date.now());

    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentIndex]);

  // ==========================================
  // NO QUESTIONS
  // ==========================================

  if (!questions.length) {
    return (
      <div
        ref={contentRef}
        className="max-w-3xl mx-auto text-center py-12"
      >
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Sentence Recall
        </p>

        <h2 className="text-3xl font-bold text-slate-800 mt-2">
          Nothing to practice yet
        </h2>

        <p className="text-gray-500 mt-3">
          This lesson does not have any sentence recall
          exercises configured yet.
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

  if (!currentQuestion) {
    return null;
  }

  // ==========================================
  // NEW JSON STRUCTURE
  //
  // prompt
  // expectedAnswer
  // acceptedAnswers[]
  // targetConcepts[]
  // ==========================================

  const questionText =
    currentQuestion.prompt ||
    currentQuestion.question ||
    "";

  const correctAnswer =
    currentQuestion.expectedAnswer ||
    currentQuestion.correctAnswer ||
    currentQuestion.answer ||
    "";

  const acceptedAnswers =
    Array.isArray(currentQuestion.acceptedAnswers) &&
    currentQuestion.acceptedAnswers.length > 0
      ? currentQuestion.acceptedAnswers
      : [correctAnswer];

  const conceptId =
    currentQuestion.conceptId ||
    currentQuestion.targetConcepts?.[0] ||
    null;

  // ==========================================
  // CHECK ANSWER
  // ==========================================

  function handleSubmit() {
    if (!typedAnswer.trim() || feedback) {
      return;
    }

    const userAnswer = normalize(typedAnswer);

    const correct = acceptedAnswers.some(
      (acceptedAnswer) =>
        normalize(acceptedAnswer) === userAnswer
    );

    const responseTime = Math.round(
      (Date.now() - questionStartedAt) / 1000
    );

    console.log("📝 SENTENCE RECALL");
    console.log("Question:", questionText);
    console.log("User answer:", typedAnswer);
    console.log("Expected:", correctAnswer);
    console.log("Accepted:", acceptedAnswers);
    console.log("Correct:", correct);

    // ==========================================
    // RECORD PERFORMANCE
    // ==========================================

    addPerformance({
      questionId:
        currentQuestion.id ||
        `sentenceRecall_${currentIndex}`,

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

    // ==========================================
    // CORRECT
    // ==========================================

    if (correct) {
      setFeedback({
        type: "correct",
        message: "Correct! 🎉",
      });

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(
            (previous) => previous + 1
          );
        } else {
          onComplete();
        }
      }, 700);

      return;
    }

    // ==========================================
    // WRONG
    // ==========================================

    setFeedback({
      type: "wrong",
      message: "Not quite.",
    });
  }

  // ==========================================
  // PROGRESS
  // ==========================================

  const progress =
    ((currentIndex + 1) / questions.length) * 100;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      ref={contentRef}
      className="max-w-3xl mx-auto scroll-mt-6"
    >
      {/* HEADER */}

      <div className="text-center mb-8">
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Practice
        </p>

        <h2 className="text-3xl font-bold text-slate-800 mt-2">
          Sentence Recall
        </h2>

        <p className="text-gray-500 mt-2">
          Use what you just learned.
        </p>
      </div>

      {/* PROGRESS */}

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Question {currentIndex + 1} /{" "}
            {questions.length}
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

      {/* QUESTION */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <p className="text-xl font-semibold text-slate-800 text-center">
          {questionText}
        </p>

        {/* INPUT */}

        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-2">
            Your answer
          </p>

          <input
            type="text"
            value={typedAnswer}
            disabled={!!feedback}
            onChange={(event) =>
              setTypedAnswer(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                typedAnswer.trim() &&
                !feedback
              ) {
                handleSubmit();
              }
            }}
            placeholder="Type your answer..."
            autoFocus
            className={`w-full border rounded-xl px-4 py-3 outline-none transition ${
              feedback?.type === "correct"
                ? "border-emerald-500 focus:ring-2 focus:ring-emerald-300"
                : feedback?.type === "wrong"
                  ? "border-red-400 focus:ring-2 focus:ring-red-300"
                  : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
            }`}
          />
        </div>

        {/* CHECK BUTTON */}

        {!feedback && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!typedAnswer.trim()}
            className="w-full mt-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            Check Answer
          </button>
        )}

        {/* FEEDBACK */}

        {feedback && (
          <div
            className={`mt-6 rounded-xl p-4 text-center ${
              feedback.type === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <p className="font-semibold">
              {feedback.message}
            </p>

            {feedback.type === "wrong" && (
              <>
                <p className="text-sm font-normal mt-2">
                  Correct answer:
                </p>

                <p className="font-bold mt-1">
                  {correctAnswer}
                </p>
              </>
            )}
          </div>
        )}

        {/* TRY AGAIN */}

        {feedback?.type === "wrong" && (
          <button
            type="button"
            onClick={() => {
              setTypedAnswer("");
              setFeedback(null);
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