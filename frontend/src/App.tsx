import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/pages/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./components/pages/DashBoard";
import ApplyLeave from "./components/pages/ApplyLeave";
import LeaveHistory from "./components/pages/LeaveHistory";
import Approvals from "./components/manager/Approvals";
import TeamView from "./components/pages/TeamView";
import LeaveBalance from "./components/pages/LeaveBalance";
import Profile from "./components/pages/Profile";
import AdminDashboard from "./components/admin/AdminDashboard";
import EmployeeDirectory from "./components/pages/EmployeeDirectory";
import RedirectHandler from "./components/common/ReDirectHandler";
import { ToastProvider } from "./components/common/ToastContext";
import AcceptInvitation from "./components/pages/AcceptInvitation";


const App: React.FC = () => {
  return (
    <ToastProvider>

    <Router>
      <Routes>
      <Route path="*" element={<RedirectHandler />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="apply-leave" element={<ApplyLeave />} />
          <Route path="leave-history" element={<LeaveHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="approvals"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Approvals />
              </ProtectedRoute>
            }
          />
          <Route path="team-view" element={<TeamView />} />
          <Route path="leave-balance" element={<LeaveBalance />} />
          <Route
            path="employees"
            element={
              <ProtectedRoute allowedRoles={["manager", "admin"]}>
                <EmployeeDirectory />
              </ProtectedRoute>
            }
          />
          <Route path="admin/employees" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Route>

      </Routes>
    </Router>
    </ToastProvider>

  );
};

export default App;