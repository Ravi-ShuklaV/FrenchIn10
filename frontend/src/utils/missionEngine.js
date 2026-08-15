export function generateMission(mission, weakConcepts = []) {
  if (!mission?.turns?.length) {
    return [];
  }

  const turns = [...mission.turns];
  const selection = mission.selection || {};

  const minTurns = selection.minTurns || 4;
  const maxTurns = selection.maxTurns || 4;

  const weakIds = new Set(
    weakConcepts.map((concept) => concept.conceptId)
  );

  // ==========================================
  // SCORE EACH TURN
  // ==========================================

  const scoredTurns = turns.map((turn) => {
    const targetConcepts = turn.targetConcepts || [];

    const matchedWeakConcepts = targetConcepts.filter(
      (conceptId) => weakIds.has(conceptId)
    );

    return {
      ...turn,

      _weakMatches: matchedWeakConcepts.length,

      _matchedWeakConcepts: matchedWeakConcepts,
    };
  });

  // ==========================================
  // GROUP BY TYPE
  // ==========================================

  const listeningTurns = scoredTurns.filter(
    (turn) => turn.type === "listening"
  );

  const multipleChoiceTurns = scoredTurns.filter(
    (turn) =>
      turn.type === "multiple_choice" ||
      turn.type === "mcq"
  );

  // ==========================================
  // DIFFICULTY GROUPS
  // ==========================================

  const hardTurns = scoredTurns.filter(
    (turn) => turn.difficulty === "hard"
  );

  const mediumTurns = scoredTurns.filter(
    (turn) => turn.difficulty === "medium"
  );

  const easyTurns = scoredTurns.filter(
    (turn) => turn.difficulty === "easy"
  );

  // ==========================================
  // WEAK CONCEPT TURNS
  // ==========================================

  const weakTurns = scoredTurns
    .filter((turn) => turn._weakMatches > 0)
    .sort(
      (a, b) => b._weakMatches - a._weakMatches
    );

  // ==========================================
  // SELECTED
  // ==========================================

  const selected = [];
  const selectedIds = new Set();

  function addTurn(turn) {
    if (!turn) return;

    if (selected.length >= maxTurns) {
      return;
    }

    if (selectedIds.has(turn.id)) {
      return;
    }

    selected.push(turn);
    selectedIds.add(turn.id);
  }

  // ==========================================
  // 1. LISTENING
  //
  // Mission should ideally contain at least
  // one listening challenge.
  // ==========================================

  if (
    selection.includeListening !== false &&
    listeningTurns.length > 0
  ) {
    const listeningTurn =
      listeningTurns.find(
        (turn) => turn.difficulty === "medium"
      ) ||
      listeningTurns.find(
        (turn) => turn.difficulty === "hard"
      ) ||
      listeningTurns[0];

    addTurn(listeningTurn);
  }

  // ==========================================
  // 2. WEAK CONCEPT
  //
  // If the learner struggled with something,
  // prioritize a Mission question that uses it.
  // ==========================================

  if (
    selection.prioritizeWeakConcepts !== false &&
    selected.length < maxTurns
  ) {
    const weakTurn = weakTurns.find(
      (turn) => !selectedIds.has(turn.id)
    );

    addTurn(weakTurn);
  }

  // ==========================================
  // 3. HARD COMBINED QUESTION
  //
  // Prefer a hard question that combines
  // multiple concepts.
  // ==========================================

  if (
    selection.includeChallengeTurn !== false &&
    selected.length < maxTurns
  ) {
    const hardCombinedTurn =
      hardTurns
        .filter(
          (turn) => !selectedIds.has(turn.id)
        )
        .sort(
          (a, b) =>
            (b.targetConcepts?.length || 0) -
            (a.targetConcepts?.length || 0)
        )[0];

    addTurn(hardCombinedTurn);
  }

  // ==========================================
  // 4. MEDIUM APPLICATION QUESTION
  // ==========================================

  if (
    selected.length < maxTurns
  ) {
    const mediumTurn =
      mediumTurns.find(
        (turn) => !selectedIds.has(turn.id)
      ) ||
      multipleChoiceTurns.find(
        (turn) => !selectedIds.has(turn.id)
      );

    addTurn(mediumTurn);
  }

  // ==========================================
  // 5. FILL REMAINING SLOTS
  //
  // Prefer harder questions before easy ones.
  // ==========================================

  const remainingTurns = [
    ...hardTurns,
    ...mediumTurns,
    ...easyTurns,
    ...scoredTurns,
  ];

  remainingTurns.forEach((turn) => {
    if (selected.length < minTurns) {
      addTurn(turn);
    }
  });

  // ==========================================
  // 6. NEVER EXCEED MAX
  // ==========================================

  return selected
    .slice(0, maxTurns)
    .map(
      ({
        _weakMatches,
        _matchedWeakConcepts,
        ...turn
      }) => turn
    );
}