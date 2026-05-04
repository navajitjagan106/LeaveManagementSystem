import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, FileText, History, Users, CheckCircle,
    Scale, ShieldCheck, LogOut, UsersRound, Mail, CalendarDays,
    Umbrella, BookOpen, UserCog,
} from "lucide-react";
import { useUser } from "../../context/UserContext";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user } = useUser();

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
        window.location.href = "/login";
    };

    const isAdmin = user?.role === "admin";
    const hasPage = (key: string) => isAdmin || user?.permissions?.[key]?.can_view === true;

    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !isAdmin },

        { path: "/admin", label: "Overview", icon: LayoutDashboard, show: isAdmin },
        { path: "/approvals", label: "Approvals", icon: CheckCircle, show: user?.role === "manager" || hasPage("approvals") },
        { path: "/admin/employees", label: "Employees", icon: UsersRound, show: isAdmin || hasPage("admin_employees") },
        { path: "/admin/invitations", label: "Invites", icon: Mail, show: isAdmin || hasPage("admin_invitations") },
        { path: "/admin/leave-types", label: "Leave Types", icon: CalendarDays, show: isAdmin || hasPage("admin_leave_types") },
        { path: "/admin/holidays", label: "Holidays", icon: Umbrella, show: isAdmin || hasPage("admin_holidays") },
        { path: "/admin/policies", label: "Policies", icon: BookOpen, show: isAdmin || hasPage("admin_policies") },
        { path: "/admin/permissions", label: "Perms", icon: ShieldCheck, show: isAdmin },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText, show: !isAdmin },
        { path: "/leave-history", label: "History", icon: History, show: !isAdmin },
        { path: "/team-view", label: "Team View", icon: Users, show: true },
        { path: "/employees", label: "Employees", icon: UserCog, show: user?.role === "manager" || hasPage("employee_directory") },
        { path: "/leave-balance", label: "Balance", icon: Scale, show: !isAdmin },
    ];

    return (
        <div className="w-28 bg-[#0b2239] text-white min-h-screen fixed flex flex-col justify-between">
            <div>
                <div className="w-full h-14 bg-[#2f2370] flex items-center justify-center text-white text-sm font-bold tracking-wide border-b border-black/10">
                    LeaveMS
                </div>

                <nav className="flex flex-col gap-1 w-full items-center pt-2">
                    {menuItems
                        .filter((item) => item.show)
                        .map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex flex-col items-center justify-center w-full py-3 transition-all
                                        ${isActive ? "bg-[#132f4c]" : "hover:bg-[#132f4c]"}`}
                                    style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.6)" }}
                                >
                                    <Icon size={19} />
                                    <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                </nav>
            </div>

            <div className="w-full flex justify-center mb-4">
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-full py-3 hover:bg-[#132f4c] transition-all text-white/50 hover:text-white"
                >
                    <LogOut size={19} />
                    <span className="text-[10px] mt-1 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
