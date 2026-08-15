import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

function ReviewLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [reviewConcepts, setReviewConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [masteredCount, setMasteredCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // ==========================================
  // LOAD LIVE REVIEWS FROM MONGODB
  // ==========================================

  async function loadReviews() {
    try {
      setLoading(true);
      setLoadError("");

      const response = await api.get("/review", {
        params: {
          lessonId,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setReviewConcepts(data);
      setTotalCount(data.length);
      setMasteredCount(0);
      setCurrentIndex(0);
    } catch (error) {
      console.error(
        "Failed to load review concepts:",
        error.response?.data || error.message
      );

      setLoadError(
        error.response?.data?.message ||
          "Failed to load this review."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [lessonId]);

  const currentConcept =
    reviewConcepts[currentIndex];

  // ==========================================
  // RESET UI WHEN QUESTION CHANGES
  // ==========================================

  useEffect(() => {
    setAnswer("");
    setFeedback(null);
  }, [currentIndex]);

  // ==========================================
  // NORMALIZE
  // ==========================================

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

  // ==========================================
  // SUBMIT
  // ==========================================

  async function handleSubmit() {
    if (
      !answer.trim() ||
      !currentConcept ||
      feedback
    ) {
      return;
    }

    const correct =
      normalizeText(answer) ===
      normalizeText(currentConcept.french);

    try {
      // ========================================
      // SAVE TO MONGODB
      // ========================================

      const response = await api.post("/review", {
        conceptId: currentConcept.conceptId,
        lessonId: Number(lessonId),
        french: currentConcept.french,
        english: currentConcept.english,
        type:
          currentConcept.type ||
          "vocabulary",
        correct,
      });

      console.log(
        "✅ REVIEW SAVED:",
        response.data
      );

      // ========================================
      // WRONG
      // ========================================

      if (!correct) {
        setFeedback({
          type: "wrong",
          message: "Not quite. Try again.",
        });

        return;
      }

      // ========================================
      // CORRECT
      //
      // Backend has already deleted the review
      // from MongoDB.
      // ========================================

      setFeedback({
        type: "correct",
        message: "Correct! 🎉",
      });

      setMasteredCount(
        (previous) => previous + 1
      );

      setTimeout(() => {
        setReviewConcepts((previous) =>
          previous.filter(
            (concept) =>
              String(concept.conceptId) !==
              String(currentConcept.conceptId)
          )
        );

        setAnswer("");
        setFeedback(null);

        // Always point at the first remaining
        // concept after deleting the current one.
        setCurrentIndex(0);
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
          "Couldn't save your progress.",
      });
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-gray-500">
          Loading review...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-3xl font-bold text-slate-800">
            Review unavailable
          </h1>

          <p className="text-gray-500 mt-3">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/review")
            }
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Back to Review
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // ALL MASTERED
  // ==========================================

  if (reviewConcepts.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Review Complete
          </p>

          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            You mastered them! 🎉
          </h1>

          <p className="text-gray-500 mt-3">
            {masteredCount > 0
              ? `${masteredCount} ${
                  masteredCount === 1
                    ? "concept"
                    : "concepts"
                } mastered.`
              : "Nothing needs practice."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/review")
            }
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Back to Review
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // REVIEW UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* HEADER */}

        <div className="text-center mb-8">
          <p className="text-sm text-amber-600 font-semibold uppercase tracking-wide">
            Review
          </p>

          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Lesson {lessonId}
          </h1>

          <p className="text-gray-500 mt-2">
            Let's practice what was difficult.
          </p>
        </div>

        {/* PROGRESS */}

        <div className="mb-5">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>
              {reviewConcepts.length} remaining
            </span>

            <span>
              {masteredCount} mastered
            </span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{
                width: `${
                  (masteredCount /
                    Math.max(
                      1,
                      totalCount
                    )) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* CARD */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="text-center">

            <p className="text-sm text-gray-400">
              Translate this into French
            </p>

            <p className="text-3xl font-bold text-slate-800 mt-5">
              {currentConcept.english}
            </p>

            <p className="text-xs text-gray-400 mt-2 capitalize">
              {currentConcept.type ||
                "vocabulary"}
            </p>

          </div>

          {/* INPUT */}

          <input
            type="text"
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !feedback
              ) {
                handleSubmit();
              }
            }}
            placeholder="Type it in French..."
            disabled={!!feedback}
            className={`w-full mt-8 border rounded-xl px-4 py-3 outline-none transition ${
              feedback?.type === "wrong"
                ? "border-red-400 focus:ring-2 focus:ring-red-300"
                : feedback?.type === "correct"
                  ? "border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                  : feedback?.type === "error"
                    ? "border-orange-400 focus:ring-2 focus:ring-orange-300"
                    : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
            }`}
            autoFocus
          />

          {/* BUTTON */}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !answer.trim() ||
              !!feedback
            }
            className={`w-full mt-4 text-white font-semibold py-3 rounded-xl transition ${
              !answer.trim() ||
              !!feedback
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Check Answer
          </button>

          {/* FEEDBACK */}

          {feedback && (
            <div
              className={`mt-5 p-4 rounded-xl text-center font-semibold ${
                feedback.type === "correct"
                  ? "bg-emerald-100 text-emerald-700"
                  : feedback.type === "wrong"
                    ? "bg-red-100 text-red-700"
                    : "bg-orange-100 text-orange-700"
              }`}
            >
              {feedback.message}

              {feedback.type === "wrong" && (
                <p className="text-sm font-normal mt-1">
                  Try again.
                </p>
              )}

              {feedback.type === "error" && (
                <p className="text-sm font-normal mt-1">
                  Check your connection and try again.
                </p>
              )}
            </div>
          )}

          {/* TRY AGAIN */}

          {feedback?.type === "wrong" && (
            <button
              type="button"
              onClick={() => {
                setAnswer("");
                setFeedback(null);
              }}
              className="w-full mt-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
            >
              Try Again
            </button>
          )}
        </div>

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            navigate("/review")
          }
          className="block mx-auto mt-6 text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Back to Review
        </button>
      </div>
    </div>
  );
}

export default ReviewLesson;