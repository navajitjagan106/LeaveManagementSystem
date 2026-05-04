import PageHeader from "../common/PageHeader";
import InvitationsSection from "./sections/InvitationsSection";

const AdminInvitationsPage = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <PageHeader title="Invitations" subtitle="Send and manage user invitations" divider />
        <InvitationsSection />
    </div>
);

export default AdminInvitationsPage;
