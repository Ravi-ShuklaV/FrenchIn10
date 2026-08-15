import Review from "../models/Review.js";
import { selectPriorityReviews } from "../utils/reviewEngine.js";

// ======================================================
// GET ALL ACTIVE REVIEWS
// Optional ?lessonId= filter so pages can ask for just
// the reviews belonging to one lesson.
// ======================================================

export async function getReview(req, res) {
  try {
    const { lessonId } = req.query;

    const query = { user: req.user.id };

    if (lessonId !== undefined) {
      query.lessonId = Number(lessonId);
    }

    const reviews = await Review.find(query).sort({ nextReviewAt: 1 });

    res.json(reviews);
  } catch (error) {
    console.error("========== REVIEW ERROR ==========");
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
}

// ======================================================
// ADD / UPDATE REVIEW
// ======================================================

export async function addReview(req, res) {
  try {
    console.log("🔥 REVIEW REQUEST");
    console.log("BODY:", req.body);
    console.log("USER:", req.user.id);

    const { conceptId, lessonId, french, english, type, correct } = req.body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!conceptId) {
      return res.status(400).json({
        message: "conceptId is required",
      });
    }

    if (typeof correct !== "boolean") {
      return res.status(400).json({
        message: "correct must be true or false",
      });
    }

    // ==================================================
    // CORRECT ANSWER — concept is mastered, remove it
    // from the active review collection.
    // ==================================================

    if (correct === true) {
      const deleteResult = await Review.deleteMany({
        user: req.user.id,
        conceptId,
      });

      console.log("✅ REVIEW MASTERED:", conceptId);
      console.log("🗑️ REVIEW DOCUMENTS REMOVED:", deleteResult.deletedCount);

      return res.status(200).json({
        success: true,
        mastered: true,
        deleted: deleteResult.deletedCount > 0,
        deletedCount: deleteResult.deletedCount,
        conceptId,
      });

      console.log("✅ REVIEW MASTERED:", conceptId);
      console.log("🗑️ REVIEW REMOVED:", deletedReview?._id || "not found");

      return res.status(200).json({
        success: true,
        mastered: true,
        deleted: Boolean(deletedReview),
        conceptId,
      });
    }

    // ==================================================
    // INCORRECT ANSWER
    // ==================================================

    let review = await Review.findOne({
      user: req.user.id,
      conceptId,
    });

    if (!review) {
      review = new Review({
        user: req.user.id,
        conceptId,
        lessonId,
        french,
        english,
        type,
      });
    }

    review.incorrectCount += 1;

    review.difficulty = Math.min(5, review.difficulty + 0.5);

    review.repetitions = 0;
    review.interval = 1;

    review.lastReviewedAt = new Date();

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + review.interval);

    review.nextReviewAt = nextReview;

    await review.save();

    console.log("❌ REVIEW FAILED — kept in review:", review.conceptId);

    return res.status(200).json(review);
  } catch (error) {
    console.error("========== REVIEW UPDATE ERROR ==========");
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
}

// ======================================================
// GET DUE REVIEWS
// ======================================================

export async function getDueReviews(req, res) {
  try {
    const reviews = await Review.find({
      user: req.user.id,
    });

    const selectedReviews = selectPriorityReviews(reviews, 3);

    res.json(selectedReviews);
  } catch (error) {
    console.error("========== DUE REVIEW ERROR ==========");
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
}
