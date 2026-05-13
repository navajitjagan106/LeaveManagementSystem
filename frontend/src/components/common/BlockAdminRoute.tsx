import { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useOutletContext } from "react-router-dom";

const BlockAdminRoute: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const context = useOutletContext();

  if (user && user.role_id === 1) {
    return <Navigate to="/management" replace />;
  }
  return <Outlet context={context} />;
};

export default BlockAdminRoute;