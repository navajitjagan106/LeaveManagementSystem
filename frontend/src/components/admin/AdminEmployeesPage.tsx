import PageHeader from "../common/PageHeader";
import AdminEmployees from "./AdminEmployees";

const AdminEmployeesPage = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <PageHeader title="Manage Employees" subtitle="View, edit and remove employee accounts" divider />
        <AdminEmployees />
    </div>
);

export default AdminEmployeesPage;
