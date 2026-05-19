import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Bell, Search, Command } from "lucide-react";
import { getNotifications, getNotificationCount, markNotificationsRead } from "../../api/leaveApi";
import { logoutApi } from "../../api/authApi";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useSearch } from "../../context/SearchContext";

type Notification = {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
};

const Header: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { toggle: toggleSearch } = useSearch();
    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMac, setIsMac] = useState(true);

    useEffect(() => {
        setIsMac(typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await getNotificationCount();
            if (res.data?.success) {
                setUnreadCount(res.data.count);
            }
        } catch (err) {
            console.error("Failed to fetch notification count", err);
        }
    };

    const fetchFullNotifications = async () => {
        setLoading(true);
        try {
            const res = await getNotifications();
            if (res.data?.success) {
                setNotifications(res.data.data);
                if (unreadCount > 0) {
                    await markNotificationsRead().catch(console.error);
                    setUnreadCount(0);
                }
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => {
            clearInterval(interval);
        };
    }, []);

    const logout = async () => {
        await logoutApi().catch(() => { });
        window.location.href = "/login";
    };


    return (
        <div className="h-14 bg-primary flex items-center justify-between px-6 text-white sticky top-0 z-50 shadow-md">
            {/* Left: Search Trigger (Main focus) */}
            <div className="flex-1 max-w-xl">
                <button
                    onClick={toggleSearch}
                    className="w-full flex items-center justify-between px-4 py-2 bg-white/10 border border-white/10 rounded-xl hover:bg-white/15 hover:border-white/20 transition-all group text-left"
                >
                    <div className="flex items-center gap-3">
                        <Search size={16} className="text-white/40 group-hover:text-white/60" />
                        <span className="text-sm text-white/40 font-medium">Search any action or ask for help...</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="h-5 px-1.5 rounded border border-white/10 bg-white/5 font-sans text-[9px] font-semibold text-white/50 flex items-center gap-1">
                            {isMac ? (
                                <>
                                    <Command size={10} className="stroke-[2.5px]" />
                                    <span className="text-[10px] font-bold">K</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-bold tracking-tight">Ctrl</span>
                                    <span className="text-[9px] opacity-40">+</span>
                                    <span className="text-[10px] font-bold">K</span>
                                </>
                            )}
                        </kbd>
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-6">
                {/* Notifications Dropdown */}
                <DropdownMenu onOpenChange={(open) => { if (open) fetchFullNotifications(); }}>
                    <DropdownMenuTrigger asChild>
                        <button className="relative p-1.5 rounded-full hover:bg-white/10 transition-colors focus:outline-none cursor-pointer">
                            <Bell size={20} className="text-white" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                        <DropdownMenuLabel className="font-bold text-gray-700 px-3 py-2 text-sm flex items-center justify-between">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                        {loading ? (
                            <div className="flex justify-center items-center py-6 text-xs text-gray-400">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-xs text-gray-400">
                                No notifications
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                                {notifications.map((n) => (
                                    <DropdownMenuItem
                                        key={n.id}
                                        className={`flex flex-col items-start gap-1 p-3 rounded-lg text-xs leading-normal transition-colors focus:bg-gray-50 cursor-default ${!n.is_read ? "bg-indigo-50/50 hover:bg-indigo-50" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <p className="text-gray-800 font-medium">{n.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {new Date(n.created_at).toLocaleString("en-GB", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </p>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center cursor-pointer font-bold text-sm hover:scale-105 active:scale-95 transition-transform focus:outline-none">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                        <DropdownMenuLabel className="px-3 py-2">
                            <p className="font-bold text-sm text-gray-800 leading-tight">{user?.name}</p>
                            <p className="text-[11px] text-gray-400 capitalize mt-0.5">{user?.role || (user?.role_id === 1 ? 'admin' : '')}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                        <DropdownMenuItem
                            onClick={() => navigate("/profile")}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-950 focus:bg-gray-50 focus:text-gray-900 cursor-pointer"
                        >
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                        <DropdownMenuItem
                            onClick={logout}
                            className="px-3 py-2 rounded-lg text-xs font-semibold text-red-500 focus:bg-red-50/50 focus:text-red-600 cursor-pointer"
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Header;