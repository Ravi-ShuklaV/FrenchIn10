import { useEffect, useState } from "react";
import useSessionStore from "../../store/sessionStore";

function GrammarSection({ concepts }) {
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

  // Get grammar concepts
  const grammar = concepts.filter((concept) => concept.type === "grammar");

  // Convert concept questions into one flat array
  const questions = grammar.flatMap((concept) =>
    concept.questions.map((question) => ({
      ...question,
      conceptId: concept.conceptId,
    })),
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReinforcing, setIsReinforcing] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  /*
   * Find a grammar concept currently
   * waiting for reinforcement.
   */
  const reinforcementConcept = reinforcementQueue.find(
    (concept) => concept.type === "grammar",
  );

  const reinforcementQuestion = reinforcementConcept?.questions?.[0];

  const currentQuestion = isReinforcing
    ? reinforcementQuestion
    : questions[currentIndex];

  const currentConceptId = isReinforcing
    ? reinforcementConcept?.conceptId
    : questions[currentIndex]?.conceptId;

  // Reset UI when question changes
  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setSelectedAnswer(null);
    setAttempts(0);
    setFeedback(null);
    setIsWrong(false);
  }, [currentIndex, isReinforcing, currentQuestion?.question]);

  function handleAnswer(option, optionIndex) {
    if (!currentQuestion) return;

    // Don't allow another click while correct
    // answer is transitioning
    if (feedback?.type === "correct") {
      return;
    }

    setSelectedAnswer(option);

    const currentAttempt = attempts + 1;

    let correct = false;

    if (typeof currentQuestion.correctAnswer === "number") {
      correct = optionIndex === currentQuestion.correctAnswer;
    } else {
      correct = option === currentQuestion.correctAnswer;
    }

    const responseTime = Math.round((Date.now() - questionStartedAt) / 1000);

    // Record attempt
    addPerformance({
      conceptId: currentConceptId,
      section: "grammar",
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
        message: isReinforcing ? "Nice! You remembered it. 🎉" : "Correct! 🎉",
      });

      setTimeout(() => {
        // Reinforcement question
        if (isReinforcing) {
          removeFromReinforcementQueue(currentConceptId);

          setIsReinforcing(false);

          // Check if more grammar concepts need reinforcement
          const remainingGrammarReinforcement = useSessionStore
            .getState()
            .reinforcementQueue.some((concept) => concept.type === "grammar");

          if (remainingGrammarReinforcement) {
            return;
          }

          // Grammar is completely finished
          nextSection();

          return;
        }

        // Last normal grammar question
        if (currentIndex >= questions.length - 1) {
          /*
           * Check the CURRENT Zustand state rather
           * than relying on a potentially stale array.
           */
          const currentQueue = useSessionStore.getState().reinforcementQueue;

          const grammarWeakConcept = currentQueue.find(
            (concept) => concept.type === "grammar",
          );

          if (grammarWeakConcept) {
            setIsReinforcing(true);
            return;
          }

          // Grammar completely finished
          nextSection();

          return;
        }

        // Next normal grammar question
        setCurrentIndex((prev) => prev + 1);
      }, 700);

      return;
    }

    // =========================
    // WRONG
    // =========================

    setAttempts(currentAttempt);

    if (currentAttempt >= 2) {
      /*
       * Find the actual grammar concept
       * from the concepts array.
       */
      const weakConcept = grammar.find(
        (concept) => concept.conceptId === currentConceptId,
      );

      if (weakConcept) {
        addToReinforcementQueue(weakConcept);
      }
    }

    setFeedback({
      type: "wrong",
      message:
        currentAttempt >= 2
          ? "We'll practice this again later."
          : "Not quite. Try again!",
    });

    setIsWrong(false);

    requestAnimationFrame(() => {
      setIsWrong(true);
    });

    // Allow another attempt
    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      setIsWrong(false);
    }, 900);
  }

  // Safety check
  if (!currentQuestion) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold text-slate-800">Grammar complete!</h3>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Heading */}

      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">
          {isReinforcing ? "Let's reinforce this" : "Grammar"}
        </p>

        <h3 className="text-3xl font-bold text-slate-800 mt-2">
          {isReinforcing
            ? "Can you get it this time?"
            : "Choose the correct answer"}
        </h3>

        {isReinforcing && (
          <p className="text-gray-500 mt-3">
            This concept needs a little more practice.
          </p>
        )}
      </div>

      {/* Question Card */}

      <div
        className={`bg-white border rounded-2xl shadow-sm p-8 ${
          isWrong ? "animate-shake border-red-400" : "border-gray-200"
        }`}
        onAnimationEnd={() => setIsWrong(false)}
      >
        <p className="text-xl font-semibold text-slate-800 text-center">
          {currentQuestion.question}
        </p>

        {/* Options */}

        <div className="mt-8 space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;

            const isCorrect =
              typeof currentQuestion.correctAnswer === "number"
                ? index === currentQuestion.correctAnswer
                : option === currentQuestion.correctAnswer;

            let classes =
              "w-full text-left border rounded-xl px-4 py-3 transition ";

            if (feedback?.type === "correct" && isSelected) {
              classes += "bg-emerald-100 border-emerald-500 text-emerald-700";
            } else if (feedback?.type === "wrong" && isSelected) {
              classes += "bg-red-100 border-red-500 text-red-700";
            } else {
              classes +=
                "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50";
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleAnswer(option, index)}
                className={classes}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}

        {feedback && (
          <div
            className={`mt-6 p-4 rounded-xl text-center font-semibold ${
              feedback.type === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-5">
          Attempt {attempts + 1}
        </p>
      </div>

      {/* Progress */}

      {!isReinforcing && (
        <p className="text-center text-sm text-gray-400 mt-5">
          {currentIndex + 1} / {questions.length}
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

export default GrammarSection;
