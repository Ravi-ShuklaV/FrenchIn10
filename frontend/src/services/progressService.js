import axios from "axios";

const API = "http://localhost:5000/api/progress";

function getHeaders() {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function saveProgress(progress) {
  const { data } = await axios.post(
    API,
    progress,
    getHeaders()
  );

  return data;
}

export async function getProgress() {
  const { data } = await axios.get(
    API,
    getHeaders()
  );

  return data;
}