import { Navigate } from "react-router-dom";
import React, { createContext, useContext } from "react";
import { User } from "../../types";
import { getCookie } from "../../utils/cookies";

type Props = {
    children: React.ReactNode;
    allowedRoles?: string[];
    requiredPage?: string;
};

// Lightweight context that inner ProtectedRoutes (inside MainLayout) can use
// to get the live user from UserProvider. Defaults to null when outside the provider.
export const LiveUserContext = createContext<{ user: User | null; loading: boolean } | null>(null);

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles, requiredPage }) => {
    const liveCtx = useContext(LiveUserContext);

    // Use live context if available, otherwise fall back to cookie
    let user: User | null = liveCtx?.user ?? null;
    const loading = liveCtx?.loading ?? false;

    if (!user) {
        try {
            user = JSON.parse(getCookie("user") || "null");
        } catch {
            user = null;
        }
    }

    if (!user) return <Navigate to="/login" />;

    // Admin bypasses all restrictions
    if (user.role === "admin") return <>{children}</>;

    // If still loading fresh permissions, show a brief spinner to avoid false redirects
    if (loading && requiredPage) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // If restrictions are specified, at least one must grant access
    if (allowedRoles || requiredPage) {
        const roleGrants = allowedRoles?.includes(user.role) ?? false;
        const permGrants = requiredPage ? (user.permissions?.[requiredPage]?.can_view ?? false) : false;
        if (!roleGrants && !permGrants) return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
