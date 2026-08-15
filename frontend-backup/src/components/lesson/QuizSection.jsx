import { useState } from "react";

function QuizSection({ quiz,onScoreChange }) {
  const [selected, setSelected] = useState({});
  const [submitted, setSubmitted] = useState({});

  function submit(question) {
  const newSubmitted = {
    ...submitted,
    [question.id]: true,
  };

  setSubmitted(newSubmitted);

  const correct = quiz.filter((q) => {
    return (
      selected[q.id] === q.correctAnswer
    );
  }).length;

  const score = Math.round(
    (correct / quiz.length) * 100
  );

  onScoreChange(score);
}

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-5">
        Quiz
      </h2>

      <div className="space-y-8">
        {quiz.map((question) => (
          <div
            key={question.id}
            className="bg-white rounded-xl shadow p-5"
          >
            <h3 className="font-semibold mb-4">
              {question.question}
            </h3>

            <div className="space-y-2">
              {question.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center gap-2"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={index}
                    checked={selected[question.id] === index}
                    onChange={() =>
                      setSelected((prev) => ({
                        ...prev,
                        [question.id]: index,
                      }))
                    }
                  />

                  {option}
                </label>
              ))}
            </div>

            <button
              onClick={() => submit(question)}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Submit
            </button>

            {submitted[question.id] && (
              <p className="mt-4 font-semibold">
                {selected[question.id] === question.correctAnswer
                  ? "✅ Correct!"
                  : "❌ Incorrect"}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default QuizSection;