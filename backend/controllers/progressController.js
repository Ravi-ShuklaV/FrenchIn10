import Progress from "../models/Progress.js";
import Review from "../models/Review.js";

export async function saveProgress(req, res) {
  try {
    const {
      lessonId,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      score,
      durationSeconds,
      skillStats,
      weakConcepts,
    } = req.body;

    if (lessonId === undefined || lessonId === null) {
      return res.status(400).json({
        message: "lessonId is required",
      });
    }

    // ==========================================
    // 1. SAVE LESSON PROGRESS
    // ==========================================

    const progress = await Progress.create({
      user: req.user.id,
      lessonId,
      totalQuestions: totalQuestions || 0,
      correctAnswers: correctAnswers || 0,
      incorrectAnswers: incorrectAnswers || 0,
      score: score || 0,
      durationSeconds: durationSeconds || 0,
      skillStats: skillStats || {},
      weakConcepts: weakConcepts || [],
      completed: true,
    });

    console.log("🔥 WEAK CONCEPTS RECEIVED BY BACKEND:", weakConcepts);

    // ==========================================
    // 2. SYNC WEAK CONCEPTS INTO REVIEW
    // ==========================================

    if (Array.isArray(weakConcepts) && weakConcepts.length > 0) {
      for (const weak of weakConcepts) {
        console.log("🔥 PROCESSING WEAK CONCEPT:", weak);

        // ----------------------------------------
        // Skip invalid concepts
        // ----------------------------------------

        if (!weak?.conceptId) {
          console.log("⚠️ Skipping — no conceptId");
          continue;
        }

        // ----------------------------------------
        // IMPORTANT:
        // Only actual weak concepts enter Review.
        // ----------------------------------------

        const incorrect = Number(weak.incorrect) || 0;

        if (incorrect <= 0) {
          console.log(
            "⚠️ Skipping — concept has no incorrect answers:",
            weak.conceptId,
          );
          continue;
        }

        const attempts = Number(weak.attempts) || incorrect;

        console.log("📊 Review data:", {
          conceptId: weak.conceptId,
          incorrect,
          attempts,
        });

        // ======================================
        // FIND EXISTING REVIEW
        // ======================================

        const review = await Review.findOne({
          user: req.user.id,
          conceptId: weak.conceptId,
        });

        // ======================================
        // EXISTING REVIEW
        // ======================================

        if (review) {
          console.log("🔄 EXISTING REVIEW FOUND:", review._id);

          review.incorrectCount += incorrect;

          review.difficulty = Math.min(
            5,
            review.difficulty + Math.max(0.5, incorrect * 0.5),
          );

          // Failed concept needs to be reviewed again.
          review.repetitions = 0;
          review.interval = 1;

          review.lastReviewedAt = new Date();

          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + 1);

          review.nextReviewAt = nextReview;

          await review.save();

          console.log("✅ REVIEW UPDATED:", review);
        }

        // ======================================
        // NEW REVIEW
        // ======================================

        else {
          console.log("🆕 NO REVIEW FOUND — CREATING NEW REVIEW");

          const nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + 1);

          // Both french and english fall back to the conceptId so a
          // missing/empty value from the frontend can NEVER fail the
          // schema's `required: true` validator and take down the
          // whole progress save. Never coerce a falsy value to
          // `undefined` here — that defeats the fallback entirely.
          try {
            const newReview = await Review.create({
              user: req.user.id,

              lessonId,

              conceptId: weak.conceptId,

              french: weak.french || weak.conceptId,

              english: weak.english || weak.conceptId,

              type: weak.type || "vocabulary",

              incorrectCount: incorrect,

              correctCount: 0,

              repetitions: 0,

              interval: 1,

              difficulty: Math.min(5, 1 + Math.max(0.5, incorrect * 0.5)),

              lastReviewedAt: new Date(),

              nextReviewAt: nextReview,
            });

            console.log("✅ NEW REVIEW CREATED:", newReview);
          } catch (reviewError) {
            // A single bad weak-concept payload should not fail the
            // whole progress save (which already succeeded above).
            // Log it and keep syncing the rest of the queue.
            console.error(
              "❌ FAILED TO CREATE REVIEW for",
              weak.conceptId,
              reviewError,
            );
          }
        }
      }
    } else {
      console.log("ℹ️ No weak concepts to sync.");
    }

    // ==========================================
    // 3. RETURN SAVED PROGRESS
    // ==========================================

    res.status(201).json(progress);
  } catch (error) {
    console.error("❌ SAVE PROGRESS ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
}

// ==========================================
// GET USER PROGRESS
// ==========================================

export async function getProgress(req, res) {
  try {
    const progress = await Progress.find({
      user: req.user.id,
    }).sort({
      completedAt: -1,
      createdAt: -1,
    });

    res.json(progress);
  } catch (error) {
    console.error("❌ GET PROGRESS ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
}