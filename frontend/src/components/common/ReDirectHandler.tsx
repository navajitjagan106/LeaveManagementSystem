
import { Navigate } from "react-router-dom";

const RedirectHandler = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

export default RedirectHandler;