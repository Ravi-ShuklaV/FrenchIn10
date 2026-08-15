const lessonFiles = import.meta.glob(
  "../lessons/lesson*.json",
  {
    eager: true,
    import: "default",
  }
);

const LESSONS = Object.entries(lessonFiles)
  .map(([filePath, lesson]) => {
    const match = filePath.match(/lesson(\d+)\.json$/);

    return {
      ...lesson,
      id: Number(match[1]),
    };
  })
  .sort((a, b) => a.id - b.id);

console.log(
  "📚 Loaded lessons:",
  LESSONS.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
  }))
);

export async function getLesson(id) {
  const lesson = LESSONS.find(
    (item) => String(item.id) === String(id)
  );

  if (!lesson) {
    throw new Error(`Lesson ${id} not found`);
  }

  return lesson;
}

export async function getLessons() {
  return LESSONS;
}