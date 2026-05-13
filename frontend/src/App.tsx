import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import LandingPage from "./components/pages/LandingPage";

// Admin pages
import AdminDashboard from "./components/management/AdminDashboard";
import ManageInvitationsPage from "./components/management/ManageInvitationsPage";
import ManageLeaveTypesPage from "./components/management/ManageLeaveTypesPage";
import ManagePoliciesPage from "./components/management/ManagePoliciesPage";
import ManagePermissionsPage from "./components/management/ManagePermissionsPage";
import GlobalLeavesPage from "./components/management/GlobalLeavesPage";
import BlockAdminRoute from "./components/common/BlockAdminRoute";
import RequirePermission from "./components/common/RequirePermission";

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup-password/:token" element={<SetupPassword />} />

          {/* One wrapper handles auth + layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Then separate wrappers for specific guard types */}
            <Route element={<BlockAdminRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="apply-leave" element={<ApplyLeave />} />
              <Route path="leave-history" element={<LeaveHistory />} />
              <Route path="leave-balance" element={<LeaveBalance />} />
            </Route>

            {/* No guard needed - all roles */}
            <Route path="profile" element={<Profile />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="holidays" element={<HolidaysPage />} />

            {/* Permission-based guard */}
            <Route element={<RequirePermission page="approvals" />}>
              <Route path="approvals" element={<Approvals />} />
            </Route>

            <Route element={<RequirePermission page="manage_employees" />}>
              <Route path="employees" element={<EmployeeDirectory />} />
              <Route path="employees/:id" element={<EmployeeProfile />} />
            </Route>

            {/* Management section */}
            <Route element={<RequirePermission page="admin_dashboard" />}>
              <Route path="management" element={<AdminDashboard />} />
            </Route>

            <Route path="management/employees" element={<Navigate to="/employees" replace />} />

            <Route element={<RequirePermission page="manage_invitations" />}>
              <Route path="management/invitations" element={<ManageInvitationsPage />} />
            </Route>

            <Route element={<RequirePermission page="manage_leave_types" />}>
              <Route path="management/leave-types" element={<ManageLeaveTypesPage />} />
            </Route>

            <Route element={<RequirePermission page="manage_policies" />}>
              <Route path="management/policies" element={<ManagePoliciesPage />} />
            </Route>

            <Route element={<RequirePermission page="manage_leave_records" />}>
              <Route path="management/global-leaves" element={<GlobalLeavesPage />} />
            </Route>

            <Route element={<RequirePermission page="manage_permissions" />}>
              <Route path="management/permissions" element={<ManagePermissionsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<RedirectHandler />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
