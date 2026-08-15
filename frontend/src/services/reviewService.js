import axios from "axios";
import api from "./api";
const API = `${import.meta.env.VITE_API_URL}/api/review`;
function getHeaders() {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function addReview(review) {
  const { data } = await axios.post(
    API,
    review,
    getHeaders()
  );

  return data;
}

export async function getReview() {
  const { data } = await axios.get(
    API,
    getHeaders()
  );

  return data;
}