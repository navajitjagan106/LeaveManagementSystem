import { Navigate } from "react-router-dom";
import React from "react";
import { User } from "../../types";
import { getCookie, removeCookie } from "../../utils/cookies";

type Props = {
    children: React.ReactNode;
    allowedRoles?: string[];
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const user: User | null = (() => {
        try { return JSON.parse(getCookie("user") || "null"); }
        catch { removeCookie("user"); removeCookie("token"); return null; }
    })();

    const token = getCookie("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
export default ProtectedRoute;