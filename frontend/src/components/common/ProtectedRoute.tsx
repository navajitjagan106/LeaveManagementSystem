import { Navigate } from "react-router-dom";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import { fetchMe } from "../../store/slices/authSlice";
import Loader from "./Loader";

type Props = {
    children: React.ReactNode;
};

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading, initialized } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!initialized) {
            dispatch(fetchMe());
        }
    }, [dispatch, initialized]);

    if (!initialized || loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
};

export default ProtectedRoute;