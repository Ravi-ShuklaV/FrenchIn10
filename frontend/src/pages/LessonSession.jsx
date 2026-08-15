import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getLesson } from "../services/lessonService";
import useSessionStore from "../store/sessionStore";
import api from "../services/api";

import LearningSection from "../components/session/LearningSection";
import SentenceRecallSection from "../components/session/SentenceRecallSection";
import WrittenNotesSection from "../components/session/WrittenNotesSection";
import SpeakingSection from "../components/session/SpeakingSection";
import MissionSection from "../components/session/MissionSection";

import ReviewSection from "./ReviewSection";

function LessonSession() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  // =========================
  // PRIORITY REVIEWS
  // =========================

  const [dueReviews, setDueReviews] = useState([]);
  const [reviewsCompleted, setReviewsCompleted] =
    useState(false);

  // =========================
  // LESSON STATE
  // =========================

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  // Existing section timer
  const [timeLeft, setTimeLeft] = useState(null);

  const startedRef = useRef(false);

  // =========================
  // SESSION STORE
  // =========================

  const startSession = useSessionStore(
    (state) => state.startSession
  );

  const currentSectionIndex = useSessionStore(
    (state) => state.currentSectionIndex
  );

  const nextSection = useSessionStore(
    (state) => state.nextSection
  );

  const finalizeSession = useSessionStore(
    (state) => state.finalizeSession
  );

  // =========================
  // SCROLL TO TOP
  // =========================

  useEffect(() => {
    if (!lesson) {
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [
    currentSectionIndex,
    reviewsCompleted,
    lesson,
  ]);

  // =========================
  // LOAD LESSON + DUE REVIEWS
  // =========================

  useEffect(() => {
    let cancelled = false;

    async function loadLesson() {
      try {
        setLoading(true);

        // =========================
        // LOAD LESSON
        // =========================

        const data = await getLesson(lessonId);

        if (cancelled) {
          return;
        }

        console.log(
          "LOADED LESSON:",
          data
        );

        console.log(
          "LEARNING:",
          data.learning
        );

        console.log(
          "VOCABULARY:",
          data.learning?.vocabulary
        );

        console.log(
          "PHRASES:",
          data.learning?.phrases
        );

        console.log(
          "GRAMMAR:",
          data.learning?.grammar
        );

        // =========================
        // LOAD PRIORITY REVIEWS
        // =========================

        try {
          const reviewResponse =
            await api.get("/review/due");

          if (cancelled) {
            return;
          }

          const reviews =
            Array.isArray(reviewResponse.data)
              ? reviewResponse.data
              : [];

          setDueReviews(reviews);

          console.log(
            "🔥 PRIORITY REVIEWS:",
            reviews
          );
        } catch (reviewError) {
          console.error(
            "❌ FAILED TO LOAD PRIORITY REVIEWS:",
            reviewError.response?.data ||
              reviewError.message
          );

          if (!cancelled) {
            setDueReviews([]);
          }
        }

        if (cancelled) {
          return;
        }

        // =========================
        // SET LESSON
        // =========================

        setLesson(data);

        // =========================
        // START NORMAL SESSION
        // =========================

        if (!startedRef.current) {
          startedRef.current = true;

          startSession(
            data.id,
            data.session.sections
          );
        }
      } catch (error) {
        console.error(
          "Failed to load lesson:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLesson();

    return () => {
      cancelled = true;
    };
  }, [
    lessonId,
    startSession,
  ]);

  // =========================
  // IS REVIEW PHASE?
  // =========================

  const showPriorityReviews =
    dueReviews.length > 0 &&
    !reviewsCompleted;

  // =========================
  // SECTION TIMER
  // =========================

  useEffect(() => {
    if (!lesson) {
      return;
    }

    // -------------------------
    // PRIORITY REVIEW TIMER
    // -------------------------

    if (showPriorityReviews) {
      setTimeLeft(120);

      const timer =
        window.setInterval(() => {
          setTimeLeft((previous) => {
            if (
              previous === null ||
              previous <= 1
            ) {
              window.clearInterval(timer);

              setReviewsCompleted(true);

              return 0;
            }

            return previous - 1;
          });
        }, 1000);

      return () => {
        window.clearInterval(timer);
      };
    }

    // -------------------------
    // NORMAL LESSON TIMER
    // -------------------------

    const section =
      lesson.session.sections[
        currentSectionIndex
      ];

    if (!section) {
      return;
    }

    setTimeLeft(
      section.timeLimitSeconds
    );

    const timer =
      window.setInterval(() => {
        setTimeLeft((previous) => {
          if (
            previous === null ||
            previous <= 1
          ) {
            window.clearInterval(timer);

            if (
              currentSectionIndex <
              lesson.session.sections.length - 1
            ) {
              window.setTimeout(() => {
                nextSection();
              }, 300);
            } else {
              window.setTimeout(() => {
                finalizeSession();
                navigate(
                  "/session/complete"
                );
              }, 300);
            }

            return 0;
          }

          return previous - 1;
        });
      }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    lesson,
    currentSectionIndex,
    nextSection,
    finalizeSession,
    navigate,
    showPriorityReviews,
  ]);

  // =========================
  // REVIEW COMPLETE
  // =========================

  function handleReviewsComplete() {
    console.log(
      "✅ PRIORITY REVIEWS COMPLETE"
    );

    setReviewsCompleted(true);
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">

          <p className="text-emerald-600 font-semibold">
            FrenchIn10
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-2">
            Loading your lesson...
          </h2>

          <p className="text-gray-500 mt-2">
            Getting everything ready.
          </p>

        </div>
      </div>
    );
  }

  // =========================
  // LESSON ERROR
  // =========================

  if (!lesson) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">

          <h2 className="text-2xl font-bold text-slate-800">
            Lesson unavailable
          </h2>

          <p className="text-gray-500 mt-2">
            We couldn't load this lesson.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/lessons")
            }
            className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-semibold"
          >
            Back to Lessons
          </button>

        </div>
      </div>
    );
  }

  // =========================
  // CURRENT NORMAL SECTION
  // =========================

  const currentSection =
    lesson.session.sections[
      currentSectionIndex
    ];

  if (
    !showPriorityReviews &&
    !currentSection
  ) {
    return null;
  }

  // =========================
  // LEARNING DATA
  // =========================

  const vocabularyItems =
    lesson.learning?.vocabulary || [];

  const phraseItems =
    lesson.learning?.phrases || [];

  const grammarItems =
    lesson.learning?.grammar || [];

  // =========================
  // SECTION COMPLETE
  // =========================

  function handleSectionComplete() {
    if (
      currentSectionIndex <
      lesson.session.sections.length - 1
    ) {
      nextSection();
      return;
    }

    finalizeSession();

    navigate(
      "/session/complete"
    );
  }

  // =========================
  // DEVELOPMENT SKIP
  // =========================

  function handleDevelopmentSkip() {
    // If priority reviews are currently
    // showing, skip ONLY the review phase.
    if (showPriorityReviews) {
      console.log(
        "⏭️ SKIPPING PRIORITY REVIEWS"
      );

      setReviewsCompleted(true);
      return;
    }

    // Otherwise preserve the existing
    // normal section skip behavior.
    const isLastSection =
      currentSectionIndex ===
      lesson.session.sections.length - 1;

    if (isLastSection) {
      finalizeSession();

      navigate(
        "/session/complete"
      );

      return;
    }

    nextSection();
  }

  // =========================
  // FORMAT TIME
  // =========================

  const formattedTime = `${Math.floor(
    (timeLeft ?? 0) / 60
  )}:${String(
    (timeLeft ?? 0) % 60
  ).padStart(2, "0")}`;

  // =========================
  // RENDER
  // =========================

  return (
    <div className="max-w-5xl mx-auto">

      {/* =========================
          LESSON HEADER
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">

        <div className="flex items-start justify-between gap-5">

          <div>

            <p className="text-sm text-emerald-600 font-semibold">
              Lesson {lesson.id} ·{" "}
              {lesson.level}
            </p>

            <h1 className="text-3xl font-bold text-slate-800 mt-1">
              {lesson.title}
            </h1>

            <p className="text-gray-500 mt-2">
              {lesson.scenario}
            </p>

          </div>

          <div className="text-right shrink-0">

            <p className="text-xs text-gray-400">
              TIME
            </p>

            <p className="text-2xl font-bold text-emerald-600">
              {formattedTime}
            </p>

          </div>

        </div>
      </div>

      {/* =========================
          PRIORITY REVIEW HEADER
      ========================= */}

      {showPriorityReviews && (
        <>
          <div className="mb-5 flex items-center justify-between text-sm">

            <span className="text-gray-500">
              Priority Review
            </span>

            <span className="font-semibold text-amber-600">
              {dueReviews.length} concepts
            </span>

          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-8">

            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{
                width: "100%",
              }}
            />

          </div>
        </>
      )}

      {/* =========================
          NORMAL SECTION HEADER
      ========================= */}

      {!showPriorityReviews && (
        <>
          <div className="mb-5 flex items-center justify-between text-sm">

            <span className="text-gray-500">
              Section{" "}
              {currentSectionIndex + 1} of{" "}
              {lesson.session.sections.length}
            </span>

            <span className="font-semibold text-slate-700">
              {currentSection.label}
            </span>

          </div>

          {/* =========================
              NORMAL PROGRESS
          ========================= */}

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-8">

            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${
                  ((currentSectionIndex + 1) /
                    lesson.session.sections.length) *
                  100
                }%`,
              }}
            />

          </div>
        </>
      )}

      {/* =========================
          SECTION CONTENT
      ========================= */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">

        {/* =========================
            PRIORITY REVIEWS
        ========================= */}

        {showPriorityReviews && (
          <ReviewSection
            reviews={dueReviews}
            onComplete={
              handleReviewsComplete
            }
          />
        )}

        {/* =========================
            VOCABULARY
        ========================= */}

        {!showPriorityReviews &&
          currentSection.id ===
            "vocabulary" && (
            <LearningSection
              title="Vocabulary"
              items={vocabularyItems}
              sectionType="vocabulary"
              onComplete={
                handleSectionComplete
              }
            />
          )}

        {/* =========================
            PHRASES
        ========================= */}

        {!showPriorityReviews &&
          currentSection.id ===
            "phrases" && (
            <LearningSection
              title="Useful Phrases"
              items={phraseItems}
              sectionType="phrases"
              onComplete={
                handleSectionComplete
              }
            />
          )}

        {/* =========================
            GRAMMAR
        ========================= */}

        {!showPriorityReviews &&
          currentSection.id ===
            "grammar" && (
            <LearningSection
              title="Grammar"
              items={grammarItems}
              sectionType="grammar"
              onComplete={
                handleSectionComplete
              }
            />
          )}

        {/* =========================
            SENTENCE RECALL
        ========================= */}

        {!showPriorityReviews &&
          currentSection.id ===
            "sentenceRecall" && (
            <SentenceRecallSection
              practice={
                lesson.practice || []
              }
              onComplete={
                handleSectionComplete
              }
            />
          )}

        {/* =========================
            WRITING
        ========================= */}

        {!showPriorityReviews &&
          currentSection.id ===
            "handwriting" && (
            <WrittenNotesSection
              lesson={lesson}
              onComplete={nextSection}
            />
          )}

        {/* =========================
            SPEAKING
        ========================= */}

        {!showPriorityReviews &&
  currentSection.id === "speaking" && (
    <SpeakingSection
      speaking={lesson.practice?.speaking || []}
      onComplete={handleSectionComplete}
    />
  )}

        {/* =========================
            MISSION
        ========================= */}

        {!showPriorityReviews &&
          currentSection.id ===
            "mission" && (
            <MissionSection
              mission={lesson.mission}
            />
          )}

      </div>

      {/* =========================
          DEVELOPMENT SKIP
      ========================= */}

      <button
        type="button"
        onClick={
          handleDevelopmentSkip
        }
        className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white opacity-60 hover:opacity-100 transition"
      >
        Skip section
      </button>

    </div>
  );
}

export default LessonSession;