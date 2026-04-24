import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { getHolidays } from "../../api/leaveApi";

const MainLayout = () => {
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    getHolidays()
      .then((res) => setHolidays(res.data))
      .catch((err) => console.error("Failed to fetch holidays", err));
  }, []);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-28 flex flex-col">
        <Header />
        <div className="p-6 overflow-y-auto min-h-[calc(100vh-56px)]">
          <Outlet context={{ holidays }} />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
