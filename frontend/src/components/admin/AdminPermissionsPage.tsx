import PageHeader from "../common/PageHeader";
import PermissionsSection from "./sections/PermissionsSection";

const AdminPermissionsPage = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <PageHeader title="Page Permissions" subtitle="Control which pages each user can access and what they can do" divider />
        <PermissionsSection />
    </div>
);

export default AdminPermissionsPage;
