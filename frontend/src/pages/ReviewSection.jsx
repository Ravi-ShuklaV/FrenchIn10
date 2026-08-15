import { useState } from "react";
import api from "../services/api";

function ReviewSection({ reviews, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentReview = reviews?.[currentIndex];

  if (!currentReview) {
    return null;
  }

  function normalizeText(text) {
    return String(text)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,!?;:'"()-–—]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function handleSubmit() {
    if (
      !answer.trim() ||
      submitting ||
      !currentReview ||
      feedback
    ) {
      return;
    }

    const correct =
      normalizeText(answer) ===
      normalizeText(currentReview.french);

    try {
      setSubmitting(true);

      const response = await api.post(
        "/review",
        {
          conceptId:
            currentReview.conceptId,

          lessonId:
            currentReview.lessonId,

          french:
            currentReview.french,

          english:
            currentReview.english,

          type:
            currentReview.type ||
            "vocabulary",

          correct,
        }
      );

      console.log(
        "✅ REVIEW SAVED:",
        response.data
      );

      // ======================================
      // WRONG
      // ======================================

      if (!correct) {
        setFeedback({
          type: "wrong",
          message:
            `Not quite. The answer is "${currentReview.french}".`,
        });

        setSubmitting(false);
        return;
      }

      // ======================================
      // CORRECT
      //
      // Backend has deleted the review.
      // ======================================

      setFeedback({
        type: "correct",
        message: "Correct! 🎉",
      });

      setTimeout(() => {
        const nextIndex =
          currentIndex + 1;

        if (
          nextIndex >=
          reviews.length
        ) {
          setSubmitting(false);
          onComplete();
          return;
        }

        setCurrentIndex(nextIndex);
        setAnswer("");
        setFeedback(null);
        setSubmitting(false);
      }, 700);
    } catch (error) {
      console.error(
        "❌ FAILED TO SAVE REVIEW:",
        error.response?.data ||
          error.message
      );

      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to save review.",
      });

      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">

      <div className="text-center mb-6">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
          Priority Review
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mt-2">
          Let's review this one
        </h2>

        <p className="text-sm text-gray-500 mt-2">
          Practice a concept you struggled with.
        </p>
      </div>

      <div className="flex items-center justify-between text-sm mb-3">
        <span className="text-gray-500">
          Review {currentIndex + 1} of{" "}
          {reviews.length}
        </span>

        <span className="font-semibold text-amber-600 capitalize">
          {currentReview.type ||
            "vocabulary"}
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{
            width: `${
              ((currentIndex + 1) /
                reviews.length) *
              100
            }%`,
          }}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">

        <div className="text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Translate to French
          </p>

          <p className="text-2xl font-bold text-slate-800 mt-3">
            {currentReview.english}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Difficulty:{" "}
            {currentReview.difficulty}
          </p>
        </div>

        <input
          type="text"
          value={answer}
          onChange={(event) =>
            setAnswer(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !feedback
            ) {
              handleSubmit();
            }
          }}
          disabled={submitting || !!feedback}
          autoFocus
          placeholder="Type your answer in French..."
          className={`w-full mt-6 border rounded-xl px-4 py-3 outline-none transition ${
            feedback?.type === "wrong"
              ? "border-red-400 focus:ring-2 focus:ring-red-300"
              : feedback?.type === "correct"
                ? "border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                : "border-gray-300 focus:ring-2 focus:ring-amber-400"
          }`}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !answer.trim() ||
            submitting ||
            !!feedback
          }
          className="w-full mt-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
        >
          {submitting
            ? "Saving..."
            : "Check Answer"}
        </button>

        {feedback && (
          <div
            className={`mt-4 p-4 rounded-xl text-center ${
              feedback.type === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : feedback.type === "wrong"
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            <p className="font-semibold">
              {feedback.message}
            </p>

            {feedback.type === "wrong" && (
              <button
                type="button"
                onClick={() => {
                  setAnswer("");
                  setFeedback(null);
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewSection;