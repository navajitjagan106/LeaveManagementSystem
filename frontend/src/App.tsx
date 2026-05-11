import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/pages/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./components/pages/DashBoard";
import ApplyLeave from "./components/pages/ApplyLeave";
import LeaveHistory from "./components/pages/LeaveHistory";
import Approvals from "./components/pages/Approvals";
import CalendarPage from "./components/pages/CalendarPage";
import LeaveBalance from "./components/pages/LeaveBalance";
import Profile from "./components/pages/Profile";
import EmployeeDirectory from "./components/pages/EmployeeDirectory";
import EmployeeProfile from "./components/pages/EmployeeProfile";
import RedirectHandler from "./components/common/ReDirectHandler";
import SetupPassword from "./components/pages/SetupPassword";
import HolidaysPage from "./components/pages/HolidaysPage";
import { ToastProvider } from "./components/common/ToastContext";

// Admin pages
import AdminDashboard from "./components/management/AdminDashboard";
import { Navigate } from "react-router-dom";
import ManageInvitationsPage from "./components/management/ManageInvitationsPage";
import ManageLeaveTypesPage from "./components/management/ManageLeaveTypesPage";
import ManagePoliciesPage from "./components/management/ManagePoliciesPage";
import ManagePermissionsPage from "./components/management/ManagePermissionsPage";
import GlobalLeavesPage from "./components/management/GlobalLeavesPage";

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup-password/:token" element={<SetupPassword />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* ── Employee / Manager pages  */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute blockAdmin={true}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="apply-leave"
              element={
                <ProtectedRoute blockAdmin={true}>
                  <ApplyLeave />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-history"
              element={
                <ProtectedRoute blockAdmin={true}>
                  <LeaveHistory />
                </ProtectedRoute>
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route
              path="leave-balance"
              element={
                <ProtectedRoute blockAdmin={true}>
                  <LeaveBalance />
                </ProtectedRoute>
              }
            />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="team-view" element={<Navigate to="/calendar" replace />} />
            <Route path="holidays" element={<HolidaysPage />} />

            <Route
              path="approvals"
              element={
                <ProtectedRoute requiredPage="approvals">
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees"
              element={
                <ProtectedRoute requiredPages={["manage_employees"]}>
                  <EmployeeDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <ProtectedRoute requiredPages={["manage_employees"]}>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />

            {/* ── Management pages  */}
            <Route
              path="management"
              element={
                <ProtectedRoute requiredPage="admin_dashboard">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="management/employees" element={<Navigate to="/employees" replace />} />
            <Route
              path="management/invitations"
              element={
                <ProtectedRoute requiredPage="manage_invitations">
                  <ManageInvitationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="management/leave-types"
              element={
                <ProtectedRoute requiredPage="manage_leave_types">
                  <ManageLeaveTypesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="management/policies"
              element={
                <ProtectedRoute requiredPage="manage_policies">
                  <ManagePoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="management/global-leaves"
              element={
                <ProtectedRoute requiredPage="manage_leave_records">
                  <GlobalLeavesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="management/permissions"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <ManagePermissionsPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<RedirectHandler />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
