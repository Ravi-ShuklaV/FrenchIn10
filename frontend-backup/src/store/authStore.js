import { create } from "zustand";

const useAuthStore = create((set) => ({
  token: localStorage.getItem("token"),
  name: localStorage.getItem("name"),

  login: (token, name) => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);

    set({
      token,
      name,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");

    set({
      token: null,
      name: null,
    });
  },
}));

export default useAuthStore;