import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getLessons } from "../services/lessonsService";

function LessonList() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLessons() {
      try {
        const data = await getLessons();
        setLessons(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadLessons();
  }, []);

  if (loading) {
    return <h2>Loading lessons...</h2>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Lessons
      </h1>

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border rounded-xl p-6 shadow"
          >
            <h2 className="text-2xl font-semibold">
              {lesson.title}
            </h2>

            <p className="text-gray-600 mt-2">
              {lesson.scenario} • {lesson.difficulty}
            </p>

            <Link
              to={`/lesson/${lesson.id}`}
              className="inline-block mt-4 bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              Open Lesson
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LessonList;