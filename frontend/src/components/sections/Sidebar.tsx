import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    History,
    Users,
    CheckCircle,
    Scale,
    ShieldUser,
    LogOut
} from "lucide-react";
import { getUserLocal } from "../../utils/getUser";
import { User } from "../../types";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const user = getUserLocal();
        setUser(user);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login"; 
    };
    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText },
        { path: "/leave-history", label: "Leave History", icon: History },
        { path: "/team-view", label: "Team View", icon: Users },
        { path: "/approvals", label: "Approvals", roles: ["manager"], icon: CheckCircle },
        { path: "/leave-balance", label: "Leave Balance", icon: Scale },
        { path: "/admin/employees", label: "Employees", roles: ["admin"], icon: ShieldUser }
    ];

    return (

        <div className="w-28 bg-[#0b2239] text-white min-h-screen fixed flex flex-col justify-between">
            <div className="w-full h-14 bg-[#2f2370] flex items-center justify-center text-white text-lg font-semibold border-b border-black/10">
                LeaveMS
            </div>
            <nav className="flex flex-col gap-2 w-full items-center flex-1 ">
                {menuItems
                    .filter((item) => {
                        if (!item.roles) return true;
                        if (!user) return false
                        return item.roles.includes(user.role);
                    })
                    .map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center w-full py-3 transition-all
                            ${isActive ? "bg-[#132f4c]" : "hover:bg-[#132f4c]"}
                            `}
                            >
                                <Icon size={20} />
                                <span className="text-xs mt-1">{item.label}</span>
                            </Link>
                        );
                    })}
            </nav>

            <div className="w-full flex justify-center mb-4">
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center w-full py-3 hover:bg-[#132f4c] transition-all"
                >
                    <LogOut size={20} />
                    <span className="text-xs mt-1">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;