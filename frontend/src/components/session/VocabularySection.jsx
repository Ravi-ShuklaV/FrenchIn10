import { useEffect, useState } from "react";
import useSessionStore from "../../store/sessionStore";
import SpeakButton from "../common/SpeakerButton";

function VocabularySection({ concepts }) {
  const addPerformance = useSessionStore((state) => state.addPerformance);

  const addToReinforcementQueue = useSessionStore(
    (state) => state.addToReinforcementQueue,
  );

  const reinforcementQueue = useSessionStore(
    (state) => state.reinforcementQueue,
  );

  const removeFromReinforcementQueue = useSessionStore(
    (state) => state.removeFromReinforcementQueue,
  );

  const nextSection = useSessionStore((state) => state.nextSection);

  const vocabulary = concepts.filter(
    (concept) => concept.type === "vocabulary",
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReinforcing, setIsReinforcing] = useState(false);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [feedback, setFeedback] = useState(null);
  const [isWrong, setIsWrong] = useState(false);

  const currentConcept = isReinforcing
    ? reinforcementQueue[0]
    : vocabulary[currentIndex];

  // Reset question state
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
    if (!answer.trim() || !currentConcept) {
      return;
    }

    const currentAttempt = attempts + 1;

    const normalizedAnswer = normalizeText(answer);
    const expectedAnswer = normalizeText(currentConcept.french);

    const correct = normalizedAnswer === expectedAnswer;

    const responseTime = Math.round(
      (Date.now() - questionStartedAt) / 1000,
    );

    // Record performance
    addPerformance({
      questionId: `vocabulary_${currentConcept.conceptId}${
        isReinforcing ? "_reinforcement" : ""
      }`,

      conceptId: currentConcept.conceptId,

      french: currentConcept.french || "",
      english: currentConcept.english || "",
      type: currentConcept.type || "vocabulary",

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

        // Reinforcement question
        if (isReinforcing) {
          removeFromReinforcementQueue(currentConcept.conceptId);

          if (reinforcementQueue.length > 1) {
            return;
          }

          setIsReinforcing(false);
          nextSection();

          return;
        }

        // Last normal vocabulary question
        if (currentIndex >= vocabulary.length - 1) {
          if (reinforcementQueue.length > 0) {
            setIsReinforcing(true);
            return;
          }

          nextSection();
          return;
        }

        // Next normal question
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
          ? "Still struggling? We'll practice this again later."
          : "Not quite. Try again!",
    });

    setIsWrong(false);

    requestAnimationFrame(() => {
      setIsWrong(true);
    });
  }

  if (!currentConcept) {
    return null;
  }

  return (
    <div className="w-full max-w-sm mx-auto">

      {/* HEADING */}

      <div className="text-center mb-2">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          {isReinforcing ? "Let's try that again" : "Vocabulary"}
        </p>

        <h3 className="text-base font-bold text-slate-800">
          {isReinforcing
            ? "Can you remember this one?"
            : "What is this in French?"}
        </h3>
      </div>

      {/* QUESTION CARD */}

      <div
        key={`${currentConcept.conceptId}-${isReinforcing}`}
        className={`bg-white border rounded-2xl shadow-sm p-3 ${
          isWrong
            ? "animate-shake border-red-400"
            : "border-gray-200"
        }`}
        onAnimationEnd={() => setIsWrong(false)}
      >

        {/* ENGLISH QUESTION */}

        <div className="text-center">
          <p className="text-base font-semibold text-slate-800">
            {currentConcept.english}
          </p>

          <p className="text-[10px] text-gray-400">
            Attempt {attempts + 1}
          </p>
        </div>

        {/* ANSWER INPUT */}

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
          className={`w-full mt-2 border rounded-xl px-3 py-1.5 text-sm outline-none transition ${
            feedback?.type === "wrong"
              ? "border-red-400 focus:ring-2 focus:ring-red-300"
              : feedback?.type === "correct"
                ? "border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
          }`}
          autoFocus
        />

        {/* CHECK */}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full mt-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 rounded-xl transition text-sm"
        >
          Check Answer
        </button>

        {/* FEEDBACK */}

        <div className="mt-1.5 min-h-[2rem]">
          {feedback && (
            <div
              className={`p-2 rounded-lg text-center text-xs ${
                feedback.type === "correct"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {/* MESSAGE */}

              <p className="font-semibold">
                {feedback.message}
              </p>

              {/* FRENCH ANSWER + SPEAKER */}

              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="font-bold text-sm">
                  {currentConcept.french}
                </span>

                <SpeakButton
                  text={currentConcept.french}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROGRESS */}

      {!isReinforcing && (
        <p className="text-center text-[10px] text-gray-400 mt-1.5">
          {currentIndex + 1} / {vocabulary.length}
        </p>
      )}

      {isReinforcing && (
        <p className="text-center text-[10px] text-amber-600 mt-1.5">
          Reinforcement round
        </p>
      )}
    </div>
  );
}

export default VocabularySection;