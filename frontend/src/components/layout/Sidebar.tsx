import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, FileText, History, CheckCircle,
    Scale, ShieldCheck, LogOut, UsersRound, Mail, CalendarDays,
    BookOpen, PanelLeftClose, PanelLeftOpen, Umbrella,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { logout as logoutAction } from "../../store/slices/authSlice";
import { useSidebar } from "../../context/SidebarContext";
import { logoutApi } from "../../api/authApi";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { collapsed, toggle } = useSidebar();

    const handleLogout = async () => {
        try {
            await logoutApi();
        } catch (err) {
            console.error("Backend logout failed", err);
        }
        dispatch(logoutAction());
        window.location.href = "/login";
    };

    const isAdmin = user?.role_id === 1;
    const hasPage = (key: string) => isAdmin || user?.permissions?.[key]?.can_view === true;
    const canManageHolidays = isAdmin || 
        user?.permissions?.["manage_holidays"]?.can_edit === true || 
        user?.permissions?.["manage_holidays"]?.can_delete === true;

    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !isAdmin },
        { path: "/management", label: "Overview", icon: LayoutDashboard, show: hasPage("admin_dashboard") },
        { path: "/approvals", label: "Approvals", icon: CheckCircle, show: !!user?.has_reportees || hasPage("approvals") },
        { path: "/employees", label: "Employees", icon: UsersRound, show: hasPage("manage_employees") },
        { path: "/management/invitations", label: "Invites", icon: Mail, show: hasPage("manage_invitations") },
        { path: "/management/leave-types", label: "Leave Types", icon: CalendarDays, show: hasPage("manage_leave_types") },
        { path: "/management/policies", label: "Policies", icon: BookOpen, show: hasPage("manage_policies") },
        { path: "/management/global-leaves", label: "Global Leaves", icon: FileText, show: hasPage("manage_leave_records") },
        { path: "/management/permissions", label: "Perms", icon: ShieldCheck, show: hasPage("manage_permissions") },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText, show: !isAdmin },
        { path: "/leave-history", label: "History", icon: History, show: !isAdmin },
        { path: "/calendar", label: "Calendar", icon: CalendarDays, show: true },
        { path: "/holidays", label: "Holidays", icon: Umbrella, show: canManageHolidays },
        { path: "/leave-balance", label: "Balance", icon: Scale, show: !isAdmin },
    ];

    const w = collapsed ? "w-16" : "w-28";

    return (
        <div className={`${w} bg-sidebar text-white h-screen fixed flex flex-col transition-all duration-300 z-40`}>
            {/* Logo */}
            <div className="w-full h-14 bg-[#E2E8ED] flex items-center justify-center text-white text-sm font-bold tracking-wide border-b border-black/10 flex-shrink-0 px-2">
                {collapsed ? (
                    <img src="/logo/logo.png" className="w-12 h-12 object-contain rounded-lg" alt="logo" />
                ) : (
                    <div className="flex items-center gap-1.5">
                        <img src="/logo/logo.png" className="w-12 h-12 object-contain rounded-md" alt="logo" />
                    </div>
                )}
            </div>

            {/* Scrollable nav area */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 w-full items-center pt-2 scrollbar-thin">
                {menuItems
                    .filter((item) => item.show)
                    .map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={collapsed ? item.label : undefined}
                                className={`flex flex-col items-center justify-center w-full py-3 transition-all flex-shrink-0
                                    ${isActive ? "bg-sidebar-active" : "hover:bg-sidebar-active"}`}
                                style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}
                            >
                                <Icon size={19} />
                                {!collapsed && <span className="text-[10px] mt-1 font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}
            </nav>

            {/* Bottom: collapse toggle + logout */}
            <div className="flex-shrink-0 border-t border-white/10">
                <button
                    onClick={toggle}
                    className="flex flex-col items-center justify-center w-full py-2.5 hover:bg-sidebar-active transition-all text-white/40 hover:text-white"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                    {!collapsed && <span className="text-[9px] mt-0.5 font-medium">Collapse</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-full py-2.5 hover:bg-sidebar-active transition-all text-white/50 hover:text-white"
                >
                    <LogOut size={19} />
                    {!collapsed && <span className="text-[10px] mt-1 font-medium">Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
