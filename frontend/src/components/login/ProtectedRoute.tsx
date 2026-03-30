import { Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { getUser } from "../../utils/getUser";
import { User } from "../../types";

type Props = {
    children: React.ReactNode;
    allowedRoles?: string[];
};

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
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

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" />; 
    }

    return <>{children}</>;
};
export default ProtectedRoute;