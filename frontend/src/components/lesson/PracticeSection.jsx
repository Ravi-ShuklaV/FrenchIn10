import { useState } from "react";

import { calculateSimilarity } from "../../utils/calculateSimilarity";

function PracticeSection({ practice, onScoreChange }) {
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});

  function handleChange(id, value) {
    setAnswers((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function checkAnswer(question) {
  console.log("Expected:", question.answer);
  console.log("Typed:", answers[question.id]);

  const score = calculateSimilarity(
    question.answer,
    answers[question.id] || ""
  );

  console.log("Score:", score);

  const newScores = {
    ...scores,
    [question.id]: score,
  };

  setScores(newScores);

  const average = Math.round(
    Object.values(newScores).reduce((a, b) => a + b, 0) /
    Object.keys(newScores).length
  );

  onScoreChange(average);
}

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-5">Practice</h2>

      <div className="space-y-6">
        {practice.map((question) => (
          <div key={question.id} className="bg-white rounded-xl shadow p-5">
            <p className="font-medium mb-3">{question.question}</p>

            <input
              type="text"
              value={answers[question.id] || ""}
              onChange={(e) => handleChange(question.id, e.target.value)}
              className="w-full border rounded-lg p-2"
              placeholder="Type your answer..."
            />

            <button
              onClick={() => checkAnswer(question)}
              className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Check Answer
            </button>

            {scores[question.id] !== undefined && (
              <div className="mt-3">
                <p>Accuracy: {scores[question.id]}%</p>

                <p className="font-semibold">
                  {scores[question.id] >= 90
                    ? "✅ Excellent!"
                    : scores[question.id] >= 75
                      ? "👍 Good!"
                      : "❌ Try Again"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PracticeSection;
