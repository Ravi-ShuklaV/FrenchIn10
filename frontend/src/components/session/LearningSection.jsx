import { useEffect, useRef, useState } from "react";
import useSessionStore from "../../store/sessionStore";
import SpeakerButton from "../common/SpeakerButton";
function LearningSection({
  title,
  items = [],
  sectionType = "learning",
  onComplete,
}) {
  const addPerformance = useSessionStore(
    (state) => state.addPerformance
  );

  const [currentItemIndex, setCurrentItemIndex] =
    useState(0);

  const [mode, setMode] = useState("learn");

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [feedback, setFeedback] = useState(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] =
    useState(0);

  // Reference to the actual learning/question content
  const contentRef = useRef(null);

  const currentItem =
    items[currentItemIndex];

  const questions =
    currentItem?.questions || [];

  const currentQuestion =
    questions[currentQuestionIndex];

  // =========================
  // SCROLL TO CURRENT CONTENT
  // =========================

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    contentRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [
    currentItemIndex,
    currentQuestionIndex,
    mode,
  ]);

  // =========================
  // RESET WHEN ITEM CHANGES
  // =========================

  useEffect(() => {
    setMode("learn");
    setSelectedAnswer(null);
    setFeedback(null);
    setCurrentQuestionIndex(0);
  }, [currentItemIndex]);

  // =========================
  // NO ITEMS
  // =========================

  if (!items.length) {
    return (
      <div
        ref={contentRef}
        className="text-center py-12"
      >
        <h2 className="text-2xl font-bold text-slate-800">
          {title}
        </h2>

        <p className="text-gray-500 mt-2">
          Nothing to learn in this section yet.
        </p>

        <button
          type="button"
          onClick={onComplete}
          className="mt-6 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          Continue →
        </button>
      </div>
    );
  }

  if (!currentItem) {
    return null;
  }

  // =========================
  // LEARN → QUESTION
  // =========================

  function handleGotIt() {
    setMode("question");
    setSelectedAnswer(null);
    setFeedback(null);
    setCurrentQuestionIndex(0);
  }

  // =========================
  // MOVE TO NEXT
  // =========================

  function moveToNext() {
    // More questions for current concept
    if (
      currentQuestionIndex <
      questions.length - 1
    ) {
      setCurrentQuestionIndex(
        (prev) => prev + 1
      );

      setSelectedAnswer(null);
      setFeedback(null);

      return;
    }

    // More concepts/items
    if (
      currentItemIndex <
      items.length - 1
    ) {
      setCurrentItemIndex(
        (prev) => prev + 1
      );

      return;
    }

    // Finished entire section
    onComplete();
  }

  // =========================
  // ANSWER
  // =========================

  function handleAnswer(option) {
    if (feedback) {
      return;
    }

    setSelectedAnswer(option);

    const correct =
      option ===
      currentQuestion.correctAnswer;

    addPerformance({
  questionId: `${sectionType}_${currentItem.conceptId}_${currentQuestionIndex}`,

  conceptId: currentItem.conceptId,

  french: currentItem.french || "",
  english: currentItem.english || "",
  type: currentItem.type || sectionType,

  section: sectionType,

  attempts: 1,

  correct,

  score: correct ? 1 : 0,

  responseTime: 0,

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

      // Automatically move to next question
      setTimeout(() => {
        moveToNext();
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

  const progress =
    ((currentItemIndex + 1) /
      items.length) *
    100;

  // =========================
  // LEARNING CARD
  // =========================

  if (mode === "learn") {
    return (
      <div
        ref={contentRef}
        className="max-w-3xl mx-auto scroll-mt-6"
      >
        {/* Heading */}

        <div className="text-center mb-8">
          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Learn
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            {title}
          </h2>

          <p className="text-gray-500 mt-2">
            Learn this first, then we'll check your
            understanding.
          </p>
        </div>

        {/* Progress */}

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>
              {currentItemIndex + 1} /{" "}
              {items.length}
            </span>

            <span>
              Learning
            </span>
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

        {/* Learning Card */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="text-center">

            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              {currentItem.type ||
                sectionType}
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
  <h3 className="text-4xl font-bold text-slate-800">
    {currentItem.french || currentItem.title}
  </h3>

  <SpeakerButton
    text={currentItem.french || currentItem.title}
  />
</div>

            {currentItem.english && (
              <p className="text-xl text-gray-500 mt-3">
                {currentItem.english}
              </p>
            )}

            {/* Explanation */}

            {currentItem.explanation && (
              <div className="mt-7 bg-gray-50 rounded-xl p-5 text-left">

                <p className="text-sm font-semibold text-slate-700">
                  Remember
                </p>

                <p className="text-gray-600 mt-2 leading-relaxed">
                  {currentItem.explanation}
                </p>

              </div>
            )}

            {/* Examples */}

            {currentItem.examples?.length > 0 && (
              <div className="mt-5 text-left">

                <p className="text-sm font-semibold text-slate-700 mb-3">
                  Example
                </p>

                <div className="space-y-2">

                  {currentItem.examples.map(
                    (example, index) => (
                      <div
                        key={index}
                        className="bg-emerald-50 rounded-xl p-4"
                      >
                        <p className="font-semibold text-slate-800">
                          {example.french}
                        </p>

                        {example.english && (
                          <p className="text-sm text-gray-500 mt-1">
                            {example.english}
                          </p>
                        )}
                      </div>
                    )
                  )}

                </div>
              </div>
            )}

            {/* Got It */}

            <button
              type="button"
              onClick={handleGotIt}
              className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Got it →
            </button>

          </div>
        </div>
      </div>
    );
  }

  // =========================
  // NO QUESTION
  // =========================

  if (!currentQuestion) {
    return (
      <div
        ref={contentRef}
        className="text-center py-12 scroll-mt-6"
      >
        <h2 className="text-2xl font-bold text-slate-800">
          {currentItem.french}
        </h2>

        <p className="text-gray-500 mt-2">
          No question configured for this item.
        </p>

        <button
          type="button"
          onClick={moveToNext}
          className="mt-5 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Continue →
        </button>
      </div>
    );
  }

  // =========================
  // QUESTION UI
  // =========================

  return (
    <div
      ref={contentRef}
      className="max-w-3xl mx-auto scroll-mt-6"
    >
      {/* Heading */}

      <div className="text-center mb-8">
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Quick Check
        </p>

        <h2 className="text-3xl font-bold text-slate-800 mt-2">
          {title}
        </h2>

        <p className="text-gray-500 mt-2">
          Let's see if you remember it.
        </p>
      </div>

      {/* Progress */}

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">

          <span>
            {currentItemIndex + 1} /{" "}
            {items.length}
          </span>

          <span>
            Check
          </span>

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

      {/* Question */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

        <p className="text-xl font-semibold text-slate-800 text-center">
          {currentQuestion.question}
        </p>

        {/* Options */}

        <div className="mt-8 space-y-3">

          {currentQuestion.options.map(
            (option) => {

              const isSelected =
                selectedAnswer === option;

              const isCorrect =
                feedback?.type ===
                  "correct" &&
                option ===
                  currentQuestion.correctAnswer;

              const isWrong =
                feedback?.type ===
                  "wrong" &&
                isSelected;

              let classes =
                "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50";

              if (isSelected) {
                classes =
                  "border-emerald-500 bg-emerald-50";
              }

              if (isCorrect) {
                classes =
                  "border-emerald-500 bg-emerald-100";
              }

              if (isWrong) {
                classes =
                  "border-red-400 bg-red-50";
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    handleAnswer(option)
                  }
                  disabled={!!feedback}
                  className={`w-full text-left border-2 rounded-xl px-5 py-4 font-medium transition ${classes}`}
                >
                  {option}
                </button>
              );
            }
          )}

        </div>

        {/* Feedback */}

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
              <p className="text-sm font-normal mt-1">
                The correct answer is:{" "}
                <strong>
                  {currentQuestion.correctAnswer}
                </strong>
              </p>
            )}
          </div>
        )}

        {/* Wrong Answer */}

        {feedback?.type === "wrong" && (
          <button
            type="button"
            onClick={() => {
              setSelectedAnswer(null);
              setFeedback(null);
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

export default LearningSection;