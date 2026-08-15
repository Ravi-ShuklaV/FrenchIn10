import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import useSessionStore from "../store/sessionStore";
import { getLesson } from "../services/lessonService";

function ReviewLesson() {
  const { lessonId } = useParams();

  const navigate = useNavigate();

  // =========================
  // STORE
  // =========================

  const completedLessons =
    useSessionStore(
      (state) =>
        state.completedLessons
    );

  const saveReviewResult =
    useSessionStore(
      (state) =>
        state.saveReviewResult
    );

  const reviewHistory =
    useSessionStore(
      (state) =>
        state.reviewHistory
    );

  // =========================
  // STATE
  // =========================

  const [lesson, setLesson] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [answer, setAnswer] =
    useState("");

  const [feedback, setFeedback] =
    useState(null);

  // =========================
  // FIND SESSION RESULT
  // =========================

  const result =
    completedLessons.find(
      (item) =>
        String(item.lessonId) ===
        String(lessonId)
    );

  // =========================
  // LOAD LESSON
  // =========================

  useEffect(() => {
    async function loadLesson() {
      try {
        setLoading(true);

        const data =
          await getLesson(
            Number(lessonId)
          );

        setLesson(data);
      } catch (error) {
        console.error(
          "Failed to load lesson:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadLesson();
  }, [lessonId]);

  // =========================
  // WEAK CONCEPTS
  // =========================

  const weakConcepts =
    result?.weakConcepts || [];

  const reviewConcepts =
    weakConcepts
      .map((weak) =>
        lesson?.concepts?.find(
          (concept) =>
            concept.conceptId ===
            weak.conceptId
        )
      )
      .filter(Boolean);

  // =========================
  // CURRENT CONCEPT
  // =========================

  const currentConcept =
    reviewConcepts[
      currentIndex
    ];

  // =========================
  // REVIEW STATUS
  // =========================

  const getReviewStatus = (
    conceptId
  ) => {
    return reviewHistory.find(
      (item) =>
        String(item.lessonId) ===
          String(lessonId) &&
        item.conceptId ===
          conceptId
    );
  };

  const masteredCount =
    reviewConcepts.filter(
      (concept) =>
        getReviewStatus(
          concept.conceptId
        )?.mastered === true
    ).length;

  // =========================
  // RESET QUESTION
  // =========================

  useEffect(() => {
    setAnswer("");
    setFeedback(null);
  }, [currentIndex]);

  // =========================
  // NORMALIZE TEXT
  // =========================

  function normalizeText(text) {
    return text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[.,!?;:'"()-–—]/g,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================
  // SUBMIT
  // =========================

  function handleSubmit() {
    if (
      !answer.trim() ||
      !currentConcept
    ) {
      return;
    }

    const expected =
      normalizeText(
        currentConcept.french
      );

    const actual =
      normalizeText(answer);

    const correct =
      expected === actual;

    // =========================
    // WRONG
    // =========================

    if (!correct) {
      setFeedback({
        type: "wrong",
        message:
          "Not quite. Try again.",
      });

      return;
    }

    // =========================
    // CORRECT
    // =========================

    saveReviewResult({
      lessonId:
        Number(lessonId),

      conceptId:
        currentConcept.conceptId,

      mastered: true,

      completedAt:
        Date.now(),
    });

    setFeedback({
      type: "correct",
      message:
        "Correct! 🎉",
    });

    // =========================
    // NEXT
    // =========================

    setTimeout(() => {
      if (
        currentIndex >=
        reviewConcepts.length - 1
      ) {
        return;
      }

      setCurrentIndex(
        (prev) => prev + 1
      );
    }, 700);
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <p className="text-gray-500">
          Loading review...
        </p>

      </div>
    );
  }

  // =========================
  // NO RESULT
  // =========================

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">

        <div className="max-w-2xl mx-auto text-center py-16">

          <h1 className="text-3xl font-bold text-slate-800">
            Review unavailable
          </h1>

          <p className="text-gray-500 mt-3">
            This lesson has not been
            completed yet.
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

  // =========================
  // NO WEAK CONCEPTS
  // =========================

  if (
    reviewConcepts.length === 0
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">

        <div className="max-w-2xl mx-auto text-center py-16">

          <p className="text-emerald-600 font-semibold">
            Review
          </p>

          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            Nothing needs practice 🎉
          </h1>

          <p className="text-gray-500 mt-3">
            You did great on this lesson.
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

  // =========================
  // ALL MASTERED
  // =========================

  if (
    masteredCount ===
    reviewConcepts.length
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">

        <div className="max-w-2xl mx-auto">

          <div className="text-center py-12">

            <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
              Review Complete
            </p>

            <h1 className="text-4xl font-bold text-slate-800 mt-2">
              You mastered them! 🎉
            </h1>

            <p className="text-gray-500 mt-3">
              {masteredCount} /{" "}
              {reviewConcepts.length}{" "}
              concepts mastered.
            </p>

          </div>

          {/* ORIGINAL SCORE */}

          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">

            <p className="text-sm text-gray-500">
              Original lesson score
            </p>

            <p className="text-4xl font-bold text-emerald-600 mt-2">
              {result.score}%
            </p>

            <p className="text-sm text-gray-400 mt-1">
              {result.correctAnswers} /{" "}
              {result.totalQuestions}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/review")
            }
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
          >
            Back to Review
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // REVIEW UI
  // =========================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">

      <div className="max-w-2xl mx-auto">

        {/* HEADER */}

        <div className="text-center mb-8">

          <p className="text-sm text-amber-600 font-semibold uppercase tracking-wide">
            Review
          </p>

          <h1 className="text-3xl font-bold text-slate-800 mt-2">
            {lesson?.title}
          </h1>

          <p className="text-gray-500 mt-2">
            Let's practice what was difficult.
          </p>

        </div>

        {/* PROGRESS */}

        <div className="mb-5">

          <div className="flex justify-between text-sm text-gray-500 mb-2">

            <span>
              Concept{" "}
              {currentIndex + 1}{" "}
              /{" "}
              {reviewConcepts.length}
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
                    reviewConcepts.length) *
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

          </div>

          {/* INPUT */}

          <input
            type="text"
            value={answer}
            onChange={(e) =>
              setAnswer(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                handleSubmit();
              }
            }}
            placeholder="Type it in French..."
            className={`w-full mt-8 border rounded-xl px-4 py-3 outline-none transition ${
              feedback?.type ===
              "wrong"
                ? "border-red-400 focus:ring-2 focus:ring-red-300"
                : feedback?.type ===
                  "correct"
                ? "border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
            }`}
            autoFocus
          />

          {/* BUTTON */}

          <button
            type="button"
            onClick={
              handleSubmit
            }
            disabled={
              !answer.trim()
            }
            className={`w-full mt-4 text-white font-semibold py-3 rounded-xl transition ${
              !answer.trim()
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
                feedback.type ===
                "correct"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {feedback.message}

              {feedback.type ===
                "wrong" && (
                <p className="text-sm font-normal mt-1">
                  Try again.
                </p>
              )}
            </div>
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