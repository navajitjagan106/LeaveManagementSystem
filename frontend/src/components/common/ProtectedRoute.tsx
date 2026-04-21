import { Navigate } from "react-router-dom";
import React from "react";
import { User } from "../../types";

type Props = {
    children: React.ReactNode;
    allowedRoles?: string[];
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const user: User | null = (() => {
        try { return JSON.parse(localStorage.getItem("user") || "null"); }
        catch { localStorage.removeItem("user"); localStorage.removeItem("token"); return null; }
    })();

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
export default ProtectedRoute;