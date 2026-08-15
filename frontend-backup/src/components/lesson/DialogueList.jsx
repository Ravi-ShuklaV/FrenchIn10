import { useEffect, useState } from "react";

import DialogueCard from "./DialogueCard";

function DialogueList({
  lessonId,
  dialogue,
  onScoreChange,
}) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    const values = Object.values(scores);

    if (values.length === 0) {
      onScoreChange(0);
      return;
    }

    const average = Math.round(
      values.reduce((a, b) => a + b, 0) /
      values.length
    );

    onScoreChange(average);
  }, [scores, onScoreChange]);

  function updateScore(index, score) {
    setScores((prev) => ({
      ...prev,
      [index]: score,
    }));
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-5">
        Dialogue
      </h2>

      <div className="space-y-6">
        {dialogue.map((line, index) => (
          <DialogueCard

            key={index}
            lessonId={lessonId}
            line={line}
            onScoreChange={(score) =>
              updateScore(index, score)
            }
          />
        ))}
      </div>
    </section>
  );
}

export default DialogueList;