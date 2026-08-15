function LessonHeader({ lesson }) {
  return (
    <div>
      <h1 className="text-4xl font-bold">
        {lesson.title}
      </h1>

      <p className="mt-2 text-gray-500">
        {lesson.scenario} • {lesson.difficulty}
      </p>
    </div>
  );
}

export default LessonHeader;