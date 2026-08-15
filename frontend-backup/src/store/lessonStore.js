import { create } from "zustand";

const useLessonStore = create((set) => ({
  currentStep: 0,

  nextStep: () =>
    set((state) => ({
      currentStep: state.currentStep + 1,
    })),

  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    })),

  resetLesson: () =>
    set({
      currentStep: 0,
    }),
}));

export default useLessonStore;