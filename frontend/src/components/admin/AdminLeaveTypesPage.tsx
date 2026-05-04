import PageHeader from "../common/PageHeader";
import LeaveSection from "./sections/LeaveSection";

const AdminLeaveTypesPage = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <PageHeader title="Leave Types" subtitle="Create and configure leave type definitions" divider />
        <LeaveSection />
    </div>
);

export default AdminLeaveTypesPage;
