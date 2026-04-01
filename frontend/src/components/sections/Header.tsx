import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getUserLocal } from "../../utils/getUser";
const Header: React.FC = () => {


const user = getUserLocal();
    const navigate = useNavigate()

    const [showNotif, setShowNotif] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (
                notifRef.current &&
                !notifRef.current.contains(target)
            ) {
                setShowNotif(false);
            }

            if (
                profileRef.current &&
                !profileRef.current.contains(target)
            ) {
                setShowProfile(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="h-14 bg-[#5746AF] flex items-center justify-between px-6 text-white 
sticky top-0 z-50 shadow-md">

            {/* Left */}
            <div className="flex items-center gap-4">
                <span className="font-semibold">Lumel Technologies</span>
                <input
                    className="bg-white text-black px-3 py-1 rounded-md text-sm w-72"
                    placeholder="Search..."
                />
            </div>

            {/* Right */}
            <div className="flex items-center gap-6 relative">

                {/* 🔔 Notification */}
                <div className="relative" ref={notifRef}>
                    <span
                        className="cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowNotif(!showNotif)
                        }}
                    >
                        🔔
                    </span>

                    {showNotif && (
                        <div className="absolute right-0 mt-2 w-64 bg-white text-black rounded-lg shadow-lg p-4 z-50">
                            <p className="font-semibold mb-2">Notifications</p>
                            <p className="text-sm">No new notifications</p>
                        </div>
                    )}
                </div>

                {/* 👤 Profile */}
                <div className="relative" ref={profileRef}>
                    <div
                        className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowProfile(!showProfile);
                        }}
                    >
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>

                    {showProfile && (
                        <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg p-3 z-50"
                            onClick={(e) => e.stopPropagation()}>
                            <p className="font-semibold">{user?.name}</p>
                            <p className="text-sm text-gray-500 mb-2">{user?.role}</p>

                            <button
                                onClick={() => {
                                    navigate("/profile")
                                    setShowProfile(false)
                                }}
                                className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded">
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