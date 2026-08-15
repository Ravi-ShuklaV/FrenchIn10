import Review from "../models/Review.js";
import { selectPriorityReviews } from "../utils/reviewEngine.js";

// ======================================================
// GET ALL ACTIVE REVIEWS
// Optional ?lessonId= filter
// ======================================================

export async function getReview(req, res) {
  try {
    const { lessonId } = req.query;

    const query = {
      user: req.user.id,
    };

    if (lessonId !== undefined) {
      query.lessonId = Number(lessonId);
    }

    const reviews = await Review.find(query).sort({
      nextReviewAt: 1,
    });

    res.json(reviews);
  } catch (error) {
    console.error("GET REVIEW ERROR:", error);

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
    const {
      conceptId,
      lessonId,
      french,
      english,
      type,
      correct,
    } = req.body;

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
    // CORRECT
    //
    // A correct review means the concept has been
    // successfully mastered for this review cycle.
    //
    // Remove it from the active Review collection.
    // ==================================================

    if (correct === true) {
      const deleteResult = await Review.deleteMany({
        user: req.user.id,
        conceptId,
      });

      return res.status(200).json({
        success: true,
        mastered: true,
        deleted: deleteResult.deletedCount > 0,
        deletedCount: deleteResult.deletedCount,
        conceptId,
      });
    }

    // ==================================================
    // INCORRECT
    //
    // Keep the concept in the review collection and
    // schedule it again.
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

    review.difficulty = Math.min(
      5,
      review.difficulty + 0.5
    );

    review.repetitions = 0;
    review.interval = 1;

    review.lastReviewedAt = new Date();

    const nextReview = new Date();

    nextReview.setDate(
      nextReview.getDate() + review.interval
    );

    review.nextReviewAt = nextReview;

    await review.save();

    return res.status(200).json(review);
  } catch (error) {
    console.error("REVIEW UPDATE ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
}

// ======================================================
// GET PRIORITY / DUE REVIEWS
// ======================================================

export async function getDueReviews(req, res) {
  try {
    const reviews = await Review.find({
      user: req.user.id,
    });

    const selectedReviews =
      selectPriorityReviews(reviews, 3);

    res.json(selectedReviews);
  } catch (error) {
    console.error("DUE REVIEW ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
}