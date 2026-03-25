import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    History,
    Users,
    CheckCircle,
    Scale,
} from "lucide-react";

const Sidebar: React.FC = () => {
    const location = useLocation();

    const menuItems = [
        { path: "/", label: "Dashboard", icon: LayoutDashboard },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText },
        { path: "/leave-history", label: "Leave History", icon: History },
        { path: "/team-view", label: "Team View", icon: Users },
        { path: "/approvals", label: "Approvals", icon: CheckCircle },
        { path: "/leave-balance", label: "Leave Balance", icon: Scale },
    ];

    return (
        <div className="w-25 bg-[#0b2239] text-white min-h-screen fixed flex flex-col items-center py-4">

            {/* Logo */}
            <div className="mb-6 text-xl font-bold">LeaveMS</div>

            {/* Menu */}
            <nav className="flex flex-col gap-2 w-full items-center">
                {menuItems.map((item) => {
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
        </div>
    );
};

export default Sidebar;