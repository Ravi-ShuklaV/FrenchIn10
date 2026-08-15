import api from "./api";

export async function loginUser(userData) {
  const response = await api.post("/auth/login", userData);
  return response.data;
}

export async function registerUser(userData) {
  const response = await api.post("/auth/register", userData);
  return response.data;
}