import lesson1 from "../lessons/lesson1.json";

const LESSONS = [lesson1];

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
