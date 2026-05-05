import { useState, useEffect, useCallback } from "react";
import { getInvitations, resendInvitation, cancelInvitation } from "../../../api/adminApi";
import InviteEmployeeModal from "../modal/InviteEmployeeModal";
import { useToast } from "../../common/ToastContext";
import { Mail, RefreshCw, X } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-100 text-amber-600",
    accepted: "bg-green-100 text-green-600",
    expired: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-500",
};

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
);

const FILTERS = ["all", "pending", "accepted", "expired", "cancelled"];

const InvitationsSection = () => {
    const toast = useToast();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === 'admin';
    const canEdit = isAdmin || user?.permissions?.['admin_invitations']?.can_edit === true;
    const canDelete = isAdmin || user?.permissions?.['admin_invitations']?.can_delete === true;
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState("all");

    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getInvitations(filter === "all" ? undefined : filter);
            setInvitations(res.data.data || []);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

    const handleResend = async (id: number) => {
        try {
            await resendInvitation(id);
            toast.success("Invitation resent!");
            fetchInvitations();
        } catch {
            toast.error("Failed to resend invitation");
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await cancelInvitation(id);
            toast.success("Invitation cancelled");
            fetchInvitations();
        } catch {
            toast.error("Failed to cancel invitation");
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Invitations</h2>
                    <p className="text-sm text-gray-500">Manage pending and sent invitations</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
                    >
                        <Mail size={15} />
                        Invite Employee
                    </button>
                )}
            </div>

            <div className="flex gap-2 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                            filter === f
                                ? "bg-purple-600 text-white border-purple-600"
                                : "text-gray-500 border-gray-200 hover:border-purple-300"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading invitations...</div>
            ) : invitations.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                    <Mail size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No invitations found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invitations.map((inv) => (
                        <div
                            key={inv.id}
                            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-4 hover:border-purple-200 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {inv.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{inv.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{inv.email}</p>
                                    </div>
                                </div>
                                <StatusBadge status={inv.status} />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role</span>
                                    <span className="text-xs font-medium text-gray-700 capitalize">{inv.role}</span>
                                </div>
                                {inv.department && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dept</span>
                                        <span className="text-xs font-medium text-gray-700">{inv.department}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sent On</span>
                                    <span className="text-xs font-medium text-gray-500">
                                        {new Date(inv.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                    </span>
                                </div>
                            </div>

                            {inv.status === "pending" && (canEdit || canDelete) && (
                                <div className="flex gap-2 mt-1">
                                    {canEdit && (
                                        <button
                                            onClick={() => handleResend(inv.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition"
                                        >
                                            <RefreshCw size={12} /> Resend
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={() => handleCancel(inv.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                                        >
                                            <X size={12} /> Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <InviteEmployeeModal
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchInvitations}
                />
            )}
        </div>
    );
};

export default InvitationsSection;
