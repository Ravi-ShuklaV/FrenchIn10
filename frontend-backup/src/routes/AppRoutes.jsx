import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Lesson from "../pages/Lesson";
import Review from "../pages/Review";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import LessonList from "../pages/LessonList";
import Lessons from "../pages/Lessons";
import LessonResult from "../pages/LessonResult";
import AIPractice from "../pages/AIPractice";
import ProtectedRoute from "../routes/ProtectedRoutes";
import LessonSession from "../pages/LessonSession";
import SessionComplete from "../pages/SessionComplete";
import ReviewLesson from "../pages/ReviewLesson";







function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/lesson-result" element={<LessonResult />} />
      <Route path="/review" element={<Review />} />
      <Route path="/ai-practice/:lessonId" element={<AIPractice />} />
      <Route path="/session/:lessonId" element={<LessonSession />} />
      <Route path="/session/complete" element={<SessionComplete />} />
      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
  path="/review/:lessonId"
  element={<ReviewLesson />}
/>
      <Route
        path="/lessons"
        element={
          <ProtectedRoute>
            <LessonList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lesson/:id"
        element={
          <ProtectedRoute>
            <Lesson />
          </ProtectedRoute>
        }
      />

      <Route
        path="/review"
        element={
          <ProtectedRoute>
            <Review />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
