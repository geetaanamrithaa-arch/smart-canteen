import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);

  if (user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === "faculty") {
      return <Navigate to="/faculty-dashboard" replace />;
    } else if (user.role === "staff") {
      return <Navigate to="/staff-dashboard" replace />;
    } else {
      return <Navigate to="/student-dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;