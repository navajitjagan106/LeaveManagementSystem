
import { Navigate } from "react-router-dom";
import { getCookie } from "../../utils/cookies";

const RedirectHandler = () => {
    const token = getCookie("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

export default RedirectHandler;