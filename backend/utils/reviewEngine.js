// ==========================================
// REVIEW ENGINE
// Selects the 3 highest-priority concepts
// for the user's next lesson.
// ==========================================

const REVIEW_LIMIT = 3;

// ==========================================
// CALCULATE PRIORITY
// ==========================================

function calculatePriority(review) {
  const now = new Date();

  // -------------------------
  // Incorrect answers
  // -------------------------

  const incorrectCount = review.incorrectCount || 0;

  const failureScore = incorrectCount * 30;

  // -------------------------
  // Overdue days
  // -------------------------

  let overdueDays = 0;

  if (review.nextReviewAt) {
    const nextReview = new Date(review.nextReviewAt);

    const difference = now.getTime() - nextReview.getTime();

    overdueDays = Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
  }

  const overdueScore = overdueDays * 15;

  // -------------------------
  // Days since last review
  // -------------------------

  let daysSinceReview = 0;

  if (review.lastReviewedAt) {
    const lastReviewed = new Date(review.lastReviewedAt);

    const difference = now.getTime() - lastReviewed.getTime();

    daysSinceReview = Math.max(
      0,
      Math.floor(difference / (1000 * 60 * 60 * 24)),
    );
  }

  const recencyScore = daysSinceReview * 5;

  // -------------------------
  // Difficulty
  // -------------------------

  const difficulty = review.difficulty || 1;

  const difficultyScore = difficulty * 10;

  // -------------------------
  // FINAL PRIORITY
  // -------------------------

  const priority =
    failureScore + overdueScore + recencyScore + difficultyScore;

  return {
    priority,
    overdueDays,
    daysSinceReview,
  };
}

// ==========================================
// SELECT TOP 3 REVIEWS
// ==========================================

export function selectPriorityReviews(reviews, limit = REVIEW_LIMIT) {
  if (!Array.isArray(reviews)) {
    return [];
  }

  // Guard against malformed/legacy documents (e.g. saved before
  // conceptId/french/english were required, or created through a
  // path that skipped validation). Without this filter a single bad
  // Mongo document can silently reach the frontend and break the
  // review flow with no useful error.
  const validReviews = reviews.filter(
    (review) => review.conceptId && review.french && review.english,
  );

  const skipped = reviews.length - validReviews.length;

  if (skipped > 0) {
    console.warn(
      `⚠️ selectPriorityReviews: skipped ${skipped} review doc(s) missing conceptId/french/english`,
    );
  }

  const scoredReviews = validReviews.map((review) => {
    const { priority, overdueDays, daysSinceReview } =
      calculatePriority(review);

    return {
      ...review.toObject(),
      priority,
      overdueDays,
      daysSinceReview,
    };
  });

  // Highest priority first
  scoredReviews.sort((a, b) => b.priority - a.priority);

  // Only return the fixed number
  return scoredReviews.slice(0, limit);
}