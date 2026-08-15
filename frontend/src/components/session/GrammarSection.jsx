import { useEffect, useMemo, useState } from "react";
import useSessionStore from "../../store/sessionStore";

function GrammarSection({ concepts = [] }) {
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

  // ======================================================
  // NORMALIZE GRAMMAR DATA
  //
  // Supports:
  //
  // 1. concepts = [...]
  //
  // 2. concepts = learning.grammar
  //
  // 3. concepts = {
  //      grammar: [...]
  //    }
  // ======================================================

  const grammar = useMemo(() => {
    if (Array.isArray(concepts)) {
      return concepts.filter(
        (concept) => concept?.type === "grammar"
      );
    }

    if (
      concepts &&
      Array.isArray(concepts.grammar)
    ) {
      return concepts.grammar;
    }

    return [];
  }, [concepts]);

  // ======================================================
  // FLATTEN QUESTIONS
  // ======================================================

  const questions = useMemo(() => {
    return grammar.flatMap((concept) => {
      if (!Array.isArray(concept?.questions)) {
        return [];
      }

      return concept.questions.map((question) => ({
        ...question,

        conceptId: concept.conceptId,

        french: concept.french || "",

        english: concept.english || "",

        conceptType: concept.type || "grammar",
      }));
    });
  }, [grammar]);

  // ======================================================
  // STATE
  // ======================================================

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [isReinforcing, setIsReinforcing] =
    useState(false);

  const [selectedAnswer, setSelectedAnswer] =
    useState(null);

  const [attempts, setAttempts] =
    useState(0);

  const [feedback, setFeedback] =
    useState(null);

  const [isWrong, setIsWrong] =
    useState(false);

  const [questionStartedAt, setQuestionStartedAt] =
    useState(Date.now());

  // ======================================================
  // REINFORCEMENT CONCEPT
  // ======================================================

  const reinforcementConcept =
    reinforcementQueue.find(
      (concept) =>
        concept?.type === "grammar"
    );

  const reinforcementQuestion =
    reinforcementConcept?.questions?.[0];

  // ======================================================
  // CURRENT QUESTION
  // ======================================================

  const currentQuestion = isReinforcing
    ? reinforcementQuestion
    : questions[currentIndex];

  const currentConceptId = isReinforcing
    ? reinforcementConcept?.conceptId
    : questions[currentIndex]?.conceptId;

  // ======================================================
  // RESET QUESTION
  // ======================================================

  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setSelectedAnswer(null);
    setAttempts(0);
    setFeedback(null);
    setIsWrong(false);
  }, [
    currentIndex,
    isReinforcing,
    currentQuestion?.question,
  ]);

  // ======================================================
  // CHECK ANSWER
  // ======================================================

  function checkAnswer(option, optionIndex) {
    if (!currentQuestion) {
      return false;
    }

    const correctAnswer =
      currentQuestion.correctAnswer;

    // New JSON:
    //
    // correctAnswer: "voudrais"
    //
    // Old JSON may also use:
    //
    // correctAnswer: 1
    //

    if (typeof correctAnswer === "number") {
      return optionIndex === correctAnswer;
    }

    return (
      String(option).trim().toLowerCase() ===
      String(correctAnswer)
        .trim()
        .toLowerCase()
    );
  }

  // ======================================================
  // ANSWER
  // ======================================================

  function handleAnswer(
    option,
    optionIndex
  ) {
    if (!currentQuestion) {
      return;
    }

    // Don't allow another click while
    // correct feedback is displayed.
    if (feedback?.type === "correct") {
      return;
    }

    setSelectedAnswer(option);

    const currentAttempt =
      attempts + 1;

    const correct = checkAnswer(
      option,
      optionIndex
    );

    const responseTime = Math.round(
      (Date.now() - questionStartedAt) / 1000
    );

    // ==================================================
    // RECORD PERFORMANCE
    // ==================================================

    addPerformance({
      conceptId: currentConceptId,

      french:
        currentQuestion.french ||
        currentQuestion.correctAnswer ||
        "",

      english:
        currentQuestion.english ||
        currentQuestion.question ||
        "",

      type: "grammar",

      section: "grammar",

      attempts: currentAttempt,

      correct,

      score: correct ? 1 : 0,

      responseTime,

      hintsUsed: 0,

      isReinforcement,
    });

    // ==================================================
    // CORRECT
    // ==================================================

    if (correct) {
      setIsWrong(false);

      setFeedback({
        type: "correct",
        message: isReinforcing
          ? "Nice! You remembered it. 🎉"
          : "Correct! 🎉",
      });

      setTimeout(() => {
        // ==============================================
        // REINFORCEMENT QUESTION
        // ==============================================

        if (isReinforcing) {
          removeFromReinforcementQueue(
            currentConceptId
          );

          setIsReinforcing(false);

          const remainingGrammarReinforcement =
            useSessionStore
              .getState()
              .reinforcementQueue.some(
                (concept) =>
                  concept?.type === "grammar"
              );

          if (
            remainingGrammarReinforcement
          ) {
            return;
          }

          nextSection();

          return;
        }

        // ==============================================
        // LAST NORMAL GRAMMAR QUESTION
        // ==============================================

        if (
          currentIndex >=
          questions.length - 1
        ) {
          const currentQueue =
            useSessionStore
              .getState()
              .reinforcementQueue;

          const grammarWeakConcept =
            currentQueue.find(
              (concept) =>
                concept?.type === "grammar"
            );

          if (grammarWeakConcept) {
            setIsReinforcing(true);
            return;
          }

          nextSection();

          return;
        }

        // ==============================================
        // NEXT NORMAL QUESTION
        // ==============================================

        setCurrentIndex(
          (previous) =>
            previous + 1
        );
      }, 700);

      return;
    }

    // ==================================================
    // WRONG
    // ==================================================

    setAttempts(currentAttempt);

    // After two failed attempts, put the
    // concept into reinforcement.
    if (currentAttempt >= 2) {
      const weakConcept =
        grammar.find(
          (concept) =>
            concept.conceptId ===
            currentConceptId
        );

      if (weakConcept) {
        addToReinforcementQueue(
          weakConcept
        );
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

    // Allow another attempt.
    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      setIsWrong(false);
    }, 900);
  }

  // ======================================================
  // SAFETY CHECK
  // ======================================================

  if (!currentQuestion) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold text-slate-800">
          Grammar complete!
        </h3>
      </div>
    );
  }

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="max-w-xl mx-auto">

      {/* ==================================================
          HEADING
      ================================================== */}

      <div className="text-center mb-8">
        <p className="text-sm text-gray-500">
          {isReinforcing
            ? "Let's reinforce this"
            : "Grammar"}
        </p>

        <h3 className="text-3xl font-bold text-slate-800 mt-2">
          {isReinforcing
            ? "Can you get it this time?"
            : "Choose the correct answer"}
        </h3>

        {isReinforcing && (
          <p className="text-gray-500 mt-3">
            This concept needs a little more
            practice.
          </p>
        )}
      </div>

      {/* ==================================================
          QUESTION CARD
      ================================================== */}

      <div
        className={`bg-white border rounded-2xl shadow-sm p-8 ${
          isWrong
            ? "animate-shake border-red-400"
            : "border-gray-200"
        }`}
        onAnimationEnd={() =>
          setIsWrong(false)
        }
      >

        {/* QUESTION */}

        <p className="text-xl font-semibold text-slate-800 text-center">
          {currentQuestion.question ||
            currentQuestion.prompt ||
            ""}
        </p>

        {/* ==================================================
            OPTIONS
        ================================================== */}

        {Array.isArray(
          currentQuestion.options
        ) &&
        currentQuestion.options.length > 0 ? (
          <div className="mt-8 space-y-3">

            {currentQuestion.options.map(
              (option, index) => {

                const isSelected =
                  selectedAnswer === option;

                const isCorrect =
                  typeof currentQuestion.correctAnswer ===
                  "number"
                    ? index ===
                      currentQuestion.correctAnswer
                    : String(option)
                        .trim()
                        .toLowerCase() ===
                      String(
                        currentQuestion.correctAnswer
                      )
                        .trim()
                        .toLowerCase();

                let classes =
                  "w-full text-left border rounded-xl px-4 py-3 transition ";

                if (
                  feedback?.type ===
                    "correct" &&
                  isSelected
                ) {
                  classes +=
                    "bg-emerald-100 border-emerald-500 text-emerald-700";
                } else if (
                  feedback?.type ===
                    "wrong" &&
                  isSelected
                ) {
                  classes +=
                    "bg-red-100 border-red-500 text-red-700";
                } else {
                  classes +=
                    "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50";
                }

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={
                      feedback?.type ===
                      "correct"
                    }
                    onClick={() =>
                      handleAnswer(
                        option,
                        index
                      )
                    }
                    className={classes}
                  >
                    {option}
                  </button>
                );
              }
            )}

          </div>
        ) : (
          <p className="mt-6 text-center text-red-500">
            No grammar options configured
            for this question.
          </p>
        )}

        {/* ==================================================
            FEEDBACK
        ================================================== */}

        {feedback && (
          <div
            className={`mt-6 p-4 rounded-xl text-center font-semibold ${
              feedback.type ===
              "correct"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {feedback.message}

            {feedback.type ===
              "wrong" && (
              <p className="text-sm font-normal mt-1">
                Correct answer:{" "}
                <strong>
                  {
                    currentQuestion.correctAnswer
                  }
                </strong>
              </p>
            )}
          </div>
        )}

        {/* ==================================================
            ATTEMPT COUNTER
        ================================================== */}

        <p className="text-center text-sm text-gray-400 mt-5">
          Attempt {attempts + 1}
        </p>
      </div>

      {/* ==================================================
          PROGRESS
      ================================================== */}

      {!isReinforcing && (
        <p className="text-center text-sm text-gray-400 mt-5">
          {currentIndex + 1} /{" "}
          {questions.length}
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