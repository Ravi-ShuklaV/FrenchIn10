import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSessionStore from "../store/sessionStore";
import { getLesson } from "../services/lessonService";

function Review() {
  const navigate = useNavigate();

  const completedLessons = useSessionStore(
    (state) => state.completedLessons
  );

  const [lessons, setLessons] = useState({});
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD COMPLETED LESSON DATA
  // =========================

  useEffect(() => {
    let cancelled = false;

    async function loadLessons() {
      try {
        setLoading(true);

        const results = await Promise.all(
          completedLessons.map(async (result) => {
            try {
              const lesson = await getLesson(
                result.lessonId
              );

              return {
                lessonId: result.lessonId,
                lesson,
              };
            } catch (error) {
              console.error(
                `Failed to load lesson ${result.lessonId}:`,
                error
              );

              return {
                lessonId: result.lessonId,
                lesson: null,
              };
            }
          })
        );

        if (cancelled) {
          return;
        }

        const lessonMap = {};

        results.forEach(
          ({ lessonId, lesson }) => {
            if (lesson) {
              lessonMap[lessonId] = lesson;
            }
          }
        );

        setLessons(lessonMap);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (completedLessons.length === 0) {
      setLessons({});
      setLoading(false);
      return;
    }

    loadLessons();

    return () => {
      cancelled = true;
    };
  }, [completedLessons]);

  // =========================
  // GET CONCEPT
  // =========================

  function getConcept(
    lesson,
    conceptId
  ) {
    return lesson?.concepts?.find(
      (concept) =>
        concept.conceptId === conceptId
    );
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">

          <div className="text-center py-16">

            <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
              Review
            </p>

            <h1 className="text-3xl font-bold text-slate-800 mt-2">
              Loading your lessons...
            </h1>

            <p className="text-gray-500 mt-2">
              Getting your lesson history.
            </p>

          </div>

        </div>
      </div>
    );
  }

  // =========================
  // EMPTY STATE
  // =========================

  if (completedLessons.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">

        <div className="max-w-3xl mx-auto">

          <div className="text-center py-16">

            <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
              Review
            </p>

            <h1 className="text-4xl font-bold text-slate-800 mt-2">
              Nothing to review yet
            </h1>

            <p className="text-gray-500 mt-3">
              Complete a lesson and your lesson
              results will appear here.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/lessons")
              }
              className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
            >
              Go to Lessons
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =========================
  // REVIEW PAGE
  // =========================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">

      <div className="max-w-4xl mx-auto">

        {/* =========================
            HEADER
        ========================= */}

        <div className="mb-8">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Review
          </p>

          <h1 className="text-4xl font-bold text-slate-800 mt-2">
            Review your lessons
          </h1>

          <p className="text-gray-500 mt-2">
            See what you struggled with in each lesson.
          </p>

        </div>

        {/* =========================
            LESSON HISTORY
        ========================= */}

        <div className="space-y-5">

          {completedLessons
            .slice()
            .sort(
              (a, b) =>
                b.completedAt -
                a.completedAt
            )
            .map((result) => {

              const lesson =
                lessons[result.lessonId];

              /*
               * If the lesson cannot be loaded,
               * don't crash the entire Review page.
               */
              if (!lesson) {
                return (
                  <div
                    key={result.lessonId}
                    className="bg-white border border-gray-200 rounded-2xl p-6"
                  >

                    <p className="font-semibold text-slate-800">
                      Lesson {result.lessonId}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Lesson data could not be loaded.
                    </p>

                  </div>
                );
              }

              const weakConcepts =
                result.weakConcepts || [];

              return (
                <div
                  key={result.lessonId}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
                >

                  {/* =====================
                      LESSON HEADER
                  ===================== */}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div>

                      <h2 className="text-2xl font-bold text-slate-800">
                        {lesson.title}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {lesson.level}
                        {" · "}
                        {lesson.scenario}
                      </p>

                    </div>

                    {/* SCORE */}

                    <div className="text-left sm:text-right">

                      <p className="text-3xl font-bold text-emerald-600">
                        {result.score}%
                      </p>

                      <p className="text-sm text-gray-400">
                        {result.correctAnswers}
                        {" / "}
                        {result.totalQuestions}
                      </p>

                    </div>

                  </div>

                  {/* =====================
                      WEAK CONCEPTS
                  ===================== */}

                  <div className="mt-6">

                    <p className="text-sm font-semibold text-slate-700">
                      Needs practice
                    </p>

                    {weakConcepts.length ===
                    0 ? (

                      <div className="mt-3 bg-emerald-50 rounded-xl p-4">

                        <p className="text-emerald-700 font-medium">
                          Nothing major to review 🎉
                        </p>

                      </div>

                    ) : (

                      <div className="mt-3 space-y-2">

                        {weakConcepts.map(
                          (weak) => {

                            const concept =
                              getConcept(
                                lesson,
                                weak.conceptId
                              );

                            return (
                              <div
                                key={
                                  weak.conceptId
                                }
                                className="flex items-center justify-between gap-4 border border-gray-200 rounded-xl px-4 py-3"
                              >

                                {/* CONCEPT */}

                                <div>

                                  <p className="font-semibold text-slate-800">
                                    {concept?.french ||
                                      weak.conceptId}
                                  </p>

                                  {concept?.english && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {
                                        concept.english
                                      }
                                    </p>
                                  )}

                                </div>

                                {/* STATS */}

                                <div className="text-right shrink-0">

                                  <p className="text-sm font-semibold text-red-500">
                                    {
                                      weak.incorrect
                                    }{" "}
                                    wrong
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {
                                      weak.attempts
                                    }{" "}
                                    attempts
                                  </p>

                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>

                    )}

                  </div>

                  {/* =====================
                      REVIEW BUTTON
                  ===================== */}

                  {weakConcepts.length >
                    0 && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/review/${result.lessonId}`
                        )
                      }
                      className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition"
                    >
                      Review This Lesson
                    </button>
                  )}

                </div>
              );
            })}

        </div>

      </div>

    </div>
  );
}

export default Review;