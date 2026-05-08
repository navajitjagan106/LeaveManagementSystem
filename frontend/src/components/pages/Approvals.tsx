import React, { useCallback, useEffect, useState } from 'react';
import { getPending, approveLeave } from '../../api/leaveApi';
import { ApprovalRequest } from "../../types";
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { useToast } from '../common/ToastContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import ApprovalSheetModal from "../modals/ApprovalSheetModal";
import {
    Calendar, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: "Pending", row: "bg-amber-50/40 text-amber-600 border-amber-100/50", badge: "bg-amber-50 text-amber-600 border-amber-100/80" },
    approved: { label: "Approved", row: "bg-emerald-50/40 text-emerald-600 border-emerald-100/50", badge: "bg-emerald-50 text-emerald-600 border-emerald-100/80" },
    rejected: { label: "Rejected", row: "bg-rose-50/40 text-rose-600 border-rose-100/50", badge: "bg-rose-50 text-rose-600 border-rose-100/80" },
};

const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const Approvals: React.FC = () => {
    const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [filters, setFilters] = useState({ status: '', search: '', date: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [selected, setSelected] = useState<ApprovalRequest | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const t = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput }));
            setPage(1);
        }, 500);
        return () => clearTimeout(t);
    }, [searchInput]);

    const fetchApprovals = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, any> = { page, limit: 10 };
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;
            if (filters.date) params.date = filters.date;
            const res = await getPending(params);
            setApprovalQueue(res.data.data);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error("Failed to get leave requests", err);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

    const openSheet = (req: ApprovalRequest) => {
        setSelected(req);
        setSheetOpen(true);
        setShowRejectInput(false);
        setRejectReason('');
    };

    const closeSheet = () => {
        setSheetOpen(false);
        setShowRejectInput(false);
        setRejectReason('');
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            const res = await approveLeave(id, "approved");
            if (res.data.success) {
                toast.success("Leave approved");
                closeSheet();
                fetchApprovals();
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to approve");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!rejectReason.trim()) return;
        try {
            setProcessingId(id);
            const res = await approveLeave(id, "rejected", rejectReason.trim());
            if (res.data.success) {
                toast.success("Leave rejected");
                closeSheet();
                fetchApprovals();
            }
        } catch (err) {
            toast.error("Failed to reject");
        } finally {
            setProcessingId(null);
        }
    };

    const isProcessing = processingId === selected?.id;

    if (loading) return <div className="flex justify-center py-16"><Loader /></div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <PageHeader
                title="Approvals"
                subtitle="Manage leave requests from your team"
                divider
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center pb-5 mb-5 border-b border-gray-100">
                <Select
                    value={filters.status || "all"}
                    onValueChange={(v) => {
                        setPage(1);
                        setFilters(prev => ({ ...prev, status: v === "all" ? "" : v }));
                    }}
                >
                    <SelectTrigger className="w-36 h-9 text-sm">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by employee name..."
                    className="flex-1 max-w-xs h-9 text-sm"
                />

                <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) => {
                        setPage(1);
                        setFilters(prev => ({ ...prev, date: e.target.value }));
                    }}
                    className="w-44 h-9 text-sm text-gray-700 font-medium"
                    title="Filter by date of leave"
                />

                {(filters.status || filters.search || filters.date) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9"
                        onClick={() => { setPage(1); setFilters({ status: '', search: '', date: '' }); setSearchInput(''); }}
                    >
                        Clear
                    </Button>
                )}

                <span className="ml-auto text-xs text-gray-400">
                    {approvalQueue.length} request{approvalQueue.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* List */}
            {approvalQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <img
                        src="/empty.svg"
                        className="w-40 h-40 mb-4 object-contain opacity-80 select-none"
                        alt="No pending requests"
                    />
                    <p className="font-bold text-slate-800 text-lg">All caught up!</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm leading-relaxed">No pending or matching leave requests need your approval right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {approvalQueue.map((req) => {
                        const cfg = STATUS_CONFIG[req.status];
                        const isActive = selected?.id === req.id && sheetOpen;
                        return (
                            <div
                                key={req.id}
                                onClick={() => openSheet(req)}
                                className={`flex flex-col gap-4 p-5 rounded-2xl border-l-4 cursor-pointer transition-all hover:shadow-md select-none group ${isActive
                                        ? 'border-l-primary border-t-primary-light/40 border-r-primary-light/40 border-b-primary-light/40 bg-[#D9ECF8] shadow-sm'
                                        : 'border-l-primary border-t-[#E2ECF5] border-r-[#E2ECF5] border-b-[#E2ECF5] bg-[#EFF6FC] hover:bg-[#E2EFF8] hover:border-t-primary-light hover:border-r-primary-light hover:border-b-primary-light'
                                    }`}
                            >
                                {/* Top Row: Identity & Status */}
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-lg font-extrabold text-white shadow-sm border border-primary/10 group-hover:scale-105 transition-transform">
                                            {req.employee_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-base">{req.employee_name}</p>
                                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{req.department} <span className="mx-1 text-gray-300">•</span> <span className="text-primary font-bold">{req.leave_type}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                        {req.applied_at && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-primary/70 font-bold">
                                                <Clock size={12} className="text-grey" />
                                                <span>Applied {fmtShort(req.applied_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Middle Row: Reason & Metrics */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {req.reason ? (
                                            <div className="bg-primary/[0.02] rounded-xl px-4 py-3 border border-primary-light/20 group-hover:bg-primary/[0.04] transition-colors">
                                                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Reason for Leave</p>
                                                <p className="text-sm text-gray-700 italic truncate font-semibold">"{req.reason}"</p>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50/40 rounded-xl px-4 py-3 border border-gray-100/50">
                                                <p className="text-sm text-gray-400 italic">No reason provided</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0 bg-primary-light/[0.15] rounded-xl px-5 py-3 border border-primary-light/30">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Duration</span>
                                            <div className="flex items-center gap-2 text-sm font-bold text-primary-dark">
                                                <Calendar size={14} className="text-primary" />
                                                <span>{fmtShort(req.from_date)} <span className="text-primary/30 mx-0.5">–</span> {fmtShort(req.to_date)}</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-primary/10"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">Total Days</span>
                                            <span className="text-sm font-black text-primary-dark">{req.total_days}d</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: Inline Actions for Pending */}
                                {req.status === 'pending' && (
                                    <div className="pt-4 mt-1 border-t border-gray-100 flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-grey hover:bg-primary-light/20 hover:text-primary font-bold rounded-xl px-5 h-9"
                                            onClick={() => openSheet(req)}
                                        >
                                            Review Full Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 font-bold rounded-xl px-6 h-9"
                                            onClick={() => {
                                                openSheet(req);
                                                // Wait for state to set, then show reject input
                                                setTimeout(() => setShowRejectInput(true), 0);
                                            }}
                                        >
                                            Reject...
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-100 font-bold rounded-xl px-6 h-9"
                                            disabled={processingId === req.id}
                                            onClick={() => handleApprove(req.id)}
                                        >
                                            {processingId === req.id ? "Approving..." : "Approve Request"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                    <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft size={15} />
                    </Button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight size={15} />
                    </Button>
                </div>
            )}

            <ApprovalSheetModal
                selected={selected}
                sheetOpen={sheetOpen}
                closeSheet={closeSheet}
                showRejectInput={showRejectInput}
                setShowRejectInput={setShowRejectInput}
                rejectReason={rejectReason}
                setRejectReason={setRejectReason}
                handleReject={handleReject}
                handleApprove={handleApprove}
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default Approvals;
