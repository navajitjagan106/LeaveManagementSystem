import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { getHolidays } from "../../api/leaveApi";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";

const LayoutInner = ({ holidays }: { holidays: any[] }) => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex bg-gray-100 h-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? 64 : 112 }}
      >
        <Header />
        <div className="flex-1 p-5 overflow-y-auto min-h-0">
          <Outlet context={{ holidays }} />
        </div>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const [holidays, setHolidays] = useState<any[]>([]);

  useEffect(() => {
    getHolidays()
      .then((res) => setHolidays(res.data))
      .catch((err) => console.error("Failed to fetch holidays", err));
  }, []);

  return (
    <SidebarProvider>
      <LayoutInner holidays={holidays} />
    </SidebarProvider>
  );
};

export default MainLayout;
