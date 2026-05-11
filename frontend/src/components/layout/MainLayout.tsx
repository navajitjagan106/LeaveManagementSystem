import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { getHolidays } from "../../api/leaveApi";
import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store";
import { fetchMe } from "../../store/slices/authSlice";

const LayoutInner = ({ holidays }: { holidays: any[] }) => {
  const { collapsed } = useSidebar();

  return (
    <div className="flex bg-surface h-screen overflow-hidden">
      <Sidebar />
      <div
        className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? 64 : 112 }}
      >
        <Header />
        <div className="flex-1 p-4 md:p-5 overflow-y-auto min-h-0 relative">
          <Outlet context={{ holidays }} />
        </div>
      </div>
    </div>
  );
};

const MainLayout = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    getHolidays()
      .then((res) => setHolidays(res.data))
      .catch((err) => console.error("Failed to fetch holidays", err));
  }, []);

  useEffect(() => {
    // 30-minute interval to keep the sliding session alive (refreshing the HTTPOnly cookie seamlessly)
    const interval = setInterval(() => {
      dispatch(fetchMe());
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <SidebarProvider>
      <LayoutInner holidays={holidays} />
    </SidebarProvider>
  );
};

export default MainLayout;
