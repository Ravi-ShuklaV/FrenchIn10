import { useEffect, useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import api from "../services/api";
import lesson1 from "../lessons/lesson1.json";

const SKILLS = [
  ["vocabulary", "Vocabulary"],
  ["grammar", "Grammar"],
  ["writing", "Writing"],
  ["speaking", "Speaking"],
  ["conversation", "Conversation"],
];

function formatLearningTime(totalSeconds) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function getDateKey(date) {
  const d = new Date(date);

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function Dashboard() {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // LOAD USER PROGRESS
  // =========================

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);

        const response = await api.get("/progress");

        setProgress(response.data);
      } catch (error) {
        console.error(
          "Failed to load progress:",
          error.response?.data || error.message
        );

        setError(
          error.response?.data?.message ||
            "Failed to load your progress."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  // =========================
  // AGGREGATE SKILLS
  // =========================

  const aggregateSkills = useMemo(() => {
    const skills = Object.fromEntries(
      SKILLS.map(([key]) => [
        key,
        {
          correct: 0,
          total: 0,
        },
      ])
    );

    progress.forEach((lesson) => {
      Object.entries(
        lesson.skillStats || {}
      ).forEach(([skill, stats]) => {
        if (!skills[skill]) return;

        skills[skill].correct +=
          stats.correct || 0;

        skills[skill].total +=
          stats.total || 0;
      });
    });

    return skills;
  }, [progress]);

  const skillScores = useMemo(() => {
    return Object.fromEntries(
      SKILLS.map(([key]) => [
        key,
        aggregateSkills[key].total === 0
          ? null
          : Math.round(
              (aggregateSkills[key].correct /
                aggregateSkills[key].total) *
                100
            ),
      ])
    );
  }, [aggregateSkills]);

  const radarData = SKILLS.map(
    ([key, label]) => ({
      skill: label,
      score: skillScores[key] ?? 0,
    })
  );

  // =========================
  // ACTIVITY
  // =========================

  const activityDates = useMemo(() => {
    return new Set(
      progress
        .filter((item) => item.completed)
        .map((item) =>
          getDateKey(
            item.completedAt ||
              item.createdAt
          )
        )
    );
  }, [progress]);

  const activityDays = Array.from(
    { length: 28 },
    (_, index) => {
      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(
        date.getDate() - (27 - index)
      );

      const dateKey = getDateKey(date);

      return {
        dateKey,
        active: activityDates.has(
          dateKey
        ),
      };
    }
  );

  // =========================
  // STREAK
  // =========================

  const streak = useMemo(() => {
    const dates = [...activityDates].sort();

    let longestStreak = 0;
    let running = 0;
    let previous = null;

    dates.forEach((dateString) => {
      const current = new Date(
        `${dateString}T00:00:00`
      );

      if (!previous) {
        running = 1;
      } else {
        const diff = Math.round(
          (current - previous) /
            86400000
        );

        running =
          diff === 1
            ? running + 1
            : 1;
      }

      longestStreak = Math.max(
        longestStreak,
        running
      );

      previous = current;
    });

    let currentStreak = 0;

    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    if (
      !activityDates.has(
        getDateKey(cursor)
      )
    ) {
      cursor.setDate(
        cursor.getDate() - 1
      );
    }

    while (
      activityDates.has(
        getDateKey(cursor)
      )
    ) {
      currentStreak += 1;

      cursor.setDate(
        cursor.getDate() - 1
      );
    }

    const totalSeconds =
      progress.reduce(
        (sum, lesson) =>
          sum +
          (lesson.durationSeconds || 0),
        0
      );

    return {
      currentStreak,
      longestStreak,
      totalLessons: progress.length,
      totalSeconds,
    };
  }, [progress, activityDates]);

  // =========================
  // RECENT LESSONS
  // =========================

  const recentLessons = [...progress]
    .sort(
      (a, b) =>
        new Date(
          b.completedAt ||
            b.createdAt
        ) -
        new Date(
          a.completedAt ||
            a.createdAt
        )
    )
    .slice(0, 3)
    .map((result) => ({
      result,
      lesson:
        Number(result.lessonId) ===
        Number(lesson1.id)
          ? lesson1
          : null,
    }))
    .filter((item) => item.lesson);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">
          Loading your progress...
        </p>
      </div>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-20">
        <p className="text-red-600 font-semibold">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* =========================
          HEADER
      ========================= */}

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Your progress
        </p>

        <p className="text-gray-400 mt-1">
          Ten minutes a day adds up.
        </p>
      </div>

      {/* =========================
          STATS
      ========================= */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Stat
          label="Current streak"
          value={`🔥 ${streak.currentStreak}`}
          suffix="days"
        />

        <Stat
          label="Best streak"
          value={streak.longestStreak}
          suffix="days"
        />

        <Stat
          label="Lessons completed"
          value={progress.length}
          suffix="lessons"
        />

        <Stat
          label="Learning time"
          value={formatLearningTime(
            streak.totalSeconds
          )}
          suffix="total"
        />
      </div>

      {/* =========================
          SKILLS
      ========================= */}

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mt-6">

        <div className="bg-white border border-gray-200 rounded-2xl p-6">

          <div className="mb-3">
            <h2 className="text-xl font-bold text-slate-800">
              Your skills
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Based on every question you've answered.
            </p>
          </div>

          <div className="h-[340px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <RadarChart
                data={radarData}
                outerRadius="70%"
              >
                <PolarGrid />

                <PolarAngleAxis
                  dataKey="skill"
                />

                <PolarRadiusAxis
                  domain={[0, 100]}
                />

                <Radar
                  dataKey="score"
                  stroke="#059669"
                  fill="#10b981"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">

          <h2 className="text-xl font-bold text-slate-800">
            Skill breakdown
          </h2>

          <div className="mt-5 space-y-4">

            {SKILLS.map(
              ([key, label]) => (
                <div key={key}>

                  <div className="flex justify-between items-center mb-1">

                    <span className="text-sm font-medium text-slate-700">
                      {label}
                    </span>

                    <span className="text-sm font-bold text-slate-800">
                      {skillScores[key] ==
                      null
                        ? "—"
                        : `${skillScores[key]}%`}
                    </span>

                  </div>

                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          skillScores[key] ??
                          0
                        }%`,
                      }}
                    />

                  </div>
                </div>
              )
            )}

          </div>

        </div>
      </div>

      {/* =========================
          ACTIVITY
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Daily streak
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Complete at least one lesson to earn a green dot.
            </p>
          </div>

          <p className="text-sm font-semibold text-emerald-600">
            {activityDates.size} active days
          </p>

        </div>

        <div className="grid grid-cols-7 gap-2 mt-6 max-w-sm">

          {activityDays.map((day) => (
            <div
              key={day.dateKey}
              title={day.dateKey}
              className={`aspect-square rounded-md border ${
                day.active
                  ? "bg-emerald-500 border-emerald-500"
                  : "bg-gray-50 border-gray-200"
              }`}
            />
          ))}

        </div>
      </div>

      {/* =========================
          RECENT LESSONS
      ========================= */}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-6">

        <h2 className="text-xl font-bold text-slate-800">
          Recent lessons
        </h2>

        {recentLessons.length === 0 ? (
          <p className="text-gray-500 mt-4">
            Complete your first lesson to see it here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">

            {recentLessons.map(
              ({ result, lesson }) => (
                <div
                  key={result._id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
                >

                  <div>
                    <p className="font-semibold text-slate-800">
                      {lesson.title}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {lesson.level} ·{" "}
                      {lesson.scenario}
                    </p>
                  </div>

                  <p className="text-xl font-bold text-emerald-600">
                    {result.score}%
                  </p>

                </div>
              )
            )}

          </div>
        )}

      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-2xl font-bold text-slate-800">
          {value}
        </p>

        <span className="text-sm text-gray-400">
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default Dashboard;