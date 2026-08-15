import { useLocation, Link } from "react-router-dom";

function LessonResult() {
  const { state } = useLocation();

  if (!state) {
    return <h2>No lesson results found.</h2>;
  }

  const {
    pronunciationScore,
    typingScore,
    quizScore,
    overallScore,
  } = state;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="bg-white rounded-xl shadow p-8">

        <h1 className="text-4xl font-bold text-center mb-8">
          🎉 Lesson Complete
        </h1>

        <div className="space-y-4 text-xl">

          <div className="flex justify-between">
            <span>🎤 Pronunciation</span>
            <span>{pronunciationScore}%</span>
          </div>

          <div className="flex justify-between">
            <span>⌨️ Typing</span>
            <span>{typingScore}%</span>
          </div>

          <div className="flex justify-between">
            <span>📝 Quiz</span>
            <span>{quizScore}%</span>
          </div>

          <hr />

          <div className="flex justify-between text-2xl font-bold">
            <span>Overall</span>
            <span>{overallScore}%</span>
          </div>

        </div>

        <div className="flex justify-center mt-10">
          <Link
            to="/lessons"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl"
          >
            Continue Learning
          </Link>
        </div>

      </div>
    </div>
  );
}

export default LessonResult;