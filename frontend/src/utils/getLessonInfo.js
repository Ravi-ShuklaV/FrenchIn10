export async function getLessonInfo(lessonId) {
  const response = await fetch(
   `${import.meta.env.VITE_API_URL}/api/lessons/${lessonId}`
  );

  return await response.json();
}