import { useEffect, useRef, useState } from "react";
import useSessionStore from "../../store/sessionStore";

function SpeakingSection({ concepts }) {
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

  const recognitionRef = useRef(null);

  /*
   * For now we use vocabulary + sentences
   * as speaking prompts.
   */
  const speakingConcepts = [
    ...concepts.filter(
      (concept) => concept.type === "vocabulary"
    ),
    ...concepts.filter(
      (concept) => concept.type === "sentence"
    ),
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReinforcing, setIsReinforcing] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(
    Date.now()
  );

  const reinforcementConcept = reinforcementQueue.find(
    (concept) =>
      speakingConcepts.some(
        (item) =>
          item.conceptId === concept.conceptId
      )
  );

  const currentConcept = isReinforcing
    ? reinforcementConcept
    : speakingConcepts[currentIndex];

  useEffect(() => {
    setRecognizedText("");
    setFeedback(null);
    setAttempts(0);
    setIsListening(false);
    setQuestionStartedAt(Date.now());

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore abort errors
      }
    }
  }, [
    currentConcept?.conceptId,
    isReinforcing,
  ]);

  function normalizeText(text) {
    return text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,!?;:'"()\-–—]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function startListening() {
    if (!currentConcept) return;

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setFeedback({
        type: "error",
        message:
          "Speech recognition is not supported in this browser.",
      });

      return;
    }

    // Stop an existing recognition session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "fr-FR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    setIsListening(true);
    setRecognizedText("");
    setFeedback(null);

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setRecognizedText(transcript);

      evaluateAnswer(transcript);

      try {
        recognition.stop();
      } catch {
        // Ignore
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      if (event.error === "no-speech") {
        setFeedback({
          type: "error",
          message:
            "I couldn't hear anything. Try again.",
        });
      } else {
        setFeedback({
          type: "error",
          message:
            "Speech recognition failed. Try again.",
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }

  function evaluateAnswer(transcript) {
    const currentAttempt = attempts + 1;

    const expected = normalizeText(
      currentConcept.french
    );

    const actual = normalizeText(transcript);

    /*
     * Binary scoring:
     *
     * 1 = acceptable response
     * 0 = unacceptable response
     */
    const score = actual === expected ? 1 : 0;

    const correct = score === 1;

    const responseTime = Math.round(
      (Date.now() - questionStartedAt) / 1000
    );

    addPerformance({
      conceptId: currentConcept.conceptId,
      section: "speaking",
      attempts: currentAttempt,
      correct,
      score,
      responseTime,
      hintsUsed: 0,
      isReinforcement,
      recognizedText: transcript,
    });

    // =========================
    // CORRECT
    // =========================

    if (correct) {
      setFeedback({
        type: "correct",
        message: isReinforcing
          ? "Nice! You remembered it. 🎉"
          : "Got it! 🎉",
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
              .some((concept) =>
                speakingConcepts.some(
                  (item) =>
                    item.conceptId ===
                    concept.conceptId
                )
              );

          if (remaining) {
            return;
          }

          setIsReinforcing(false);
          nextSection();

          return;
        }

        // Last normal question
        if (
          currentIndex >=
          speakingConcepts.length - 1
        ) {
          const hasSpeakingReinforcement =
            useSessionStore
              .getState()
              .reinforcementQueue
              .some((concept) =>
                speakingConcepts.some(
                  (item) =>
                    item.conceptId ===
                    concept.conceptId
                )
              );

          if (hasSpeakingReinforcement) {
            setIsReinforcing(true);
            return;
          }

          nextSection();
          return;
        }

        // Next question
        setCurrentIndex(
          (prev) => prev + 1
        );
      }, 800);

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
          ? "We'll practice this one again later."
          : "I didn't get that. Try again.",
    });
  }

  if (!currentConcept) {
    return (
      <div className="text-center py-10">
        <h3 className="text-2xl font-bold text-slate-800">
          Speaking complete!
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
            : "Speaking"}
        </p>

        <h3 className="text-3xl font-bold text-slate-800 mt-2">
          {isReinforcing
            ? "Can you say it this time?"
            : "Say it in French"}
        </h3>

        {isReinforcing && (
          <p className="mt-3 text-gray-500">
            This response was difficult earlier.
          </p>
        )}
      </div>

      {/* Speaking Card */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

        <p className="text-sm text-gray-400 text-center">
          Say:
        </p>

        <p className="text-2xl font-semibold text-slate-800 text-center mt-3">
          {currentConcept.french}
        </p>

        <p className="text-gray-500 text-center mt-2">
          {currentConcept.english}
        </p>

        {/* Microphone */}

        <div className="flex justify-center mt-8">

          <button
            type="button"
            onClick={startListening}
            disabled={isListening}
            className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl shadow-lg transition ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            🎙️
          </button>

        </div>

        <p className="text-center text-sm text-gray-400 mt-4">
          {isListening
            ? "Listening..."
            : "Tap the microphone and speak"}
        </p>

        {/* Recognized text */}

        {recognizedText && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-400">
              I heard:
            </p>

            <p className="mt-1 text-slate-700 font-medium">
              {recognizedText}
            </p>
          </div>
        )}

        {/* Feedback */}

        {feedback && (
          <div
            className={`mt-5 rounded-xl p-4 text-center font-semibold ${
              feedback.type === "correct"
                ? "bg-emerald-100 text-emerald-700"
                : feedback.type === "wrong"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Attempt */}

        <p className="text-center text-sm text-gray-400 mt-5">
          Attempt {attempts + 1}
        </p>

      </div>

      {/* Progress */}

      {!isReinforcing && (
        <p className="text-center text-sm text-gray-400 mt-5">
          {currentIndex + 1} /{" "}
          {speakingConcepts.length}
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

export default SpeakingSection;