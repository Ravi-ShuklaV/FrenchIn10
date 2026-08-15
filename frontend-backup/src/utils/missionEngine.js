export function generateMission(mission, weakConcepts = []) {
  if (!mission?.turns?.length) {
    return [];
  }

  const turns = [...mission.turns];

  const selection = mission.selection || {};

  const minTurns = selection.minTurns || 3;
  const maxTurns = selection.maxTurns || 4;

  const weakIds = new Set(
    weakConcepts.map(
      (concept) => concept.conceptId
    )
  );

  // ==========================================
  // SCORE EACH TURN
  // ==========================================

  const scoredTurns = turns.map((turn) => {
    const targetConcepts =
      turn.targetConcepts || [];

    const matchedWeakConcepts =
      targetConcepts.filter((conceptId) =>
        weakIds.has(conceptId)
      );

    return {
      ...turn,

      _weakMatches:
        matchedWeakConcepts.length,

      _matchedWeakConcepts:
        matchedWeakConcepts,
    };
  });

  // ==========================================
  // WEAK-CONCEPT TURNS
  // ==========================================

  const weakTurns = scoredTurns
    .filter(
      (turn) => turn._weakMatches > 0
    )
    .sort(
      (a, b) =>
        b._weakMatches -
        a._weakMatches
    );

  // ==========================================
  // NORMAL TURNS
  // ==========================================

  const normalTurns = scoredTurns
    .filter(
      (turn) => turn._weakMatches === 0
    );

  // ==========================================
  // CHALLENGE TURN
  // ==========================================

  const challengeTurns =
    scoredTurns.filter(
      (turn) =>
        turn.difficulty === "hard"
    );

  const selected = [];
  const selectedIds = new Set();

  function addTurn(turn) {
    if (!turn) return;

    if (selectedIds.has(turn.id)) {
      return;
    }

    if (selected.length >= maxTurns) {
      return;
    }

    selected.push(turn);
    selectedIds.add(turn.id);
  }

  // ==========================================
  // 1. PRIORITIZE WEAK CONCEPTS
  // ==========================================

  if (
    selection.prioritizeWeakConcepts !==
      false
  ) {
    weakTurns.forEach((turn) => {
      if (
        selected.length < maxTurns
      ) {
        addTurn(turn);
      }
    });
  }

  // ==========================================
  // 2. ADD NORMAL TURN
  // ==========================================

  if (
    selection.includeNormalTurns !==
      false
  ) {
    addTurn(normalTurns[0]);
  }

  // ==========================================
  // 3. ADD CHALLENGE
  // ==========================================

  if (
    selection.includeChallengeTurn !==
      false
  ) {
    /*
     * Prefer a hard turn that hasn't
     * already been selected.
     */

    const challengeTurn =
      challengeTurns.find(
        (turn) =>
          !selectedIds.has(turn.id)
      );

    addTurn(challengeTurn);
  }

  // ==========================================
  // 4. FILL REMAINING SLOTS
  // ==========================================

  scoredTurns.forEach((turn) => {
    if (
      selected.length < minTurns
    ) {
      addTurn(turn);
    }
  });

  // ==========================================
  // 5. NEVER EXCEED MAX
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