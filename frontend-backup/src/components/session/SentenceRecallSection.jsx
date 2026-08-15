import { useEffect, useState } from "react";
import useSessionStore from "../../store/sessionStore";

function SentenceRecallSection({ concepts }) {
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

  const sentences = concepts.filter(
    (concept) => concept.type === "sentence"
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReinforcing, setIsReinforcing] = useState(false);

  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(
    Date.now()
  );

  const reinforcementConcept = reinforcementQueue.find(
    (concept) => concept.type === "sentence"
  );

  const currentConcept = isReinforcing
    ? reinforcementConcept
    : sentences[currentIndex];

  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setAnswer("");
    setAttempts(0);
    setFeedback(null);
    setIsWrong(false);
  }, [currentConcept?.conceptId, isReinforcing]);

function normalizeText(text) {
  return text
    .trim()
    .toLowerCase()
    // Remove accents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Remove punctuation
    .replace(/[.,!?;:'"()\-–—]/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

  function handleSubmit() {
    if (!answer.trim() || !currentConcept) return;

    if (feedback?.type === "correct") return;

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

    addPerformance({
      conceptId: currentConcept.conceptId,
      section: "sentenceRecall",
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
          ? "Nice! You remembered the sentence. 🎉"
          : "Correct! 🎉",
      });

      setTimeout(() => {
        // Reinforcement
        if (isReinforcing) {
          removeFromReinforcementQueue(
            currentConcept.conceptId
          );

          const remaining =
            useSessionStore
              .getState()
              .reinforcementQueue
              .some(
                (concept) =>
                  concept.type === "sentence"
              );

          if (remaining) {
            setFeedback(null);
            setAnswer("");
            return;
          }

          setIsReinforcing(false);
          nextSection();

          return;
        }

        // Last normal sentence
        if (currentIndex >= sentences.length - 1) {
          const hasReinforcement =
            useSessionStore
              .getState()
              .reinforcementQueue
              .some(
                (concept) =>
                  concept.type === "sentence"
              );

          if (hasReinforcement) {
            setIsReinforcing(true);
            return;
          }

          nextSection();
          return;
        }

        // Next sentence
        setCurrentIndex((prev) => prev + 1);
      }, 700);

      return;
    }

    // =========================
    // WRONG
    // =========================

    setAttempts(currentAttempt);

    if (currentAttempt >= 2) {
      addToReinforcementQueue(currentConcept);
    }

    setFeedback({
      type: "wrong",
      message:
        currentAttempt >= 2
          ? "We'll practice this sentence again later."
          : "Not quite. Try again!",
    });

    setIsWrong(false);

    requestAnimationFrame(() => {
      setIsWrong(true);
    });

    // Let the learner try again
    setTimeout(() => {
      setFeedback(null);
      setAnswer("");
      setIsWrong(false);
    }, 900);
  }

  if (!currentConcept) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold text-slate-800">
          Sentence Recall complete!
        </h3>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">

      {/* Heading */}

      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">
          {isReinforcing
            ? "Let's try that again"
            : "Sentence Recall"}
        </p>

        <h3 className="text-3xl font-bold text-slate-800 mt-2">
          {isReinforcing
            ? "Can you remember it now?"
            : "Say it in French"}
        </h3>

        {isReinforcing && (
          <p className="text-gray-500 mt-3">
            This sentence needs a little more practice.
          </p>
        )}
      </div>

      {/* Question Card */}

      <div
        className={`bg-white border rounded-2xl shadow-sm p-8 ${
          isWrong
            ? "animate-shake border-red-400"
            : "border-gray-200"
        }`}
        onAnimationEnd={() => setIsWrong(false)}
      >

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Translate this sentence
          </p>

          <p className="text-2xl font-semibold text-slate-800 mt-3">
            {currentConcept.english}
          </p>

          <p className="text-sm text-gray-400 mt-3">
            Attempt {attempts + 1}
          </p>
        </div>

        {/* Answer */}

        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            }
          }}
          placeholder="Write the sentence in French..."
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
          type="button"
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
          {currentIndex + 1} / {sentences.length}
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

export default SentenceRecallSection;