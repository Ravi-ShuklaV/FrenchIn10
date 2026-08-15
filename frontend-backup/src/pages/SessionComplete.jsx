import { useNavigate } from "react-router-dom";
import useSessionStore from "../store/sessionStore";

function SessionComplete() {
  const navigate = useNavigate();

  const sessionResult = useSessionStore(
    (state) => state.sessionResult
  );

  // =========================
  // NO RESULT
  // =========================

  if (!sessionResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-slate-800">
            No session result
          </h1>

          <p className="text-gray-500 mt-2">
            There is no completed session to display.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  const {
    totalQuestions,
    correctAnswers,
    incorrectAnswers,
    score,
    weakConcepts,
    durationSeconds,
  } = sessionResult;

  // =========================
  // HELPERS
  // =========================

  function formatDuration(seconds) {
    if (!seconds || seconds < 60) {
      return `${seconds || 0}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  }

  function getScoreMessage() {
    if (score >= 90) {
      return "Excellent work! 🎉";
    }

    if (score >= 75) {
      return "Great job! Keep it up.";
    }

    if (score >= 60) {
      return "Good progress. A little more practice will help.";
    }

    return "Keep practicing. You'll improve with repetition.";
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">

      <div className="max-w-3xl mx-auto">

        {/* =========================
            HEADER
        ========================= */}

        <div className="text-center">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Lesson Complete
          </p>

          <h1 className="text-4xl font-bold text-slate-800 mt-2">
            {getScoreMessage()}
          </h1>

          <p className="text-gray-500 mt-3">
            You finished the entire lesson.
          </p>

        </div>

        {/* =========================
            SCORE CARD
        ========================= */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 mt-8 text-center">

          <p className="text-sm text-gray-500">
            Your Score
          </p>

          <p className="text-6xl font-bold text-emerald-600 mt-2">
            {score}%
          </p>

          <p className="text-lg text-slate-700 mt-4">
            <span className="font-semibold">
              {correctAnswers}
            </span>{" "}
            /{" "}
            <span className="font-semibold">
              {totalQuestions}
            </span>{" "}
            correct
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Every question counted equally.
          </p>

        </div>

        {/* =========================
            SUMMARY
        ========================= */}

        <div className="grid grid-cols-2 gap-4 mt-5">

          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">

            <p className="text-sm text-gray-500">
              Correct
            </p>

            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {correctAnswers}
            </p>

          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">

            <p className="text-sm text-gray-500">
              Incorrect
            </p>

            <p className="text-2xl font-bold text-red-500 mt-1">
              {incorrectAnswers}
            </p>

          </div>

        </div>

        {/* =========================
            TIME
        ========================= */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mt-4 text-center">

          <p className="text-sm text-gray-500">
            Session Duration
          </p>

          <p className="text-xl font-bold text-slate-700 mt-1">
            {formatDuration(durationSeconds)}
          </p>

        </div>

        {/* =========================
            NEEDS REVIEW
        ========================= */}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mt-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-amber-600 font-semibold">
                REVIEW
              </p>

              <h2 className="text-2xl font-bold text-slate-800 mt-1">
                Needs Practice
              </h2>
            </div>

            <div className="bg-amber-100 text-amber-700 rounded-full px-3 py-1 text-sm font-semibold">
              {weakConcepts?.length || 0}
            </div>

          </div>

          {weakConcepts?.length === 0 ? (

            <div className="mt-5 bg-emerald-50 rounded-xl p-5 text-center">

              <p className="text-emerald-700 font-semibold">
                Nothing needs review! 🎉
              </p>

              <p className="text-sm text-emerald-600 mt-1">
                You handled all the concepts well.
              </p>

            </div>

          ) : (

            <div className="mt-5 space-y-3">

              {weakConcepts.map((concept) => (

                <div
                  key={concept.conceptId}
                  className="border border-gray-200 rounded-xl p-4"
                >

                  <div className="flex items-center justify-between">

                    <p className="font-semibold text-slate-800">
                      {concept.conceptId}
                    </p>

                    <span className="text-sm text-red-500">
                      {concept.incorrect} wrong
                    </span>

                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {concept.correct} correct ·{" "}
                    {concept.attempts}{" "}
                    presentation
                    {concept.attempts !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* =========================
            ACTIONS
        ========================= */}

        <div className="flex flex-col sm:flex-row gap-3 mt-8">

          {weakConcepts?.length > 0 && (
            <button
              onClick={() =>
                navigate("/review")
              }
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition"
            >
              Review Difficult Concepts
            </button>
          )}

          <button
            onClick={() =>
              navigate("/")
            }
            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition"
          >
            Back to Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}

export default SessionComplete;