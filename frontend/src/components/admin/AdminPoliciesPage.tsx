import PageHeader from "../common/PageHeader";
import PoliciesSection from "./sections/PolicySection";

const AdminPoliciesPage = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <PageHeader title="Leave Policies" subtitle="Create and configure leave entitlement policies" divider />
        <PoliciesSection />
    </div>
);

export default AdminPoliciesPage;
