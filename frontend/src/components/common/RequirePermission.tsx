import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { RootState } from "@/store";

interface RequirePermissionProps {
  page: string;
}

const RequirePermission: React.FC<RequirePermissionProps> = ({ page }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const context = useOutletContext();

  if (!user) return null;

  // Admin bypasses all checks
  if (user.role_id === 1) return <Outlet context={context} />;

  let hasPerm = user.permissions?.[page]?.can_view ?? false;

  // Special logic for approvals page
  if (page === "approvals" && user.has_reportees) {
    hasPerm = true;
  }

  if (!hasPerm) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet context={context} />;
};

export default RequirePermission;
