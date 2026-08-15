import useSessionStore from "../store/sessionStore";

function Dashboard() {
  const activityHistory = useSessionStore(
    (state) => state.activityHistory
  );

  const completedLessons = useSessionStore(
    (state) => state.completedLessons
  );

  const getStreakStats = useSessionStore(
    (state) => state.getStreakStats
  );

  const streakStats = getStreakStats();

  // =========================
  // TOTAL LEARNING TIME
  // =========================

  const totalSeconds =
    streakStats.totalSeconds || 0;

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  let learningTime = "";

  if (hours > 0) {
    learningTime = `${hours}h ${minutes}m`;
  } else {
    learningTime = `${minutes}m`;
  }

  // =========================
  // EMPTY STATE
  // =========================

  if (completedLessons.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">

        <div className="text-center py-16">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Dashboard
          </p>

          <h1 className="text-4xl font-bold text-slate-800 mt-2">
            Your Progress
          </h1>

          <p className="text-gray-500 mt-3">
            Complete your first lesson to start
            building your progress.
          </p>

        </div>

      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================

  return (
    <div className="max-w-5xl mx-auto">

      {/* HEADER */}

      <div className="mb-8">

        <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
          Dashboard
        </p>

        <h1 className="text-4xl font-bold text-slate-800 mt-2">
          Your Progress
        </h1>

        <p className="text-gray-500 mt-2">
          Keep learning and build your streak.
        </p>

      </div>

      {/* =========================
          STATS
      ========================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* STREAK */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5">

          <p className="text-sm text-gray-500">
            Current streak
          </p>

          <p className="text-3xl font-bold text-orange-500 mt-2">
            🔥 {streakStats.currentStreak}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            days
          </p>

        </div>

        {/* LONGEST STREAK */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5">

          <p className="text-sm text-gray-500">
            Best streak
          </p>

          <p className="text-3xl font-bold text-slate-800 mt-2">
            {streakStats.longestStreak}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            days
          </p>

        </div>

        {/* LESSONS */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5">

          <p className="text-sm text-gray-500">
            Lessons completed
          </p>

          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {streakStats.totalLessons}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            lessons
          </p>

        </div>

        {/* TIME */}

        <div className="bg-white border border-gray-200 rounded-2xl p-5">

          <p className="text-sm text-gray-500">
            Learning time
          </p>

          <p className="text-3xl font-bold text-blue-600 mt-2">
            {learningTime}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            total
          </p>

        </div>

      </div>

      {/* =========================
          ACTIVITY PREVIEW
      ========================= */}

      <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-800">
              Activity
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your recent learning activity
            </p>

          </div>

          <p className="text-sm text-gray-400">
            {activityHistory.length} active days
          </p>

        </div>

        {/* SIMPLE ACTIVITY DOTS */}

        <div className="flex flex-wrap gap-2 mt-6">

          {activityHistory
            .slice(-30)
            .map((day) => (
              <div
                key={day.date}
                title={`${day.date} · ${day.lessonsCompleted} lesson${
                  day.lessonsCompleted === 1
                    ? ""
                    : "s"
                }`}
                className="w-4 h-4 rounded-sm bg-emerald-500"
              />
            ))}

        </div>

      </div>

    </div>
  );
}

export default Dashboard;