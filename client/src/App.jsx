import { Routes, Route } from "react-router-dom";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentQueuePage from "./pages/StudentQueuePage";
import AdminQueuePage from "./pages/AdminQueuePage";
import StudentSlotBookingPage from "./pages/StudentSlotBookingPage";
import AdminSlotManagementPage from "./pages/AdminSlotManagementPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";



function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty-dashboard"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute allowedRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/queue"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentQueuePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/queue"
        element={
          <ProtectedRoute allowedRole="faculty">
            <StudentQueuePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/queue"
        element={
          <ProtectedRoute allowedRole="staff">
            <StudentQueuePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/queue"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminQueuePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/slot-booking"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentSlotBookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/slot-booking"
        element={
          <ProtectedRoute allowedRole="faculty">
            <StudentSlotBookingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/slot-booking"
        element={
          <ProtectedRoute allowedRole="staff">
            <StudentSlotBookingPage />
          </ProtectedRoute>
        }
      />
      <Route
  path="/admin/slot-management"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminSlotManagementPage />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;