import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

const BlockAdminRoute: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (user && user.role_id === 1) {
    return <Navigate to="/management" replace />;
  }
  return <Outlet />;
};

export default BlockAdminRoute