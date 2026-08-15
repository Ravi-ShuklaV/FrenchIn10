import axios from "axios";

const API = "http://localhost:5000/api/ai";

function getHeaders() {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function chatWithAI(lessonId, messages) {
  const { data } = await axios.post(
    `${API}/chat`,
    {
      lessonId,
      messages,
    },
    getHeaders()
  );

  return data;
}