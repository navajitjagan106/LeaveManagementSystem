import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/sections/Sidebar';
import Dashboard from './components/pages/DashBoard';
import ApplyLeave from './components/pages/ApplyLeave';
import LeaveHistory from './components/pages/LeaveHistory';
import Approvals from './components/pages/Approvals';
import TeamView from './components/pages/TeamView';
import LeaveBalance from './components/pages/LeaveBalance';

import Header from "./components/sections/Header";

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex">
        
        <Sidebar />

        <div className="flex-1 ml-20 flex flex-col">
          
          <Header title='DashBoard' />

          <div className="p-6 bg-gray-100 min-h-screen">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/apply-leave" element={<ApplyLeave />} />
              <Route path="/leave-history" element={<LeaveHistory />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/team-view" element={<TeamView />} />
              <Route path="/leave-balance" element={<LeaveBalance />} />
            </Routes>
          </div>

        </div>
      </div>
    </Router>
  );
};

export default  App