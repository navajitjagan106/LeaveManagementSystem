import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, FileText, History, Users, CheckCircle,
    Scale, ShieldCheck, LogOut, UsersRound, Mail, CalendarDays,
    Umbrella, BookOpen,  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { logout as logoutAction } from "../../store/slices/authSlice";
import { useSidebar } from "../../context/SidebarContext";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { collapsed, toggle } = useSidebar();

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
        dispatch(logoutAction());
        window.location.href = "/login";
    };

    const isAdmin = user?.role === "admin";
    const hasPage = (key: string) => isAdmin || user?.permissions?.[key]?.can_view === true;
    const canEditOrDelete = (key: string) =>
        isAdmin || user?.permissions?.[key]?.can_edit === true || user?.permissions?.[key]?.can_delete === true;

    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !isAdmin },

        { path: "/admin", label: "Overview", icon: LayoutDashboard, show: isAdmin },
        { path: "/approvals", label: "Approvals", icon: CheckCircle, show: user?.role === "manager" || hasPage("approvals") },
        { path: "/employees", label: "Employees", icon: UsersRound, show: isAdmin || user?.role === "manager" || hasPage("employee_directory") || hasPage("admin_employees") },
        { path: "/admin/invitations", label: "Invites", icon: Mail, show: isAdmin || hasPage("admin_invitations") },
        { path: "/admin/leave-types", label: "Leave Types", icon: CalendarDays, show: isAdmin || hasPage("admin_leave_types") },
        // Only show Holidays in sidebar when user can edit/delete (not just view)
        { path: "/admin/holidays", label: "Holidays", icon: Umbrella, show: canEditOrDelete("admin_holidays") },
        { path: "/admin/policies", label: "Policies", icon: BookOpen, show: isAdmin || hasPage("admin_policies") },
        { path: "/admin/permissions", label: "Perms", icon: ShieldCheck, show: isAdmin },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText, show: !isAdmin },
        { path: "/leave-history", label: "History", icon: History, show: !isAdmin },
        { path: "/team-view", label: "Team View", icon: Users, show: true },
        { path: "/leave-balance", label: "Balance", icon: Scale, show: !isAdmin },
    ];

    const w = collapsed ? "w-16" : "w-28";

    return (
        <div className={`${w} bg-[#0b2239] text-white h-screen fixed flex flex-col transition-all duration-300 z-40`}>
            {/* Logo */}
            <div className="w-full h-14 bg-[#2f2370] flex items-center justify-center text-white text-sm font-bold tracking-wide border-b border-black/10 flex-shrink-0">
                {collapsed ? "L" : "LeaveMS"}
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
                                    ${isActive ? "bg-[#132f4c]" : "hover:bg-[#132f4c]"}`}
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
                    className="flex flex-col items-center justify-center w-full py-2.5 hover:bg-[#132f4c] transition-all text-white/40 hover:text-white"
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                    {!collapsed && <span className="text-[9px] mt-0.5 font-medium">Collapse</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-full py-2.5 hover:bg-[#132f4c] transition-all text-white/50 hover:text-white"
                >
                    <LogOut size={19} />
                    {!collapsed && <span className="text-[10px] mt-1 font-medium">Logout</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
