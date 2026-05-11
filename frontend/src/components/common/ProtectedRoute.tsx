import { Navigate } from "react-router-dom";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchMe } from "../../store/slices/authSlice";
import Loader from "./Loader";

type Props = {
    children: React.ReactNode;
    allowedRoles?: string[];
    requiredPage?: string;
    blockAdmin?: boolean;
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles, requiredPage, blockAdmin }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading, initialized } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!initialized && !user) {
            dispatch(fetchMe());
        }
    }, [dispatch, initialized, user]);

    if (loading && !initialized) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader />
            </div>
        );
    }

    if (!user && initialized) return <Navigate to="/login" />;

    if (!user) return null;

    if (blockAdmin && user.role === "admin") {
        return <Navigate to="/management" replace />;
    }

    // Admin bypasses all other restrictions
    if (user.role === "admin") return <>{children}</>;

    // If still loading fresh permissions for a specific page check
    if (loading && requiredPage) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader />
            </div>
        );
    }

    // If restrictions are specified, at least one must grant access
    if (allowedRoles || requiredPage) {
        const roleGrants = allowedRoles?.includes(user.role) ?? false;
        let permGrants = requiredPage ? (user.permissions?.[requiredPage]?.can_view ?? false) : false;
        if (requiredPage === "approvals" && user.has_reportees) {
            permGrants = true;
        }
        if (!roleGrants && !permGrants) return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
