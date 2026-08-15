import { useEffect, useState } from "react";
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

  const [currentTurn, setCurrentTurn] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionStartedAt, setQuestionStartedAt] =
    useState(Date.now());

  const [missionTurns, setMissionTurns] = useState([]);

  /*
   * Tracks whether the current Mission turn
   * has already been scored.
   *
   * This is important because Mission uses
   * one scored attempt per turn.
   *
   * If the user gets it wrong, they can retry,
   * but the retry does NOT add another
   * performance record.
   */
  const [hasScoredCurrentTurn, setHasScoredCurrentTurn] =
    useState(false);

  // =========================
  // PREPARE MISSION
  // =========================

  useEffect(() => {
    if (!mission?.turns?.length) {
      setMissionTurns([]);
      return;
    }

    const weakConcepts = getWeakConcepts();

    const selectedTurns = generateMission(
      mission,
      weakConcepts
    );

    setMissionTurns(selectedTurns);
    setCurrentTurn(0);
  }, [mission, getWeakConcepts]);

  // =========================
  // CURRENT TURN
  // =========================

  const currentMission =
    missionTurns[currentTurn];

  // =========================
  // RESET QUESTION
  // =========================

  useEffect(() => {
    setQuestionStartedAt(Date.now());
    setAnswer("");
    setFeedback(null);
    setIsSubmitting(false);
    setHasScoredCurrentTurn(false);
  }, [currentTurn]);

  // =========================
  // NORMALIZE TEXT
  // =========================

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

  // =========================
  // CHECK ANSWER
  // =========================

  function checkAnswer() {
    if (!currentMission) {
      return false;
    }

    const normalizedAnswer =
      normalizeText(answer);

    const acceptedAnswers =
      currentMission.acceptedAnswers || [];

    return acceptedAnswers.some(
      (accepted) =>
        normalizeText(accepted) ===
        normalizedAnswer
    );
  }

  // =========================
  // SUBMIT ANSWER
  // =========================

  function handleSubmit() {
    if (
      !answer.trim() ||
      !currentMission ||
      isSubmitting
    ) {
      return;
    }

    const correct = checkAnswer();

    // ==========================================
    // CORRECT
    // ==========================================

    if (correct) {
      setIsSubmitting(true);

      /*
       * Only create a performance record if
       * this turn hasn't already been scored.
       */
      if (!hasScoredCurrentTurn) {
        const responseTime = Math.round(
          (Date.now() - questionStartedAt) /
            1000
        );

        const performanceRecord = {
          conceptId:
            currentMission.targetConcepts?.[0] ||
            currentMission.id,

          section: "mission",

          attempts: 1,

          correct: true,

          score: 1,

          responseTime,

          hintsUsed: 0,

          isReinforcement: false,
        };

        addPerformance(
          performanceRecord
        );

        setHasScoredCurrentTurn(true);
      }

      setFeedback({
        type: "correct",
        message:
          "Great response! 🎉",
      });

      setTimeout(() => {
        // ======================================
        // LAST MISSION TURN
        // ======================================

        if (
          currentTurn >=
          missionTurns.length - 1
        ) {
          /*
           * We need the final performance
           * record here because Zustand may
           * not have committed addPerformance()
           * yet.
           *
           * Since this is a correct answer and
           * the turn has just been scored,
           * construct the same final record.
           */

          const finalPerformanceRecord = {
            conceptId:
              currentMission.targetConcepts?.[0] ||
              currentMission.id,

            section: "mission",

            attempts: 1,

            correct: true,

            score: 1,

            responseTime: Math.round(
              (Date.now() -
                questionStartedAt) /
                1000
            ),

            hintsUsed: 0,

            isReinforcement: false,
          };

          finalizeSession(
            finalPerformanceRecord
          );

          navigate(
            "/session/complete"
          );

          return;
        }

        // ======================================
        // NEXT TURN
        // ======================================

        setCurrentTurn(
          (prev) => prev + 1
        );
      }, 800);

      return;
    }

    // ==========================================
    // WRONG
    // ==========================================

    /*
     * Wrong answers are scored ONCE.
     *
     * If the learner hasn't been scored yet,
     * record one incorrect performance.
     *
     * Further retries are NOT added to
     * performance.
     */

    if (!hasScoredCurrentTurn) {
      const responseTime = Math.round(
        (Date.now() - questionStartedAt) /
          1000
      );

      const performanceRecord = {
        conceptId:
          currentMission.targetConcepts?.[0] ||
          currentMission.id,

        section: "mission",

        attempts: 1,

        correct: false,

        score: 0,

        responseTime,

        hintsUsed: 0,

        isReinforcement: false,
      };

      addPerformance(
        performanceRecord
      );

      setHasScoredCurrentTurn(true);
    }

    setFeedback({
      type: "wrong",
      message:
        "Not quite. Try the conversation again.",
    });

    /*
     * Keep the user on the same Mission
     * turn so they can retry.
     */
    setIsSubmitting(false);
  }

  // =========================
  // NO MISSION
  // =========================

  if (
    !mission ||
    missionTurns.length === 0
  ) {
    return (
      <div className="text-center py-12">

        <p className="text-sm text-red-500 font-semibold">
          MISSION
        </p>

        <h2 className="text-2xl font-bold text-slate-800 mt-2">
          Mission unavailable
        </h2>

        <p className="text-gray-500 mt-2">
          This lesson does not have a
          Mission configured yet.
        </p>

      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="max-w-2xl mx-auto">

      {/* =========================
          HEADING
      ========================= */}

      <div className="text-center mb-8">

        <p className="text-sm text-amber-600 font-semibold">
          FINAL CHALLENGE
        </p>

        <h2 className="text-3xl font-bold text-slate-800 mt-2">
          {mission.title ||
            "Your Mission"}
        </h2>

        <p className="text-gray-500 mt-3">
          {mission.scenario ||
            "Use what you learned to complete the conversation."}
        </p>

        {mission.instructions && (
          <p className="text-sm text-gray-400 mt-2">
            {mission.instructions}
          </p>
        )}

      </div>

      {/* =========================
          CONVERSATION CARD
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

        <div className="bg-gray-50 rounded-2xl p-5">

          <p className="text-sm text-gray-400">
            {currentMission.speaker}
          </p>

          <p className="text-xl font-semibold text-slate-800 mt-2">
            {currentMission.french}
          </p>

          {currentMission.english && (
            <p className="text-sm text-gray-500 mt-2">
              {currentMission.english}
            </p>
          )}

        </div>

        {/* =========================
            RESPONSE
        ========================= */}

        <div className="mt-8">

          <p className="text-sm text-gray-500 mb-2">
            Your response
          </p>

          <input
            type="text"
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            placeholder="Respond in French..."
            disabled={isSubmitting}
            className={`w-full border rounded-xl px-4 py-3 outline-none transition ${
              feedback?.type === "wrong"
                ? "border-red-400 focus:ring-2 focus:ring-red-300"
                : feedback?.type === "correct"
                ? "border-emerald-400 focus:ring-2 focus:ring-emerald-300"
                : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
            } ${
              isSubmitting
                ? "bg-gray-100 cursor-not-allowed"
                : ""
            }`}
            autoFocus
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !answer.trim()
            }
            className={`w-full mt-4 rounded-xl text-white font-semibold py-3 transition ${
              isSubmitting ||
              !answer.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {isSubmitting
              ? "Checking..."
              : "Respond →"}
          </button>

        </div>

        {/* =========================
            FEEDBACK
        ========================= */}

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

      {/* =========================
          PROGRESS
      ========================= */}

      <p className="text-center text-sm text-gray-400 mt-5">
        Challenge {currentTurn + 1} /{" "}
        {missionTurns.length}
      </p>

    </div>
  );
}

export default MissionSection;