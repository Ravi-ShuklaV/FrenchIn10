import { useEffect, useState } from "react";
import useSessionStore from "../../store/sessionStore";

function VocabularySection({ concepts }) {
  const addPerformance = useSessionStore(
    (state) => state.addPerformance
  );

  const addToReinforcementQueue = useSessionStore(
    (state) => state.addToReinforcementQueue
  );

  const reinforcementQueue = useSessionStore(
    (state) => state.reinforcementQueue
  );

  const removeFromReinforcementQueue = useSessionStore(
    (state) => state.removeFromReinforcementQueue
  );

  const nextSection = useSessionStore(
    (state) => state.nextSection
  );

  const vocabulary = concepts.filter(
    (concept) => concept.type === "vocabulary"
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReinforcing, setIsReinforcing] = useState(false);

  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(
    Date.now()
  );

  const [feedback, setFeedback] = useState(null);
  const [isWrong, setIsWrong] = useState(false);

  const currentConcept = isReinforcing
    ? reinforcementQueue[0]
    : vocabulary[currentIndex];

  // Reset question state whenever a new question loads
  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setIsWrong(false);
    setFeedback(null);
    setAnswer("");
    setAttempts(0);
  }, [currentConcept?.conceptId, isReinforcing]);

  function normalizeText(text) {
    return text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function handleSubmit() {
    if (!answer.trim() || !currentConcept) return;

    const currentAttempt = attempts + 1;

    const normalizedAnswer = normalizeText(answer);

    const expectedAnswer = normalizeText(
      currentConcept.french
    );

    const correct =
      normalizedAnswer === expectedAnswer;

    const responseTime = Math.round(
      (Date.now() - questionStartedAt) / 1000
    );

    // Record performance
    addPerformance({
      conceptId: currentConcept.conceptId,
      section: "vocabulary",
      attempts: currentAttempt,
      correct,
      responseTime,
      hintsUsed: 0,
      isReinforcement: isReinforcing,
    });

    // =========================
    // CORRECT
    // =========================

    if (correct) {
      setIsWrong(false);

      setFeedback({
        type: "correct",
        message: isReinforcing
          ? "Nice! You remembered it. 🎉"
          : "Correct! 🎉",
      });

      setTimeout(() => {
        setAnswer("");
        setFeedback(null);
        setAttempts(0);

        // -------------------------
        // Reinforcement question
        // -------------------------

        if (isReinforcing) {
          removeFromReinforcementQueue(
            currentConcept.conceptId
          );

          // More weak concepts remain
          if (reinforcementQueue.length > 1) {
            return;
          }

          // Reinforcement finished
          setIsReinforcing(false);
          nextSection();

          return;
        }

        // -------------------------
        // Last normal vocabulary question
        // -------------------------

        if (currentIndex >= vocabulary.length - 1) {
          // Weak concepts need reinforcement
          if (reinforcementQueue.length > 0) {
            setIsReinforcing(true);
            return;
          }

          // Vocabulary completely finished
          nextSection();

          return;
        }

        // -------------------------
        // Next normal question
        // -------------------------

        setCurrentIndex((prev) => prev + 1);
      }, 700);

      return;
    }

    // =========================
    // WRONG
    // =========================

    setAttempts(currentAttempt);

    // Add to reinforcement after 2 failed attempts
    if (currentAttempt >= 2) {
      addToReinforcementQueue(currentConcept);
    }

    setFeedback({
      type: "wrong",
      message:
        currentAttempt >= 2
          ? "Still struggling? We'll practice this again later."
          : "Not quite. Try again!",
    });

    // Trigger one shake animation
    setIsWrong(false);

    requestAnimationFrame(() => {
      setIsWrong(true);
    });
  }

  if (!currentConcept) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto">

      {/* Heading */}

      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">
          {isReinforcing
            ? "Let's try that again"
            : "Vocabulary"}
        </p>

        <h3 className="text-3xl font-bold text-slate-800 mt-2">
          {isReinforcing
            ? "Can you remember this one?"
            : "What is this in French?"}
        </h3>

        {isReinforcing && (
          <p className="text-gray-500 mt-3">
            Let's reinforce the words that were difficult.
          </p>
        )}
      </div>

      {/* Question Card */}

      <div
        key={`${currentConcept.conceptId}-${isReinforcing}`}
        className={`bg-white border rounded-2xl shadow-sm p-8 ${
          isWrong
            ? "animate-shake border-red-400"
            : "border-gray-200"
        }`}
        onAnimationEnd={() => setIsWrong(false)}
      >

        <div className="text-center">
          <p className="text-2xl font-semibold text-slate-800">
            {currentConcept.english}
          </p>

          <p className="text-sm text-gray-400 mt-2">
            Attempt {attempts + 1}
          </p>
        </div>

        {/* Input */}

        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder="Type your answer in French..."
          className={`w-full mt-8 border rounded-xl px-4 py-3 outline-none transition ${
            feedback?.type === "wrong"
              ? "border-red-400 focus:ring-2 focus:ring-red-300"
              : feedback?.type === "correct"
              ? "border-emerald-400 focus:ring-2 focus:ring-emerald-300"
              : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
          }`}
          autoFocus
        />

        {/* Button */}

        <button
          onClick={handleSubmit}
          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
        >
          Check Answer
        </button>

        {/* Feedback */}

        {feedback && (
          <div
            className={`mt-5 p-4 rounded-xl text-center font-semibold ${
              feedback.type === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}

            {feedback.type === "wrong" && (
              <p className="text-sm font-normal mt-1">
                Try again.
              </p>
            )}
          </div>
        )}

      </div>

      {/* Progress */}

      {!isReinforcing && (
        <p className="text-center text-sm text-gray-400 mt-5">
          {currentIndex + 1} / {vocabulary.length}
        </p>
      )}

      {isReinforcing && (
        <p className="text-center text-sm text-amber-600 mt-5">
          Reinforcement round
        </p>
      )}

    </div>
  );
}

export default VocabularySection;