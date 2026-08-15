import axios from "axios";

const API = "http://localhost:5000/api/lessons";

export async function getLesson(id) {
  const { data } = await axios.get(`${API}/${id}`);
  return data;
}

export async function getLessons() {
  const { data } = await axios.get(API);
  return data;
}