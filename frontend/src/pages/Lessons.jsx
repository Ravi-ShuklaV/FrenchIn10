import { Link } from "react-router-dom";
import useSessionStore from "../store/sessionStore";
import lesson1 from "../lessons/lesson1.json";

function Lessons() {
  const completedLessons = useSessionStore(
    (state) => state.completedLessons,
  );

  const lessons = [lesson1];

  const isCompleted = (id) =>
    completedLessons.some(
      (lesson) => String(lesson.lessonId) === String(id),
    );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Learning path
        </p>
        <h1 className="text-4xl font-bold text-slate-800 mt-2">
          Your French journey
        </h1>
        <p className="text-gray-500 mt-3">
          Complete one short lesson at a time.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-6 bottom-6 w-1 bg-gray-200 -translate-x-1/2 hidden sm:block" />

        {lessons.map((lesson, index) => {
          const completed = isCompleted(lesson.id);

          return (
            <div
              key={lesson.id}
              className="relative flex justify-center mb-8"
            >
              <div className="w-full sm:w-3/4 bg-white border border-gray-200 rounded-3xl shadow-sm p-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {completed ? "✓" : index + 1}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          {lesson.level} · {lesson.estimatedTime} min
                        </p>
                        <h2 className="text-2xl font-bold text-slate-800">
                          {lesson.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-gray-500 mt-4">
                      {lesson.scenario} · {lesson.difficulty}
                    </p>
                  </div>

                  <Link
                    to={`/lesson/${lesson.id}`}
                    className="text-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    {completed ? "Do Again" : "Start Lesson"}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center text-sm text-gray-400">
        More lessons will appear here as the course grows.
      </div>
    </div>
  );
}

export default Lessons;
