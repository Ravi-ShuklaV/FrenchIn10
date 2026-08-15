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
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasScoredCurrentTurn, setHasScoredCurrentTurn] =
    useState(false);
  const [questionStartedAt, setQuestionStartedAt] =
    useState(Date.now());
  const [showHint, setShowHint] = useState(false);

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
  }, [mission, getWeakConcepts]);

  const currentMission = missionTurns[currentTurn];

  // =========================
  // RESET TURN
  // =========================

  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setAnswer("");
    setFeedback(null);
    setIsSubmitting(false);
    setHasScoredCurrentTurn(false);
    setShowHint(false);
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
  }, [currentTurn, currentMission]);

  // =========================
  // NORMALIZE ANSWER
  // =========================

  function normalizeText(text) {
    return String(text)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,!?;:'"()\-–—]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================
  // CHECK ANSWER
  // =========================

  function isCorrectAnswer() {
    if (!currentMission) {
      return false;
    }

    const actual = normalizeText(answer);

    const acceptedAnswers =
      Array.isArray(currentMission.acceptedAnswers)
        ? currentMission.acceptedAnswers
        : [];

    return acceptedAnswers.some(
      (accepted) =>
        normalizeText(accepted) === actual
    );
  }

  // =========================
  // SUBMIT
  // =========================

  function handleSubmit() {
    if (
      !answer.trim() ||
      !currentMission ||
      isSubmitting
    ) {
      return;
    }

    const correct = isCorrectAnswer();

    const responseTime = Math.max(
      0,
      Math.round(
        (Date.now() - questionStartedAt) / 1000
      )
    );

    // =========================
    // RECORD PERFORMANCE
    // =========================

    if (!hasScoredCurrentTurn) {
      addPerformance({
        questionId: `mission_${currentMission.id}`,

        conceptId:
          currentMission.targetConcepts?.[0] ||
          currentMission.id,

        french: currentMission.acceptedAnswers?.[0] || "",
        english: currentMission.english || "",

        type: "mission",

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
        message:
          "Not quite. Try the conversation again.",
      });

      return;
    }

    // =========================
    // CORRECT
    // =========================

    setIsSubmitting(true);

    setFeedback({
      type: "correct",
      message: "Perfect! ☕",
    });

    window.setTimeout(() => {
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
    }, 800);
  }

  // =========================
  // MISSION UNAVAILABLE
  // =========================

  if (
    !mission ||
    missionTurns.length === 0
  ) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <div className="text-5xl mb-5">
          🎯
        </div>

        <h2 className="text-3xl font-bold text-slate-800">
          Mission
        </h2>

        <p className="text-gray-500 mt-3">
          This lesson does not have a
          Mission configured yet.
        </p>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="max-w-3xl mx-auto">

      {/* HEADER */}

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold">
          🎯 Final Mission
        </div>

        <h2 className="text-3xl font-bold text-slate-800 mt-4">
          {mission.title || "Your Mission"}
        </h2>

        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          {mission.scenario ||
            "Use what you learned to complete the conversation."}
        </p>
      </div>

      {/* PROGRESS */}

      <div className="flex items-center justify-center gap-2 mb-6">
        {missionTurns.map((_, index) => (
          <div
            key={index}
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

      <p className="text-center text-xs text-gray-400 -mt-3 mb-6">
        Challenge {currentTurn + 1} of{" "}
        {missionTurns.length}
      </p>

      {/* CONVERSATION CARD */}

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">

        {/* BARISTA */}

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 border-b border-amber-100">

          <div className="flex items-center gap-3 mb-4">

            <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
              ☕
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
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

            {/* ENGLISH HINT */}

            {showHint ? (
              <div className="mt-4 pt-4 border-t border-gray-100">

                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">
                  English meaning
                </p>

                <p className="text-sm text-gray-500">
                  {currentMission.english}
                </p>

              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint(true)}
                className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                💡 Show English meaning
              </button>
            )}

          </div>
        </div>

        {/* RESPONSE */}

        <div className="p-6">

          <p className="text-sm font-semibold text-slate-700 mb-2">
            Your response
          </p>

          <p className="text-xs text-gray-400 mb-3">
            Respond naturally in French.
          </p>

          <input
            ref={actionRef}
            type="text"
            value={answer}
            onChange={(event) =>
              setAnswer(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder="Type your response in French..."
            disabled={isSubmitting}
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-base outline-none transition focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-gray-100"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !answer.trim()
            }
            className="w-full mt-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 transition"
          >
            {isSubmitting
              ? "Checking..."
              : "Respond →"}
          </button>

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
                <div className="mt-2">

                  <p className="text-sm text-red-500">
                    Think about the words and phrases you learned, then try again.
                  </p>

                  <p className="text-sm font-semibold text-slate-700 mt-2">
                    Expected:
                  </p>

                  <p className="text-sm font-medium text-slate-800">
                    {currentMission.acceptedAnswers?.[0]}
                  </p>

                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* INSTRUCTIONS */}

      {mission.instructions && (
        <p className="text-center text-xs text-gray-400 mt-5 max-w-xl mx-auto">
          {mission.instructions}
        </p>
      )}

    </div>
  );
}

export default MissionSection;