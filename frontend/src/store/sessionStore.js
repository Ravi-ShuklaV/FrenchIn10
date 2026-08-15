import { create } from "zustand";
import api from "../services/api";

const COMPLETED_LESSONS_KEY = "frenchin10_completed_lessons";
const REVIEW_HISTORY_KEY = "frenchin10_review_history";
const ACTIVITY_HISTORY_KEY = "frenchin10_activity_history";

// ======================================================
// LOCAL STORAGE HELPERS
// ======================================================

function loadJson(key, fallback = []) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ======================================================
// SECTION → SKILL
// ======================================================

const SECTION_TO_SKILL = {
  vocabulary: "vocabulary",
  grammar: "grammar",
  writing: "writing",
  speaking: "speaking",
  sentenceRecall: "conversation",
  mission: "conversation",
};

// ======================================================
// EMPTY SKILLS
// ======================================================

const EMPTY_SKILLS = () => ({
  vocabulary: {
    correct: 0,
    total: 0,
    score: null,
  },

  grammar: {
    correct: 0,
    total: 0,
    score: null,
  },

  writing: {
    correct: 0,
    total: 0,
    score: null,
  },

  speaking: {
    correct: 0,
    total: 0,
    score: null,
  },

  conversation: {
    correct: 0,
    total: 0,
    score: null,
  },
});

// ======================================================
// QUESTION KEY
// ======================================================

/*
  Every question needs ONE stable identity.

  Prefer:
    questionId

  If a section does not provide questionId, fall back to:
    section + conceptId

  This prevents retries from becoming new questions.

  Example:

  Question 1:
    wrong
    questionId = "vocab_bonjour"

  Question 1 retry:
    correct
    questionId = "vocab_bonjour"

  These are ONE question, not two.
*/

function getQuestionKey(item, fallbackIndex = 0) {
  if (item?.questionId !== undefined && item?.questionId !== null) {
    return String(item.questionId);
  }

  if (item?.questionKey !== undefined && item?.questionKey !== null) {
    return String(item.questionKey);
  }

  if (item?.conceptId !== undefined && item?.conceptId !== null) {
    return `${item.section || "unknown"}:${item.conceptId}`;
  }

  return `${item?.section || "unknown"}:question_${fallbackIndex}`;
}

// ======================================================
// GET FIRST ATTEMPT PER QUESTION
// ======================================================

function getFirstAttempts(performance) {
  const seen = new Set();
  const firstAttempts = [];

  performance.forEach((item, index) => {
    const questionKey = getQuestionKey(item, index);

    if (seen.has(questionKey)) {
      return;
    }

    seen.add(questionKey);
    firstAttempts.push(item);
  });

  return firstAttempts;
}

// ======================================================
// SKILL STATS
// ======================================================

/*
  IMPORTANT:

  Skill scores are based ONLY on the first attempt
  of each unique question.

  Example:

  Q1 → correct
  Q2 → correct
  Q3 → wrong → correct
  Q4 → wrong → correct

  Skill score:

  2 / 4 = 50%

  NOT:

  4 / 6 = 67%
*/

function calculateSkillStats(performance) {
  const skills = EMPTY_SKILLS();

  const firstAttempts = getFirstAttempts(performance);

  firstAttempts.forEach((item) => {
    const skill = SECTION_TO_SKILL[item.section];

    if (!skill) return;

    skills[skill].total += 1;

    if (item.correct === true) {
      skills[skill].correct += 1;
    }
  });

  Object.values(skills).forEach((skill) => {
    skill.score =
      skill.total === 0
        ? null
        : Math.round((skill.correct / skill.total) * 100);
  });

  return skills;
}

// ======================================================
// WEAK CONCEPTS
// ======================================================

/*
  Weak concepts intentionally count ALL attempts.

  This is different from the lesson score.

  Example:

  Q:
    wrong
    correct

  Lesson score:
    wrong on first attempt → does NOT count as correct

  Weak concept:
    incorrect = 1
    attempts = 2

  This information is useful for the review system.
*/

function calculateWeakConcepts(performance) {
  const conceptStats = {};

  performance.forEach((item) => {
    if (!item.conceptId) return;

    if (!conceptStats[item.conceptId]) {
      conceptStats[item.conceptId] = {
        conceptId: item.conceptId,

        // Preserve lesson concept metadata
        french: item.french || "",
        english: item.english || "",
        type: item.type || "vocabulary",

        attempts: 0,
        correct: 0,
        incorrect: 0,
      };
    }

    const concept = conceptStats[item.conceptId];

    concept.attempts += 1;

    if (item.correct === true) {
      concept.correct += 1;
    } else {
      concept.incorrect += 1;
    }

    // If the first performance record did not have metadata,
    // use metadata from a later attempt if available.
    if (!concept.french && item.french) {
      concept.french = item.french;
    }

    if (!concept.english && item.english) {
      concept.english = item.english;
    }

    if (!concept.type && item.type) {
      concept.type = item.type;
    }
  });

  // Only concepts that were actually answered incorrectly
  return Object.values(conceptStats)
    .filter((concept) => concept.incorrect > 0)
    .sort((a, b) => {
      if (b.incorrect !== a.incorrect) {
        return b.incorrect - a.incorrect;
      }

      return b.attempts - a.attempts;
    });
}

// ======================================================
// ACTIVITY
// ======================================================

function addActivity(history, durationSeconds) {
  const today = getDateKey();

  const existing = history.find(
    (item) => item.date === today
  );

  let updated;

  if (existing) {
    updated = history.map((item) =>
      item.date === today
        ? {
            ...item,
            lessonsCompleted:
              item.lessonsCompleted + 1,
            durationSeconds:
              item.durationSeconds + durationSeconds,
          }
        : item
    );
  } else {
    updated = [
      ...history,
      {
        date: today,
        lessonsCompleted: 1,
        durationSeconds,
      },
    ];
  }

  return updated.sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

// ======================================================
// STORE
// ======================================================

const useSessionStore = create((set) => ({
  // ====================================================
  // CURRENT SESSION
  // ====================================================

  lessonId: null,

  currentSectionIndex: 0,

  isSessionActive: false,

  startedAt: null,

  performance: [],

  reinforcementQueue: [],

  sections: [],

  sessionResult: null,

  // ====================================================
  // PERSISTED HISTORY
  // ====================================================

  completedLessons: loadJson(
    COMPLETED_LESSONS_KEY
  ),

  reviewHistory: loadJson(
    REVIEW_HISTORY_KEY
  ),

  activityHistory: loadJson(
    ACTIVITY_HISTORY_KEY
  ),

  // ====================================================
  // START SESSION
  // ====================================================

  startSession: (lessonId, sections) => {
    set({
      lessonId: Number(lessonId),

      currentSectionIndex: 0,

      isSessionActive: true,

      startedAt: Date.now(),

      performance: [],

      reinforcementQueue: [],

      sections,

      sessionResult: null,
    });
  },

  // ====================================================
  // NEXT SECTION
  // ====================================================

  nextSection: () => {
    set((state) => ({
      currentSectionIndex: Math.min(
        state.currentSectionIndex + 1,
        Math.max(
          0,
          state.sections.length - 1
        )
      ),
    }));
  },

  // ====================================================
  // ADD PERFORMANCE
  // ====================================================

  addPerformance: (result) => {
    console.log(
      "🔥 PERFORMANCE BEING ADDED:",
      result
    );

    set((state) => ({
      performance: [
        ...state.performance,
        result,
      ],
    }));
  },

  // ====================================================
  // REINFORCEMENT
  // ====================================================

  addToReinforcementQueue: (concept) => {
    set((state) => {
      const alreadyQueued =
        state.reinforcementQueue.some(
          (item) =>
            item.conceptId ===
            concept.conceptId
        );

      if (alreadyQueued) {
        return state;
      }

      return {
        reinforcementQueue: [
          ...state.reinforcementQueue,
          concept,
        ],
      };
    });
  },

  removeFromReinforcementQueue: (
    conceptId
  ) => {
    set((state) => ({
      reinforcementQueue:
        state.reinforcementQueue.filter(
          (item) =>
            item.conceptId !== conceptId
        ),
    }));
  },

  // ====================================================
  // GET WEAK CONCEPTS
  // ====================================================

  getWeakConcepts: () => {
    return calculateWeakConcepts(
      useSessionStore.getState().performance
    );
  },

  // ====================================================
  // STREAK / ACTIVITY
  // ====================================================

  getStreakStats: () => {
    const {
      activityHistory,
    } = useSessionStore.getState();

    const activeDates = new Set(
      activityHistory.map(
        (item) => item.date
      )
    );

    let currentStreak = 0;

    const cursor = new Date();

    if (
      !activeDates.has(
        getDateKey(cursor)
      )
    ) {
      cursor.setDate(
        cursor.getDate() - 1
      );
    }

    while (
      activeDates.has(
        getDateKey(cursor)
      )
    ) {
      currentStreak += 1;

      cursor.setDate(
        cursor.getDate() - 1
      );
    }

    const sortedDates = [
      ...activeDates,
    ].sort();

    let longestStreak = 0;

    let running = 0;

    let previous = null;

    sortedDates.forEach(
      (dateString) => {
        const current = new Date(
          `${dateString}T00:00:00`
        );

        if (!previous) {
          running = 1;
        } else {
          const diff = Math.round(
            (current - previous) /
              86400000
          );

          running =
            diff === 1
              ? running + 1
              : 1;
        }

        longestStreak = Math.max(
          longestStreak,
          running
        );

        previous = current;
      }
    );

    const totalLessons =
      activityHistory.reduce(
        (sum, day) =>
          sum + day.lessonsCompleted,
        0
      );

    const totalSeconds =
      activityHistory.reduce(
        (sum, day) =>
          sum + day.durationSeconds,
        0
      );

    return {
      currentStreak,

      longestStreak,

      totalLessons,

      totalSeconds,

      totalMinutes:
        Math.round(
          totalSeconds / 60
        ),
    };
  },

  // ====================================================
  // REVIEW HISTORY
  // ====================================================

  saveReviewResult: async (
    reviewResult
  ) => {
    try {
      const response =
        await api.post(
          "/review",
          {
            lessonId:
              reviewResult.lessonId,

            conceptId:
              reviewResult.conceptId,

            french:
              reviewResult.french,

            english:
              reviewResult.english,

            score:
              reviewResult.score ??
              100,

            type:
              reviewResult.type ??
              "vocabulary",
          }
        );

      console.log(
        "✅ Review saved to MongoDB:",
        response.data
      );

      set((state) => ({
        reviewHistory: [
          ...state.reviewHistory.filter(
            (item) =>
              !(
                String(item.lessonId) ===
                  String(
                    reviewResult.lessonId
                  ) &&
                item.conceptId ===
                  reviewResult.conceptId
              )
          ),

          {
            ...reviewResult,
            ...response.data,
          },
        ],
      }));
    } catch (error) {
      console.error(
        "❌ Failed to save review:",
        error.response?.data ||
          error.message
      );

      // Keep local review as fallback
      set((state) => ({
        reviewHistory: [
          ...state.reviewHistory.filter(
            (item) =>
              !(
                String(item.lessonId) ===
                  String(
                    reviewResult.lessonId
                  ) &&
                item.conceptId ===
                  reviewResult.conceptId
              )
          ),

          reviewResult,
        ],
      }));
    }
  },

  // ====================================================
  // FINALIZE SESSION
  // ====================================================

  finalizeSession: async (
    finalPerformance = null
  ) => {
    const state =
      useSessionStore.getState();

    let performance =
      state.performance;

    // Add final record if supplied
    if (finalPerformance) {
      performance = [
        ...performance,
        finalPerformance,
      ];
    }

    // ==================================================
    // FIRST-ATTEMPT SCORING
    // ==================================================

    /*
      IMPORTANT:

      totalQuestions = UNIQUE questions

      correctAnswers = questions correct
      on their FIRST attempt

      Retries do NOT change the lesson score.
    */

    const firstAttempts =
      getFirstAttempts(performance);

    const totalQuestions =
      firstAttempts.length;

    const correctAnswers =
      firstAttempts.filter(
        (item) =>
          item.correct === true
      ).length;

    const incorrectAnswers =
      totalQuestions -
      correctAnswers;

    const score =
      totalQuestions === 0
        ? 0
        : Math.round(
            (correctAnswers /
              totalQuestions) *
              100
          );

    // ==================================================
    // WEAK CONCEPTS
    // ==================================================

    const weakConcepts =
      calculateWeakConcepts(
        performance
      );

    // ==================================================
    // SKILL STATS
    // ==================================================

    const skillStats =
      calculateSkillStats(
        performance
      );

    // ==================================================
    // DURATION
    // ==================================================

    const durationSeconds =
      state.startedAt
        ? Math.max(
            1,
            Math.round(
              (Date.now() -
                state.startedAt) /
                1000
            )
          )
        : 0;

    // ==================================================
    // RESULT
    // ==================================================

    const result = {
      lessonId:
        state.lessonId,

      totalQuestions,

      correctAnswers,

      incorrectAnswers,

      score,

      skillStats,

      weakConcepts,

      completedAt:
        Date.now(),

      durationSeconds,
    };

    console.log(
      "🔥 FINAL SESSION RESULT:",
      result
    );

    console.log(
      "🔥 FIRST ATTEMPTS:",
      firstAttempts
    );

    console.log(
      "🔥 FINAL WEAK CONCEPTS:",
      result.weakConcepts
    );

    // ==================================================
    // SAVE LOCALLY
    // ==================================================

    const updatedCompletedLessons = [
      ...state.completedLessons.filter(
        (lesson) =>
          String(
            lesson.lessonId
          ) !==
          String(
            state.lessonId
          )
      ),

      result,
    ];

    const updatedActivityHistory =
      addActivity(
        state.activityHistory,
        durationSeconds
      );

    saveJson(
      COMPLETED_LESSONS_KEY,
      updatedCompletedLessons
    );

    saveJson(
      ACTIVITY_HISTORY_KEY,
      updatedActivityHistory
    );

    set({
      sessionResult: result,

      isSessionActive: false,

      performance,

      completedLessons:
        updatedCompletedLessons,

      activityHistory:
        updatedActivityHistory,
    });

    // ==================================================
    // SAVE TO MONGODB
    // ==================================================

    try {
      console.log(
        "🔥 WEAK CONCEPTS BEING SENT:",
        result.weakConcepts
      );

      const response =
        await api.post(
          "/progress",
          {
            lessonId:
              result.lessonId,

            totalQuestions:
              result.totalQuestions,

            correctAnswers:
              result.correctAnswers,

            incorrectAnswers:
              result.incorrectAnswers,

            score:
              result.score,

            durationSeconds:
              result.durationSeconds,

            skillStats:
              result.skillStats,

            weakConcepts:
              result.weakConcepts,
          }
        );

      console.log(
        "✅ Progress saved to MongoDB:",
        response.data
      );

      return result;
    } catch (error) {
      console.error(
        "❌ Failed to save progress to MongoDB:",
        error.response?.data ||
          error.message
      );

      // Local progress is still preserved.
      return result;
    }
  },

  // ====================================================
  // END SESSION
  // ====================================================

  endSession: () => {
    set({
      isSessionActive: false,
    });
  },
}));

export default useSessionStore;