import { create } from "zustand";

const COMPLETED_LESSONS_KEY =
  "frenchin10_completed_lessons";

const REVIEW_HISTORY_KEY =
  "frenchin10_review_history";

const ACTIVITY_HISTORY_KEY =
  "frenchin10_activity_history";

// =========================
// LOAD COMPLETED LESSONS
// =========================

const loadCompletedLessons = () => {
  try {
    const saved = localStorage.getItem(
      COMPLETED_LESSONS_KEY
    );

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error(
      "Failed to load completed lessons:",
      error
    );

    return [];
  }
};

// =========================
// SAVE COMPLETED LESSONS
// =========================

const saveCompletedLessons = (lessons) => {
  try {
    localStorage.setItem(
      COMPLETED_LESSONS_KEY,
      JSON.stringify(lessons)
    );
  } catch (error) {
    console.error(
      "Failed to save completed lessons:",
      error
    );
  }
};

// =========================
// LOAD REVIEW HISTORY
// =========================

const loadReviewHistory = () => {
  try {
    const saved = localStorage.getItem(
      REVIEW_HISTORY_KEY
    );

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error(
      "Failed to load review history:",
      error
    );

    return [];
  }
};

// =========================
// SAVE REVIEW HISTORY
// =========================

const saveReviewHistory = (history) => {
  try {
    localStorage.setItem(
      REVIEW_HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error(
      "Failed to save review history:",
      error
    );
  }
};

// =========================
// LOAD ACTIVITY HISTORY
// =========================

const loadActivityHistory = () => {
  try {
    const saved = localStorage.getItem(
      ACTIVITY_HISTORY_KEY
    );

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error(
      "Failed to load activity history:",
      error
    );

    return [];
  }
};

// =========================
// SAVE ACTIVITY HISTORY
// =========================

const saveActivityHistory = (
  history
) => {
  try {
    localStorage.setItem(
      ACTIVITY_HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (error) {
    console.error(
      "Failed to save activity history:",
      error
    );
  }
};

// =========================
// GET DATE KEY
// =========================

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// =========================
// STORE
// =========================

const useSessionStore = create(
  (set) => ({
    // =========================
    // CURRENT LESSON
    // =========================

    lessonId: null,

    currentSectionIndex: 0,

    isSessionActive: false,

    startedAt: null,

    // =========================
    // PERFORMANCE
    // =========================

    performance: [],

    reinforcementQueue: [],

    sections: [],

    // =========================
    // FINAL SESSION RESULT
    // =========================

    sessionResult: null,

    // =========================
    // COMPLETED LESSON HISTORY
    // =========================

    completedLessons:
      loadCompletedLessons(),

    // =========================
    // REVIEW HISTORY
    // =========================

    reviewHistory:
      loadReviewHistory(),

    // =========================
    // DAILY ACTIVITY HISTORY
    // =========================

    activityHistory:
      loadActivityHistory(),

    // =========================
    // START SESSION
    // =========================

    startSession: (
      lessonId,
      sections
    ) => {
      set({
        lessonId,

        currentSectionIndex: 0,

        isSessionActive: true,

        startedAt: Date.now(),

        performance: [],

        reinforcementQueue: [],

        sections,

        sessionResult: null,
      });
    },

    // =========================
    // NEXT SECTION
    // =========================

    nextSection: () => {
      set((state) => ({
        currentSectionIndex:
          state.currentSectionIndex + 1,
      }));
    },

    // =========================
    // RECORD PERFORMANCE
    // =========================

    addPerformance: (result) => {
      set((state) => ({
        performance: [
          ...state.performance,
          result,
        ],
      }));
    },

    // =========================
    // REINFORCEMENT QUEUE
    // =========================

    addToReinforcementQueue: (
      concept
    ) => {
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

    // =========================
    // REMOVE REINFORCEMENT
    // =========================

    removeFromReinforcementQueue: (
      conceptId
    ) => {
      set((state) => ({
        reinforcementQueue:
          state.reinforcementQueue.filter(
            (item) =>
              item.conceptId !==
              conceptId
          ),
      }));
    },

    // =========================
    // GET WEAK CONCEPTS
    // =========================

    getWeakConcepts: () => {
      const state =
        useSessionStore.getState();

      const conceptStats = {};

      state.performance.forEach(
        (item) => {
          if (!item.conceptId) {
            return;
          }

          if (
            !conceptStats[
              item.conceptId
            ]
          ) {
            conceptStats[
              item.conceptId
            ] = {
              conceptId:
                item.conceptId,

              attempts: 0,

              correct: 0,

              incorrect: 0,
            };
          }

          conceptStats[
            item.conceptId
          ].attempts += 1;

          if (
            item.correct === true
          ) {
            conceptStats[
              item.conceptId
            ].correct += 1;
          } else {
            conceptStats[
              item.conceptId
            ].incorrect += 1;
          }
        }
      );

      return Object.values(
        conceptStats
      )
        .filter(
          (concept) =>
            concept.incorrect > 0 ||
            concept.attempts >= 2
        )
        .sort(
          (a, b) =>
            b.incorrect -
            a.incorrect
        );
    },

    // =========================
    // SAVE REVIEW RESULT
    // =========================

    saveReviewResult: (
      reviewResult
    ) => {
      set((state) => {
        const updatedHistory = [
          ...state.reviewHistory.filter(
            (item) =>
              !(
                String(
                  item.lessonId
                ) ===
                  String(
                    reviewResult.lessonId
                  ) &&
                item.conceptId ===
                  reviewResult.conceptId
              )
          ),

          reviewResult,
        ];

        saveReviewHistory(
          updatedHistory
        );

        return {
          reviewHistory:
            updatedHistory,
        };
      });
    },

    // =========================
    // GET STREAK STATS
    // =========================

    getStreakStats: () => {
      const state =
        useSessionStore.getState();

      const activeDates =
        new Set(
          state.activityHistory.map(
            (item) => item.date
          )
        );

      // =========================
      // CURRENT STREAK
      // =========================

      let currentStreak = 0;

      const today = new Date();

      const checkDate =
        new Date(today);

      /*
       * If the user has not done
       * anything today, check whether
       * yesterday was the most recent
       * active day.
       *
       * This keeps the streak alive
       * during the current day.
       */

      if (
        !activeDates.has(
          getDateKey(checkDate)
        )
      ) {
        checkDate.setDate(
          checkDate.getDate() - 1
        );
      }

      while (
        activeDates.has(
          getDateKey(checkDate)
        )
      ) {
        currentStreak++;

        checkDate.setDate(
          checkDate.getDate() - 1
        );
      }

      // =========================
      // LONGEST STREAK
      // =========================

      const sortedDates = [
        ...activeDates,
      ].sort();

      let longestStreak = 0;

      let runningStreak = 0;

      let previousDate = null;

      sortedDates.forEach(
        (dateString) => {
          const currentDate =
            new Date(
              `${dateString}T00:00:00`
            );

          if (!previousDate) {
            runningStreak = 1;
          } else {
            const difference =
              Math.round(
                (currentDate -
                  previousDate) /
                  (1000 *
                    60 *
                    60 *
                    24)
              );

            if (
              difference === 1
            ) {
              runningStreak++;
            } else {
              runningStreak = 1;
            }
          }

          longestStreak =
            Math.max(
              longestStreak,
              runningStreak
            );

          previousDate =
            currentDate;
        }
      );

      // =========================
      // TOTAL LESSONS
      // =========================

      const totalLessons =
        state.activityHistory.reduce(
          (total, day) =>
            total +
            day.lessonsCompleted,
          0
        );

      // =========================
      // TOTAL TIME
      // =========================

      const totalSeconds =
        state.activityHistory.reduce(
          (total, day) =>
            total +
            day.durationSeconds,
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

    // =========================
    // FINALIZE SESSION
    // =========================

    finalizeSession: (
      finalPerformance = null
    ) => {
      set((state) => {
        /*
         * addPerformance() and
         * finalizeSession() may happen
         * almost simultaneously.
         *
         * Therefore the final Mission
         * result is passed directly here.
         */

        const performance =
          finalPerformance
            ? [
                ...state.performance,
                finalPerformance,
              ]
            : state.performance;

        // =========================
        // SCORE
        // =========================

        const totalQuestions =
          performance.length;

        const correctAnswers =
          performance.filter(
            (item) =>
              item.correct === true
          ).length;

        const incorrectAnswers =
          totalQuestions -
          correctAnswers;

        /*
         * Every question has equal weight.
         *
         * 44 / 51 = 86%
         */

        const score =
          totalQuestions === 0
            ? 0
            : Math.round(
                (correctAnswers /
                  totalQuestions) *
                  100
              );

        // =========================
        // CONCEPT ANALYSIS
        // =========================

        const conceptStats = {};

        performance.forEach(
          (item) => {
            if (!item.conceptId) {
              return;
            }

            if (
              !conceptStats[
                item.conceptId
              ]
            ) {
              conceptStats[
                item.conceptId
              ] = {
                conceptId:
                  item.conceptId,

                attempts: 0,

                correct: 0,

                incorrect: 0,
              };
            }

            conceptStats[
              item.conceptId
            ].attempts += 1;

            if (
              item.correct === true
            ) {
              conceptStats[
                item.conceptId
              ].correct += 1;
            } else {
              conceptStats[
                item.conceptId
              ].incorrect += 1;
            }
          }
        );

        // =========================
        // WEAK CONCEPTS
        // =========================

        const weakConcepts =
          Object.values(
            conceptStats
          ).filter(
            (concept) =>
              concept.incorrect > 0 ||
              concept.attempts >= 2
          );

        // =========================
        // DURATION
        // =========================

        const durationSeconds =
          state.startedAt
            ? Math.round(
                (Date.now() -
                  state.startedAt) /
                  1000
              )
            : 0;

        // =========================
        // SESSION RESULT
        // =========================

        const result = {
          lessonId:
            state.lessonId,

          totalQuestions,

          correctAnswers,

          incorrectAnswers,

          score,

          weakConcepts,

          completedAt:
            Date.now(),

          durationSeconds,
        };

        // =========================
        // SAVE COMPLETED LESSON
        // =========================

        const updatedCompletedLessons =
          [
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

        saveCompletedLessons(
          updatedCompletedLessons
        );

        // =========================
        // UPDATE DAILY ACTIVITY
        // =========================

        const today =
          getDateKey();

        const existingActivity =
          state.activityHistory.find(
            (item) =>
              item.date === today
          );

        let updatedActivityHistory;

        if (existingActivity) {
          /*
           * Same day:
           *
           * Add another completed
           * lesson and its duration.
           */

          updatedActivityHistory =
            state.activityHistory.map(
              (item) =>
                item.date === today
                  ? {
                      ...item,

                      lessonsCompleted:
                        item.lessonsCompleted +
                        1,

                      durationSeconds:
                        item.durationSeconds +
                        durationSeconds,
                    }
                  : item
            );
        } else {
          /*
           * First lesson completed
           * today.
           */

          updatedActivityHistory =
            [
              ...state.activityHistory,

              {
                date: today,

                lessonsCompleted: 1,

                durationSeconds,
              },
            ];
        }

        saveActivityHistory(
          updatedActivityHistory
        );

        // =========================
        // RETURN UPDATED STATE
        // =========================

        return {
          sessionResult: result,

          isSessionActive: false,

          performance,

          completedLessons:
            updatedCompletedLessons,

          activityHistory:
            updatedActivityHistory,
        };
      });
    },

    // =========================
    // END SESSION
    // =========================

    endSession: () => {
      set({
        isSessionActive: false,
      });
    },
  })
);

export default useSessionStore;