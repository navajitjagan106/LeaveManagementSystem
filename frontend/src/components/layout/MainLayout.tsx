import React from "react";
import Sidebar from "../sections/Sidebar";
import Header from "../sections/Header";

import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-28 flex flex-col">
        <Header />

        <div className="p-6 bg-gray-100 h-[calc(100vh-56px)] overflow-y-auto">
          <Outlet />   
        </div>
      </div>
    </div>
  );
};

export default MainLayout;