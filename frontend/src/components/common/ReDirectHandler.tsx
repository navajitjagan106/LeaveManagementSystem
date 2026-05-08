import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const RedirectHandler = () => {
    const { user, initialized } = useSelector((state: RootState) => state.auth);

    if (!initialized) return null; // Wait for Redux to verify session
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === "admin" || !!user?.permissions?.['admin_dashboard']?.can_view) return <Navigate to="/management" replace />;

    return <Navigate to="/dashboard" replace />;
};

export default RedirectHandler;
