import { Routes, Route } from "react-router-dom";
import { Login } from "./app/pages/Login";
import { Dashboard } from "./app/pages/Dashboard";
import { Settings } from "./app/pages/Settings";
import ProtectedRoute from "./app/components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;