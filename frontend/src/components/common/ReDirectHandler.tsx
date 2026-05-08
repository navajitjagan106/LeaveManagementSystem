import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchMe } from "../../store/slices/authSlice";

const RedirectHandler = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, initialized } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!initialized) {
            dispatch(fetchMe());
        }
    }, [dispatch, initialized]);

    if (!initialized) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="w-8 h-8 border-primary border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (user.role === "admin" || !!user?.permissions?.['admin_dashboard']?.can_view) return <Navigate to="/management" replace />;

    return <Navigate to="/dashboard" replace />;
};

export default RedirectHandler;
