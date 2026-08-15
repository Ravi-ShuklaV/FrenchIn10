export async function getLessonInfo(lessonId) {
  const response = await fetch(
    `http://localhost:5000/api/lessons/${lessonId}`
  );

  return await response.json();
}