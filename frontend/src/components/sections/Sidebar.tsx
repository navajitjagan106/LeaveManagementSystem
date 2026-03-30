import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    History,
    Users,
    CheckCircle,
    Scale,
} from "lucide-react";
import { getUser } from "../../utils/getUser";
import { User } from "../../types";

const Sidebar: React.FC = () => {
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getUser();
                setUser(res.data.data);
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        };

        fetchUser();
    }, []);

    const menuItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/apply-leave", label: "Apply Leave", icon: FileText },
        { path: "/leave-history", label: "Leave History", icon: History },
        { path: "/team-view", label: "Team View", icon: Users },
        { path: "/approvals", label: "Approvals", roles: ["manager"], icon: CheckCircle },
        { path: "/leave-balance", label: "Leave Balance", icon: Scale },
    ];

    return (

        <div className="w-28 bg-[#0b2239] text-white min-h-screen fixed flex flex-col ">

            {/* Logo */}
            <div className="w-full h-14 bg-[#2f2370] flex items-center justify-center text-white text-lg font-semibold border-b border-black/10">
                LeaveMS
            </div>
            {/* Menu */}
            <nav className="flex flex-col gap-2 w-full items-center">
                {menuItems
                    .filter((item) => {
                        if (!item.roles) return true; // no restriction
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
        </div>
    );
};

export default Sidebar;