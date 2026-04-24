import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, History, Users, CheckCircle, Scale, ShieldUser, LogOut, UsersRound } from "lucide-react";
import { getUserLocal } from "../../utils/getUser";
import { User } from "../../types";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => { setUser(getUserLocal()); }, []);

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
        document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
        window.location.href = "/login";
    };

    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText },
        { path: "/leave-history", label: "History", icon: History },
        { path: "/team-view", label: "Team View", icon: Users },
        { path: "/approvals", label: "Approvals", icon: CheckCircle, roles: ["manager"] },
        { path: "/employees", label: "Employees", icon: UsersRound, roles: ["manager", "admin"] },
        { path: "/leave-balance", label: "Balance", icon: Scale },
        { path: "/admin/employees", label: "Admin", icon: ShieldUser, roles: ["admin"] },
    ];

    return (
        <div className="w-28 bg-[#0b2239] text-white min-h-screen fixed flex flex-col justify-between">
            <div>
                <div className="w-full h-14 bg-[#2f2370] flex items-center justify-center text-white text-sm font-bold tracking-wide border-b border-black/10">
                    LeaveMS
                </div>

                <nav className="flex flex-col gap-1 w-full items-center pt-2">
                    {menuItems
                        .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
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
