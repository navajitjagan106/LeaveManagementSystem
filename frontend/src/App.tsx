import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./components/login/Login";
import ProtectedRoute from "./components/login/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";

import Dashboard from "./components/pages/DashBoard";
import ApplyLeave from "./components/pages/ApplyLeave";
import LeaveHistory from "./components/pages/LeaveHistory";
import Approvals from "./components/Manager/Approvals";
import TeamView from "./components/pages/TeamView";
import LeaveBalance from "./components/pages/LeaveBalance";
import Profile from "./components/pages/Profile";
import AdminDashboard from "./components/admin/AdminDashboard";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>

        {/* 🔓 Public */}
        <Route path="/login" element={<Login />} />
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
          <Route path="profile" element={<Profile />}/>
          <Route
            path="/approvals"
            element={
              <ProtectedRoute allowedRoles={["manager"]}>
                <Approvals />
              </ProtectedRoute>

             
            }
          />
          <Route path="/team-view" element={<TeamView />} />
          <Route path="/leave-balance" element={<LeaveBalance />} />
          <Route path="/admin/employees" element={
             <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard/>
              </ProtectedRoute>
          } />
        </Route>

      </Routes>
    </Router>
  );
};

export default App;