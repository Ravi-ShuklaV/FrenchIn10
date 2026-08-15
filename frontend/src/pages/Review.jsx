import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Review() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [progress, setProgress] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // LOAD REVIEWS + PROGRESS
  // =========================

  useEffect(() => {
    async function loadReviewData() {
      try {
        setLoading(true);
        setError("");

        const [reviewResponse, progressResponse] = await Promise.all([
          api.get("/review"),
          api.get("/progress"),
        ]);

        setReviews(reviewResponse.data);
        setProgress(progressResponse.data);
      } catch (error) {
        console.error(
          "Failed to load review data:",
          error.response?.data || error.message,
        );

        setError(
          error.response?.data?.message || "Failed to load your reviews.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadReviewData();
  }, []);

  // =========================
  // GROUP LIVE REVIEWS BY LESSON
  // =========================

  const reviewsByLesson = reviews.reduce((map, review) => {
    const key = String(review.lessonId);

    if (!map[key]) {
      map[key] = [];
    }

    map[key].push(review);

    return map;
  }, {});

  // =========================
  // ONE CARD PER LESSON, NOT PER ATTEMPT
  // You may have completed the same lesson many times;
  // only the most recent attempt's score is relevant, and
  // "needs practice" is lesson-scoped (live reviews), not
  // attempt-scoped.
  // =========================

  const latestByLesson = progress.reduce((map, result) => {
    const key = String(result.lessonId);

    const existing = map[key];

    const resultTime = new Date(
      result.completedAt || result.createdAt || 0,
    ).getTime();

    const existingTime = existing
      ? new Date(existing.completedAt || existing.createdAt || 0).getTime()
      : -Infinity;

    if (!existing || resultTime > existingTime) {
      map[key] = result;
    }

    return map;
  }, {});

  const totalDueReviews = reviews.length;

  // Only lessons that still have something due get a card.
  const lessonsNeedingPractice = Object.values(latestByLesson)
    .map((result) => ({
      ...result,
      liveWeakConcepts: reviewsByLesson[String(result.lessonId)] || [],
    }))
    .filter((result) => result.liveWeakConcepts.length > 0)
    .sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt) -
        new Date(a.completedAt || a.createdAt),
    );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Loading your reviews...</p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  // =========================
  // NEVER COMPLETED A LESSON
  // =========================

  if (progress.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-500">Review</p>

        <h1 className="text-3xl font-bold text-slate-800 mt-2">
          Nothing to review yet
        </h1>

        <p className="text-gray-500 mt-3">
          Complete a lesson and your weak concepts will appear here.
        </p>

        <button
          type="button"
          onClick={() => navigate("/lessons")}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Go to Lessons
        </button>
      </div>
    );
  }

  // =========================
  // COMPLETED LESSONS, BUT NOTHING CURRENTLY DUE
  // A single clean state instead of a card per lesson
  // each individually saying "nothing here."
  // =========================

  if (totalDueReviews === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Review
        </p>

        <h1 className="text-3xl font-bold text-slate-800 mt-2">
          You're all caught up! 🎉
        </h1>

        <p className="text-gray-500 mt-3">
          Nothing needs practice right now. Keep learning and anything you
          struggle with will show up here.
        </p>

        <button
          type="button"
          onClick={() => navigate("/lessons")}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Go to Lessons
        </button>
      </div>
    );
  }

  // =========================
  // REVIEW PAGE
  // =========================

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-sm text-emerald-600 font-semibold">REVIEW</p>

        <h1 className="text-3xl font-bold text-slate-800 mt-2">
          Your lesson review
        </h1>

        <p className="text-gray-500 mt-2">
          {totalDueReviews} concept{totalDueReviews === 1 ? "" : "s"} across{" "}
          {lessonsNeedingPractice.length} lesson
          {lessonsNeedingPractice.length === 1 ? "" : "s"} need
          {lessonsNeedingPractice.length === 1 ? "s" : ""} practice.
        </p>
      </div>

      <div className="space-y-5">
        {lessonsNeedingPractice.map((result) => {
          const weakConcepts = result.liveWeakConcepts;

          return (
            <div
              key={result.lessonId}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
            >
              {/* LESSON HEADER */}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Lesson {result.lessonId} · most recent attempt
                  </p>

                  <h2 className="text-2xl font-bold text-slate-800 mt-1">
                    {weakConcepts.length} concept
                    {weakConcepts.length === 1 ? "" : "s"} to review
                  </h2>
                </div>

                <div className="sm:text-right">
                  <p className="text-3xl font-bold text-emerald-600">
                    {result.score}%
                  </p>

                  <p className="text-sm text-gray-400">
                    {result.correctAnswers} / {result.totalQuestions}
                  </p>
                </div>
              </div>

              {/* WEAK CONCEPTS */}

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700">
                  Needs practice
                </p>

                <div className="mt-3 space-y-2">
                  {weakConcepts.map((weak) => (
                    <div
                      key={weak._id || weak.conceptId}
                      className="flex items-center justify-between gap-4 border border-gray-200 rounded-xl px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {weak.french || weak.conceptId}
                        </p>

                        {weak.english && (
                          <p className="text-sm text-gray-500 mt-1">
                            {weak.english}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-red-500">
                          {weak.incorrectCount} wrong
                        </p>

                        <p className="text-xs text-gray-400">
                          difficulty {weak.difficulty}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REVIEW BUTTON */}

              <button
                type="button"
                onClick={() => navigate(`/review/${result.lessonId}`)}
                className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition"
              >
                Review This Lesson
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Review;