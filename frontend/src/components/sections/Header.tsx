import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserLocal } from "../../utils/getUser";
import { Bell } from "lucide-react";
import { getNotifications, markNotificationsRead } from "../../api/leaveApi";

type Notification = {
    id: number;
    message: string;
    is_read: boolean;
    created_at: string;
};

const Header: React.FC = () => {
    const user = getUserLocal();
    const navigate = useNavigate();

    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications();
            setNotifications(res.data.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleBellClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowNotif(!showNotif);
        if (!showNotif && unreadCount > 0) {
            await markNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (notifRef.current && !notifRef.current.contains(target)) setShowNotif(false);
            if (profileRef.current && !profileRef.current.contains(target)) setShowProfile(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="h-14 bg-[#5746AF] flex items-center justify-between px-6 text-white sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-4">
                <span className="font-semibold">Lumel Technologies</span>
                <input
                    className="bg-white text-black px-3 py-1 rounded-md text-sm w-72"
                    placeholder="Search..."
                />
            </div>

            <div className="flex items-center gap-6 relative">
                <div className="relative" ref={notifRef}>
                    <span className="cursor-pointer relative" onClick={handleBellClick}>
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </span>

                    {showNotif && (
                        <div className="absolute right-0 mt-2 w-80 bg-white text-black rounded-lg shadow-lg z-50 overflow-hidden">
                            <p className="font-semibold px-4 py-3 border-b text-sm">Notifications</p>
                            {notifications.length === 0 ? (
                                <p className="text-sm text-gray-400 px-4 py-3">No notifications</p>
                            ) : (
                                <div className="max-h-72 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`px-4 py-3 border-b last:border-0 text-sm ${!n.is_read ? "bg-purple-50" : ""}`}
                                        >
                                            <p className="text-gray-800 leading-snug">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative" ref={profileRef}>
                    <div
                        className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setShowProfile(!showProfile); }}
                    >
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    {showProfile && (
                        <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg p-3 z-50"
                            onClick={(e) => e.stopPropagation()}>
                            <p className="font-semibold">{user?.name}</p>
                            <button
                                onClick={() => { navigate("/profile"); setShowProfile(false); }}
                                className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded"
                            >
                                Profile
                            </button>
                            <button
                                onClick={logout}
                                className="w-full text-left text-red-500 hover:bg-gray-100 px-2 py-1 rounded"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;