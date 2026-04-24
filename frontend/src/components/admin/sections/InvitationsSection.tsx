import { useState, useEffect, useCallback } from "react";
import { getInvitations, resendInvitation, cancelInvitation } from "../../../api/adminApi";
import InviteEmployeeModal from "../modal/InviteEmployeeModal";
import { useToast } from "../../common/ToastContext";
import { Mail, RefreshCw, X } from "lucide-react";

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
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition"
                >
                    <Mail size={15} />
                    Invite Employee
                </button>
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
                <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : invitations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Mail size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No invitations found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {invitations.map((inv) => (
                        <div
                            key={inv.id}
                            className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold shrink-0">
                                    {inv.email[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{inv.email}</p>
                                    <p className="text-xs text-gray-400 capitalize">
                                        {inv.role}{inv.department ? ` · ${inv.department}` : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={inv.status} />
                                <span className="text-xs text-gray-400 hidden sm:block">
                                    {new Date(inv.created_at).toLocaleDateString("en-IN", {
                                        day: "2-digit", month: "short", year: "numeric",
                                    })}
                                </span>
                                {inv.status === "pending" && (
                                    <div className="flex gap-1">
                                        <button onClick={() => handleResend(inv.id)} title="Resend"
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition">
                                            <RefreshCw size={14} />
                                        </button>
                                        <button onClick={() => handleCancel(inv.id)} title="Cancel"
                                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
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
