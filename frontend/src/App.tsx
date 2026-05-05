import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/pages/Login";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./components/pages/DashBoard";
import ApplyLeave from "./components/pages/ApplyLeave";
import LeaveHistory from "./components/pages/LeaveHistory";
import Approvals from "./components/Manager/Approvals";
import TeamView from "./components/pages/TeamView";
import LeaveBalance from "./components/pages/LeaveBalance";
import Profile from "./components/pages/Profile";
import EmployeeDirectory from "./components/pages/EmployeeDirectory";
import EmployeeProfile from "./components/pages/EmployeeProfile";
import RedirectHandler from "./components/common/ReDirectHandler";
import AcceptInvitation from "./components/pages/AcceptInvitation";
import HolidaysPage from "./components/pages/HolidaysPage";
import { ToastProvider } from "./components/common/ToastContext";

// Admin pages
import AdminDashboard from "./components/admin/AdminDashboard";
import { Navigate } from "react-router-dom";
import AdminInvitationsPage from "./components/admin/AdminInvitationsPage";
import AdminLeaveTypesPage from "./components/admin/AdminLeaveTypesPage";
import AdminHolidaysPage from "./components/admin/AdminHolidaysPage";
import AdminPoliciesPage from "./components/admin/AdminPoliciesPage";
import AdminPermissionsPage from "./components/admin/AdminPermissionsPage";

const App: React.FC = () => {   
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* ── Employee / Manager pages  */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="apply-leave" element={<ApplyLeave />} />
            <Route path="leave-history" element={<LeaveHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leave-balance" element={<LeaveBalance />} />
            <Route path="team-view" element={<TeamView />} />
            <Route path="holidays" element={<HolidaysPage />} />

            <Route
              path="approvals"
              element={
                <ProtectedRoute allowedRoles={["manager"]} requiredPage="approvals">
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route
            
              path="employees"
              element={
                <ProtectedRoute allowedRoles={["manager", "admin"]} requiredPage="employee_directory">
                  <EmployeeDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <ProtectedRoute allowedRoles={["manager", "admin"]} requiredPage="employee_directory">
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />

            {/* ── Admin pages  */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="admin/employees" element={<Navigate to="/employees" replace />} />
            <Route
              path="admin/invitations"
              element={
                <ProtectedRoute requiredPage="admin_invitations">
                  <AdminInvitationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/leave-types"
              element={
                <ProtectedRoute requiredPage="admin_leave_types">
                  <AdminLeaveTypesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/holidays"
              element={
                <ProtectedRoute requiredPage="admin_holidays">
                  <AdminHolidaysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/policies"
              element={
                <ProtectedRoute requiredPage="admin_policies">
                  <AdminPoliciesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/permissions"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPermissionsPage />
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
