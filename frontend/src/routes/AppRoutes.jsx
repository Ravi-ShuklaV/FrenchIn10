import { Routes, Route, Navigate } from "react-router-dom";

import Home from "../pages/Home";
import Dashboard from "../pages/Dashboard";
import Lessons from "../pages/Lessons";
import LessonSession from "../pages/LessonSession";
import SessionComplete from "../pages/SessionComplete";
import Review from "../pages/Review";
import ReviewLesson from "../pages/ReviewLesson";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";

import ProtectedRoutes from "./ProtectedRoutes";

function AppRoutes() {
  return (
    <Routes>

      {/* =========================
          PUBLIC
      ========================= */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* =========================
          PROTECTED
      ========================= */}

      <Route element={<ProtectedRoutes />}>

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/lessons"
          element={<Lessons />}
        />

        <Route
          path="/lesson/:lessonId"
          element={<LessonSession />}
        />

        <Route
          path="/session/:lessonId"
          element={<LessonSession />}
        />

        <Route
          path="/session/complete"
          element={<SessionComplete />}
        />

        <Route
          path="/review"
          element={<Review />}
        />

        <Route
          path="/review/:lessonId"
          element={<ReviewLesson />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

      </Route>


      {/* =========================
          LEGACY ROUTES
      ========================= */}

      <Route
        path="/ai-practice/:lessonId"
        element={
          <Navigate
            to="/lessons"
            replace
          />
        }
      />

      <Route
        path="/lesson-result"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* =========================
          NOT FOUND
      ========================= */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}

export default AppRoutes;