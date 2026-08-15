import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSessionStore from "../../store/sessionStore";
import { generateMission } from "../../utils/missionEngine";

function MissionSection({ mission }) {
  const addPerformance = useSessionStore(
    (state) => state.addPerformance
  );

  const finalizeSession = useSessionStore(
    (state) => state.finalizeSession
  );

  const getWeakConcepts = useSessionStore(
    (state) => state.getWeakConcepts
  );

  const navigate = useNavigate();

  const [missionTurns, setMissionTurns] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] =
    useState(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [hasScoredCurrentTurn, setHasScoredCurrentTurn] =
    useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const actionRef = useRef(null);

  // =========================
  // GENERATE MISSION
  // =========================

  useEffect(() => {
    if (!mission?.turns?.length) {
      setMissionTurns([]);
      return;
    }

    const selected = generateMission(
      mission,
      getWeakConcepts()
    );

    setMissionTurns(selected);
    setCurrentTurn(0);
  }, [mission]);

  const currentMission = missionTurns[currentTurn];

  // =========================
  // RESET TURN
  // =========================

  useEffect(() => {
    setSelectedAnswer(null);
    setFeedback(null);
    setQuestionStartedAt(Date.now());
    setShowHint(false);
    setHasScoredCurrentTurn(false);
    setIsPlaying(false);

    window.speechSynthesis?.cancel();
  }, [currentTurn]);

  // =========================
  // SCROLL TO QUESTION
  // =========================

  useEffect(() => {
    if (!currentMission) return;

    const timer = window.setTimeout(() => {
      const element = actionRef.current;

      if (!element) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [currentTurn, currentMission]);

  // =========================
  // CLEAN UP AUDIO
  // =========================

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // =========================
  // PLAY LISTENING
  // =========================

  function playListening() {
    if (
      !currentMission ||
      currentMission.type !== "listening" ||
      !window.speechSynthesis
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(
      currentMission.audioText || currentMission.french || ""
    );

    utterance.lang = "fr-FR";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  // =========================
  // ANSWER
  // =========================

  function handleAnswer(index) {
    if (!currentMission || feedback) {
      return;
    }

    setSelectedAnswer(index);

    const correct =
      index === currentMission.correctAnswer;

    const responseTime = Math.max(
      0,
      Math.round(
        (Date.now() - questionStartedAt) / 1000
      )
    );

    // Score ONLY the first attempt.
    if (!hasScoredCurrentTurn) {
      addPerformance({
  questionId: `mission_${currentMission.id}`,

  conceptId:
    currentMission.targetConcepts?.[0] ||
    currentMission.id,

  french: currentMission.french || "",
  english: currentMission.english || "",
  type: "dialogue",

  section: "mission",

  attempts: 1,

  correct,

  score: correct ? 1 : 0,

  responseTime,

  hintsUsed: showHint ? 1 : 0,

  isReinforcement: false,
});

      setHasScoredCurrentTurn(true);
    }

    // =========================
    // WRONG
    // =========================

    if (!correct) {
      setFeedback({
        type: "wrong",
        message: "Not quite. Take another look and try again.",
      });

      return;
    }

    // =========================
    // CORRECT
    // =========================

    setFeedback({
      type: "correct",
      message: "Perfect! 🎉",
    });

    window.setTimeout( async () => {
      const isLast =
        currentTurn >= missionTurns.length - 1;

      if (isLast) {
        finalizeSession();
        navigate("/session/complete");
        return;
      }

      setCurrentTurn(
        (previous) => previous + 1
      );
    }, 700);
  }

  // =========================
  // TRY AGAIN
  // =========================

  function handleTryAgain() {
    setSelectedAnswer(null);
    setFeedback(null);
    setQuestionStartedAt(Date.now());
  }

  // =========================
  // UNAVAILABLE
  // =========================

  if (
    !mission ||
    missionTurns.length === 0
  ) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="text-5xl mb-5">🎯</div>

        <h2 className="text-3xl font-bold text-slate-800">
          Mission
        </h2>

        <p className="text-gray-500 mt-3">
          This lesson does not have a Mission configured yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">

      {/* HEADER */}

      <div className="text-center mb-5">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold">
          🎯 Final Mission
        </div>

        <h2 className="text-3xl font-bold text-slate-800 mt-3">
          {mission.title || "Your Mission"}
        </h2>

        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          {mission.scenario ||
            "Use what you learned to complete the conversation."}
        </p>

      </div>

      {/* PROGRESS */}

      <div className="flex items-center justify-center gap-2 mb-5">
        {missionTurns.map((turn, index) => (
          <div
            key={turn.id || index}
            className={`h-2.5 rounded-full transition-all ${
              index === currentTurn
                ? "w-8 bg-amber-500"
                : index < currentTurn
                ? "w-2.5 bg-emerald-500"
                : "w-2.5 bg-gray-200"
            }`}
          />
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 -mt-2 mb-5">
        Challenge {currentTurn + 1} of{" "}
        {missionTurns.length}
      </p>

      {/* MAIN CARD */}

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">

        {/* LISTENING HEADER */}

        {currentMission.type === "listening" ? (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 border-b border-indigo-100">

            <div className="flex items-center gap-3 mb-4">

              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">
                🎧
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">
                  Listening Challenge
                </p>

                <p className="font-bold text-slate-800">
                  Listen carefully
                </p>
              </div>

            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">

              <p className="text-sm text-gray-500 mb-4">
                Listen to the French sentence and choose what it means.
              </p>

              <button
                type="button"
                onClick={playListening}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
              >
                {isPlaying
                  ? "🔊 Playing..."
                  : "🔊 Play French"}
              </button>

              {showHint && (
                <p className="text-sm text-gray-500 mt-4">
                  {currentMission.audioText}
                </p>
              )}

            </div>

          </div>
        ) : (
          /* NORMAL CONVERSATION HEADER */

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 border-b border-amber-100">

            <div className="flex items-center gap-3 mb-4">

              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">
                ☕
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                  Conversation
                </p>

                <p className="font-bold text-slate-800">
                  {currentMission.speaker || "Barista"}
                </p>
              </div>

            </div>

            <div className="bg-white rounded-2xl rounded-tl-md p-5 shadow-sm">

              <p className="text-xl font-semibold text-slate-800 leading-relaxed">
                {currentMission.french}
              </p>

              {!showHint ? (
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="mt-3 text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  💡 Show English meaning
                </button>
              ) : (
                <div className="mt-3 pt-3 border-t border-gray-100">

                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                    English meaning
                  </p>

                  <p className="text-sm text-gray-500">
                    {currentMission.english}
                  </p>

                </div>
              )}

            </div>

          </div>
        )}

        {/* QUESTION */}

        <div
          ref={actionRef}
          className="p-5"
        >

          <div className="mb-5">

            <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Your response
            </p>

            <p className="text-lg font-semibold text-slate-800 mt-1">
              {currentMission.question ||
                "Choose the most natural response."}
            </p>

          </div>

          {/* OPTIONS */}

          <div className="space-y-3">

            {(currentMission.options || []).map(
              (option, index) => {

                const isSelected =
                  selectedAnswer === index;

                const isCorrect =
                  currentMission.correctAnswer === index;

                let optionClasses =
                  "border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50";

                if (
                  feedback?.type === "correct" &&
                  isCorrect
                ) {
                  optionClasses =
                    "border-emerald-500 bg-emerald-50 text-emerald-800";
                }

                if (
                  feedback?.type === "wrong" &&
                  isSelected
                ) {
                  optionClasses =
                    "border-red-400 bg-red-50 text-red-700";
                }

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!!feedback}
                    onClick={() =>
                      handleAnswer(index)
                    }
                    className={`w-full text-left border-2 rounded-xl px-4 py-3.5 font-medium transition ${optionClasses}`}
                  >

                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-sm font-bold mr-3">
                      {String.fromCharCode(
                        65 + index
                      )}
                    </span>

                    {option}

                  </button>
                );
              }
            )}

          </div>

          {/* FEEDBACK */}

          {feedback && (
            <div
              className={`mt-4 p-4 rounded-xl text-center ${
                feedback.type === "correct"
                  ? "bg-emerald-50 border border-emerald-100"
                  : "bg-red-50 border border-red-100"
              }`}
            >

              <p
                className={`font-bold ${
                  feedback.type === "correct"
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {feedback.message}
              </p>

              {feedback.type === "wrong" && (
                <p className="text-sm text-red-500 mt-1">
                  Think about the French you learned and try again.
                </p>
              )}

            </div>
          )}

          {/* TRY AGAIN */}

          {feedback?.type === "wrong" && (
            <button
              type="button"
              onClick={handleTryAgain}
              className="w-full mt-3 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition"
            >
              Try Again
            </button>
          )}

        </div>
      </div>

      {/* HINT */}

      {currentMission.type !== "listening" &&
        mission.instructions && (
          <p className="text-center text-xs text-gray-400 mt-4 max-w-xl mx-auto">
            {mission.instructions}
          </p>
        )}

    </div>
  );
}

export default MissionSection;
