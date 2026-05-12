import PageHeader from "../common/PageHeader";
import { useState, useEffect, useCallback, useMemo } from "react";
import { getInvitations, resendInvitation, cancelInvitation } from "../../api/managementApi";
import InviteEmployeeModal from "../modals/InviteEmployeeModal";
import { getAvatarGradient } from "../../utils/avatar";
import { useToast } from "../common/ToastContext";
import { Mail, RefreshCw, X, ChevronLeft, ChevronRight, Clock, Briefcase, User, ArrowUpRight, ShieldCheck, UserCheck, MoreHorizontal } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useAsync } from "../../hooks/useAsync";

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-amber-100 text-amber-600",
    accepted: "bg-emerald-100 text-emerald-600",
    expired: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-500",
};

const FILTERS = ["all", "pending", "accepted", "expired", "cancelled"];



const InvitationCard = ({ inv, onResend, onCancel, canEdit, canDelete }: any) => {
    const [showMenu, setShowMenu] = useState(false);
    const statusStyle = STATUS_STYLES[inv.status] || "bg-gray-100 text-gray-500";
    const avatarCol = getAvatarGradient(inv.id || inv.name || inv.email);
    const formattedExpiry = new Date(inv.expires_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    const canResend = inv.status === "pending" || inv.status === "expired" || inv.status === "cancelled";
    const canCancelAction = inv.status === "pending" || inv.status === "expired";

    return (
        <div 
            onMouseLeave={() => setShowMenu(false)}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between hover:border-primary-light hover:shadow-lg hover:shadow-primary-light/5 hover:translate-y-[-2px] transition-all duration-300 group min-h-[220px] relative"
        >
            <div className="space-y-4">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-tr ${avatarCol}`}
                        >
                            {(inv.name || inv.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800 truncate" title={inv.name || "Invite Pending"}>
                                {inv.name || "Corporate Invite"}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5" title={inv.email}>{inv.email}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest ${statusStyle} flex-shrink-0`}>
                            {inv.status}
                        </span>
                        
                        {canEdit && (canResend || (canDelete && canCancelAction)) && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                                    aria-label="Actions Menu"
                                >
                                    <MoreHorizontal size={16} />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20">
                                        {canResend && (
                                            <button
                                                onClick={() => {
                                                    onResend(inv.id);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all"
                                            >
                                                <RefreshCw size={12} className="text-gray-400" />
                                                Resend Invite
                                            </button>
                                        )}
                                        {canDelete && canCancelAction && (
                                            <button
                                                onClick={() => {
                                                    onCancel(inv.id);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-all border-t border-gray-50"
                                            >
                                                <X size={12} className="text-red-400" />
                                                Cancel Invite
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <hr className="border-gray-50" />

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <Briefcase size={11} className="text-gray-300 flex-shrink-0" />
                            <span>Department</span>
                        </div>
                        <p className="font-semibold text-gray-700 mt-1 truncate" title={inv.department}>{inv.department || "—"}</p>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <User size={11} className="text-gray-300 flex-shrink-0" />
                            <span>Assigned Role</span>
                        </div>
                        <p className="font-semibold text-gray-700 mt-1 capitalize truncate" title={inv.role}>{inv.role || "—"}</p>
                    </div>

                    {inv.manager_name && (
                        <div className="min-w-0 col-span-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <UserCheck size={11} className="text-gray-300 flex-shrink-0" />
                                <span>Reporting To</span>
                            </div>
                            <p className="font-semibold text-gray-700 mt-1 truncate" title={inv.manager_name}>{inv.manager_name}</p>
                        </div>
                    )}

                    {inv.policy_name && (
                        <div className="min-w-0 col-span-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                <ShieldCheck size={11} className="text-gray-300 flex-shrink-0" />
                                <span>Leave Policy</span>
                            </div>
                            <p className="font-semibold text-gray-700 mt-1 truncate" title={inv.policy_name}>{inv.policy_name}</p>
                        </div>
                    )}
                </div>

                {/* Meta details footer */}
                <div className="pt-3 border-t border-gray-50/50 space-y-1.5 text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <ArrowUpRight size={11} className="text-gray-300 flex-shrink-0" />
                        <span>Invited by <span className="font-semibold text-gray-600">{inv.inviter_name || "Admin"}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-gray-300 flex-shrink-0" />
                        <span>Expires <span className="font-semibold text-gray-500">{formattedExpiry}</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ManageInvitationsPage = () => {
    const toast = useToast();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role_id === 1;
    const canEdit = isAdmin || user?.permissions?.['manage_invitations']?.can_edit === true;
    const canDelete = isAdmin || user?.permissions?.['manage_invitations']?.can_delete === true;

    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState("all");
    const [invPage, setInvPage] = useState(1);

    const { data: invData, LoadingScreen, execute: fetchInvitations } = useAsync(
        useCallback(() => getInvitations(filter === "all" ? undefined : filter), [filter]),
        true
    );

    useEffect(() => {
        setInvPage(1);
    }, [filter]);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const invitations = useMemo(() => invData?.data || [], [invData]);

    const INV_ITEMS_PER_PAGE = 6;
    const totalInvPages = Math.ceil(invitations.length / INV_ITEMS_PER_PAGE) || 1;
    const paginatedInvitations = useMemo(() => {
        const startIdx = (invPage - 1) * INV_ITEMS_PER_PAGE;
        return invitations.slice(startIdx, startIdx + INV_ITEMS_PER_PAGE);
    }, [invitations, invPage]);

    const handleResend = async (id: number) => {
        try {
            await resendInvitation(id);
            toast.success("Invitation resent successfully!");
            fetchInvitations();
        } catch {
            toast.error("Failed to resend invitation");
        }
    };

    const handleCancel = async (id: number) => {
        try {
            await cancelInvitation(id);
            toast.success("Invitation cancelled successfully");
            fetchInvitations();
        } catch {
            toast.error("Failed to cancel invitation");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 relative min-h-[400px] h-fit flex-shrink-0 pb-10">
            <LoadingScreen />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PageHeader title="Invitations" subtitle="Manage pending and sent invitations" />
                    {/* Small cute Admin illustration next to title */}
                    <img 
                        src="/Admin-rafiki.svg" 
                        className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                        alt="Admin Graphic" 
                    />
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 flex-shrink-0"
                    >
                        <Mail size={13} /> Invite Employee
                    </button>
                )}
            </div>
            <hr className="border-gray-100" />

            <div className="flex gap-2 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl font-bold border transition ${filter === f
                            ? "bg-primary border-primary text-white shadow-sm shadow-primary-light"
                            : "bg-white border-gray-150 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {invitations.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center gap-2">
                    <Mail size={28} className="text-gray-300" />
                    <p>No invitations found with filter "{filter}"</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paginatedInvitations.map((inv: any) => (
                            <InvitationCard
                                key={inv.id}
                                inv={inv}
                                onResend={handleResend}
                                onCancel={handleCancel}
                                canEdit={canEdit}
                                canDelete={canDelete}
                            />
                        ))}
                    </div>

                    {totalInvPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-xl select-none">
                            <span className="text-[11px] font-medium text-gray-400">
                                Page <span className="font-bold text-gray-700">{invPage}</span> of <span className="font-bold text-gray-700">{totalInvPages}</span>
                            </span>

                            <div className="flex gap-2">
                                <button
                                    disabled={invPage === 1}
                                    onClick={() => setInvPage(p => p - 1)}
                                    className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                <button
                                    disabled={invPage === totalInvPages}
                                    onClick={() => setInvPage(p => p + 1)}
                                    className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <InviteEmployeeModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { fetchInvitations(); setShowModal(false); }}
                />
            )}
        </div>
    );
};

export default ManageInvitationsPage;
