import { useEffect, useRef, useState } from "react";
import useSessionStore from "../../store/sessionStore";

function SpeakingSection({
  speaking,
  onComplete,
}) {
  const addPerformance = useSessionStore(
    (state) => state.addPerformance
  );

  const questions = Array.isArray(speaking)
    ? speaking
    : [];

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [isListening, setIsListening] =
    useState(false);

  const [transcript, setTranscript] =
    useState("");

  const [feedback, setFeedback] =
    useState(null);

  const recognitionRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);

  // Used to smoothly position the new
  // speaking question in the viewport.
  const actionRef = useRef(null);

  // =========================
  // CURRENT QUESTION
  // =========================

  const currentQuestion =
    questions[currentIndex];

  // =========================
  // RESET WHEN QUESTION CHANGES
  // =========================

  useEffect(() => {
    setTranscript("");
    setFeedback(null);
    setIsListening(false);

    startedAtRef.current =
      Date.now();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        console.error(error);
      }

      recognitionRef.current = null;
    }
  }, [currentIndex]);

  // =========================
  // SMOOTHLY SHOW NEW QUESTION
  // =========================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const element = actionRef.current;

      if (!element) return;

      // Smoothly move the useful speaking
      // area into the viewport.
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      // Focus without causing another
      // browser scroll.
      requestAnimationFrame(() => {
        try {
          element.focus({
            preventScroll: true,
          });
        } catch {
          element.focus();
        }
      });
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentIndex]);

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.error(error);
        }
      }
    };
  }, []);

  // =========================
  // NORMALIZE
  // =========================

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,!?;:'"()-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================
  // EXPECTED ANSWER
  // =========================

  const expectedAnswer =
    currentQuestion?.expectedAnswer ||
    currentQuestion?.answer ||
    currentQuestion?.correctAnswer ||
    currentQuestion?.french ||
    "";

  const acceptedAnswers =
    Array.isArray(
      currentQuestion?.acceptedAnswers
    ) &&
    currentQuestion.acceptedAnswers.length > 0
      ? currentQuestion.acceptedAnswers
      : [expectedAnswer];

  // =========================
  // CHECK ANSWER
  // =========================

  function checkAnswer(spokenText) {
    const normalizedSpoken =
      normalize(spokenText);

    const correct =
      acceptedAnswers.some(
        (answer) =>
          normalize(answer) ===
          normalizedSpoken
      );

    const responseTime =
      Math.round(
        (Date.now() -
          startedAtRef.current) /
          1000
      );

   const questionId =
  currentQuestion?.conceptId ||
  currentQuestion?.id ||
  `speaking_${currentIndex}`;

const conceptId =
  currentQuestion?.conceptId ||
  currentQuestion?.targetConcepts?.[0] ||
  currentQuestion?.id ||
  `speaking_${currentIndex}`;

addPerformance({
  questionId: `speaking_${questionId}`,

  conceptId,

  section: "speaking",

  correct,

  attempts: 1,

  responseTime,

  hintsUsed: 0,

  isReinforcement: false,
});

    if (!correct) {
      setFeedback({
        type: "wrong",
        message: "Not quite. Try again.",
      });

      return;
    }

    setFeedback({
      type: "correct",
      message: "Great! 🎉",
    });

    setTimeout(() => {
      if (completedRef.current) {
        return;
      }

      if (
        currentIndex <
        questions.length - 1
      ) {
        setCurrentIndex(
          (previous) =>
            previous + 1
        );

        return;
      }

      completedRef.current = true;

      onComplete();
    }, 800);
  }

  // =========================
  // START LISTENING
  // =========================

  function startListening() {
    if (isListening) {
      return;
    }

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

    if (!currentQuestion) {
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "fr-FR";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);

      setTranscript("");

      setFeedback(null);

      startedAtRef.current =
        Date.now();
    };

    recognition.onresult = (event) => {
      const spoken =
        event.results?.[0]?.[0]
          ?.transcript || "";

      setTranscript(spoken);

      setIsListening(false);

      checkAnswer(spoken);
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      if (
        event.error === "aborted"
      ) {
        return;
      }

      setFeedback({
        type: "error",
        message:
          event.error === "no-speech"
            ? "I didn't hear anything. Try again."
            : "Something went wrong with the microphone.",
      });
    };

    recognition.onend = () => {
      setIsListening(false);

      recognitionRef.current =
        null;
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start speech recognition:",
        error
      );

      setIsListening(false);

      recognitionRef.current =
        null;

      setFeedback({
        type: "error",
        message:
          "Could not start the microphone. Try again.",
      });
    }
  }

  // =========================
  // NO SPEAKING QUESTIONS
  // =========================

  if (!questions.length) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">

        <div className="text-5xl mb-5">
          🎙️
        </div>

        <h2 className="text-3xl font-bold text-slate-800">
          Speaking
        </h2>

        <p className="text-gray-500 mt-3">
          No speaking exercises are configured
          for this lesson yet.
        </p>

        <button
          ref={actionRef}
          type="button"
          onClick={onComplete}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl"
        >
          Continue →
        </button>

      </div>
    );
  }

  // =========================
  // PROGRESS
  // =========================

  const progress =
    ((currentIndex + 1) /
      questions.length) *
    100;

  // =========================
  // UI
  // =========================

  return (
    <div className="max-w-3xl mx-auto">

      {/* HEADER */}

      <div className="text-center mb-8">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
          🎙️ Speaking Practice
        </div>

        <h2 className="text-4xl font-bold text-slate-800 mt-5">
          Say it in French
        </h2>

        <p className="text-gray-500 mt-3">
          Speak naturally. Don't worry about
          being perfect.
        </p>

      </div>

      {/* PROGRESS */}

      <div className="mb-7">

        <div className="flex justify-between text-sm text-gray-400 mb-2">

          <span>
            {currentIndex + 1} /{" "}
            {questions.length}
          </span>

          <span>
            Speaking
          </span>

        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* QUESTION */}

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-8">

        <div className="bg-gray-50 rounded-2xl p-8 text-center">

          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Say this in French
          </p>

          <p className="text-2xl font-bold text-slate-800 mt-5">
            {currentQuestion?.question ||
              currentQuestion?.prompt ||
              currentQuestion?.english ||
              "Speak the French answer."}
          </p>

        </div>

        {/* MICROPHONE */}

        <div className="flex justify-center mt-9">

          <button
            ref={actionRef}
            type="button"
            onClick={startListening}
            disabled={
              isListening ||
              feedback?.type === "correct"
            }
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-md transition-all ${
              isListening
                ? "bg-red-500 text-white animate-pulse scale-105"
                : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105"
            } disabled:opacity-60`}
          >
            🎙️
          </button>

        </div>

        <p className="text-center text-sm text-gray-400 mt-4">

          {isListening
            ? "Listening..."
            : "Tap the microphone and speak"}

        </p>

        {/* TRANSCRIPT */}

        {transcript && (
          <div className="mt-7 bg-gray-50 rounded-2xl p-5 text-center">

            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              I heard
            </p>

            <p className="text-xl font-semibold text-slate-800 mt-2">
              {transcript}
            </p>

          </div>
        )}

        {/* CORRECT */}

        {feedback?.type === "correct" && (
          <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">

            <p className="text-xl font-bold text-emerald-700">
              ✓ Great!
            </p>

            <p className="text-sm text-emerald-600 mt-1">
              Moving to the next one...
            </p>

          </div>
        )}

        {/* WRONG */}

        {feedback?.type === "wrong" && (
          <div className="mt-6">

            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">

              <p className="font-bold text-red-600">
                Not quite.
              </p>

              <p className="text-sm text-red-500 mt-1">
                Try saying it again.
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                setTranscript("");

                setFeedback(null);

                startedAtRef.current =
                  Date.now();
              }}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ERROR */}

        {feedback?.type === "error" && (
          <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-5 text-center">

            <p className="font-semibold text-red-600">
              {feedback.message}
            </p>

          </div>
        )}

      </div>
    </div>
  );
}

export default SpeakingSection;