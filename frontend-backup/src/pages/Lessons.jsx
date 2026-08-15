import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getLessons } from "../services/lessonsService";
import { getProgress } from "../services/progressService";

function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading lessons...");

        const lessonsData = await getLessons();
        console.log("Lessons:", lessonsData);

        setLessons(lessonsData);

        console.log("Loading progress...");

        const progressData = await getProgress();
        console.log("Progress:", progressData);

        setProgress(progressData);
      } catch (error) {
        console.error("ERROR:", error);
      }
    }

    loadData();
  }, []);

  function isCompleted(id) {
    return progress.some(
      (lesson) => lesson.lessonId === id && lesson.completed,
    );
  }
  function isUnlocked(id) {
    if (id === 1) return true;

    return isCompleted(id - 1);
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Beginner Lessons</h1>

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
          >
            <div>
              <h2 className="text-2xl font-semibold">{lesson.title}</h2>

              <p className="text-gray-500">{lesson.scenario}</p>

              <p className="text-sm text-green-600 mt-2">{lesson.difficulty}</p>
            </div>

            <div className="text-right">
              <p className="mb-3 font-semibold">
                {isCompleted(lesson.id)
                  ? "✅ Completed"
                  : isUnlocked(lesson.id)
                    ? "🟢 Available"
                    : "🔒 Locked"}
              </p>

              {isUnlocked(lesson.id) ? (
                <Link
                  to={`/lesson/${lesson.id}`}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
                >
                  {isCompleted(lesson.id) ? "Review" : "Start"}
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-gray-400 text-white px-5 py-2 rounded-lg cursor-not-allowed"
                >
                  Locked
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Lessons;
