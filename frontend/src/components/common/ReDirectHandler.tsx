import { Navigate } from "react-router-dom";
import { getCookie } from "../../utils/cookies";
import { User } from "../../types";

const RedirectHandler = () => {
    const raw = getCookie("user");
    if (!raw) return <Navigate to="/login" replace />;

    try {
        const user: User = JSON.parse(raw);
        if (user.role === "admin") return <Navigate to="/admin" replace />;
    } catch {
        // fall through
    }

    return <Navigate to="/dashboard" replace />;
};

export default RedirectHandler;
