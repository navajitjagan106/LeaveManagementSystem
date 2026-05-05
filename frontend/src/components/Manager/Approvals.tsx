import React, { useCallback, useEffect, useState } from 'react';
import { getPending, approveLeave } from '../../api/leaveApi';
import { ApprovalRequest } from "../../types";
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { useToast } from '../common/ToastContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '../ui/sheet';
import {
    Calendar, Clock,  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
    pending:  { label: "Pending",  row: "bg-yellow-50 text-yellow-700 border-yellow-200",  badge: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    approved: { label: "Approved", row: "bg-green-50 text-green-700 border-green-200",   badge: "bg-green-100 text-green-700 border-green-200" },
    rejected: { label: "Rejected", row: "bg-red-50 text-red-700 border-red-200",     badge: "bg-red-100 text-red-700 border-red-200" },
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

const fmtShort = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

const Approvals: React.FC = () => {
    const [approvalQueue, setApprovalQueue]     = useState<ApprovalRequest[]>([]);
    const [loading, setLoading]                 = useState(true);
    const [processingId, setProcessingId]       = useState<number | null>(null);
    const [filters, setFilters]                 = useState({ status: '', search: '' });
    const [page, setPage]                       = useState(1);
    const [totalPages, setTotalPages]           = useState(1);
    const [searchInput, setSearchInput]         = useState('');
    const [selected, setSelected]               = useState<ApprovalRequest | null>(null);
    const [sheetOpen, setSheetOpen]             = useState(false);
    const [rejectReason, setRejectReason]       = useState('');
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

                {(filters.status || filters.search) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9"
                        onClick={() => { setPage(1); setFilters({ status: '', search: '' }); setSearchInput(''); }}
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
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <AlertCircle size={36} className="opacity-30" />
                    <p className="text-sm">No leave requests found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {approvalQueue.map((req) => {
                        const cfg = STATUS_CONFIG[req.status];
                        const isActive = selected?.id === req.id && sheetOpen;
                        return (
                            <div
                                key={req.id}
                                onClick={() => openSheet(req)}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm select-none ${
                                    isActive
                                        ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/60'
                                }`}
                            >
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-sm font-semibold text-indigo-600 shrink-0">
                                    {req.employee_name.charAt(0).toUpperCase()}
                                </div>

                                {/* Name + dept */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">{req.employee_name}</p>
                                    <p className="text-xs text-gray-400 truncate">{req.department} · {req.leave_type}</p>
                                </div>

                                {/* Date range */}
                                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 shrink-0">
                                    <Calendar size={12} />
                                    <span>{fmtShort(req.from_date)} – {fmtShort(req.to_date)}</span>
                                </div>

                                {/* Days */}
                                <div className="hidden md:block text-xs text-gray-500 w-10 text-center shrink-0">
                                    {req.total_days}d
                                </div>

                                {/* Applied at */}
                                {req.applied_at && (
                                    <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400 w-24 shrink-0">
                                        <Clock size={11} />
                                        <span>{fmtShort(req.applied_at)}</span>
                                    </div>
                                )}

                                {/* Status badge */}
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>
                                    {cfg.label}
                                </span>
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

            <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o) closeSheet(); }}>
                <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                    {selected && (
                        <>
                            <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <SheetHeader className="text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-100 shrink-0">
                                            {selected.employee_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <SheetTitle className="text-xl font-bold text-gray-900">{selected.employee_name}</SheetTitle>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_CONFIG[selected.status].badge}`}>
                                                    {STATUS_CONFIG[selected.status].label}
                                                </span>
                                            </div>
                                            <SheetDescription className="text-sm font-medium text-gray-500 mt-0.5">
                                                {selected.department} · {selected.leave_type}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="flex-1 px-8 py-8 space-y-6 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-1 border border-gray-100/50">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Duration</span>
                                        <span className="text-sm font-semibold text-gray-800">
                                            {fmtDate(selected.from_date)} – {fmtDate(selected.to_date)}
                                        </span>
                                        <span className="text-xs text-gray-400 mt-0.5">
                                            {selected.total_days} day{selected.total_days !== 1 ? 's' : ''} requested
                                        </span>
                                    </div>

                                    {selected.applied_at && (
                                        <div className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-1 border border-gray-100/50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Applied on</span>
                                            <span className="text-sm font-semibold text-gray-800">{fmtDateTime(selected.applied_at)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100/50">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Reason for Leave</p>
                                    <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{selected.reason}"</p>
                                </div>

                                {selected.approved_at && selected.status !== "pending" && (
                                    <div className={`p-6 rounded-2xl border ${selected.status === "approved" ? "bg-green-50 border-green-100/50" : "bg-red-50 border-red-100/50"}`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${selected.status === "approved" ? "text-green-500" : "text-red-500"}`}>
                                            {selected.status === "approved" ? "Approval Details" : "Rejection Details"}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-800">Processed on {fmtDateTime(selected.approved_at)}</p>
                                        {selected.status === "rejected" && selected.rejection_reason && (
                                            <p className="text-sm text-red-700 mt-2 italic font-medium">"{selected.rejection_reason}"</p>
                                        )}
                                    </div>
                                )}

                                {showRejectInput && selected.status === "pending" && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Rejection Reason <span className="text-red-400">*</span></label>
                                        <Textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Please provide a reason for rejection..."
                                            rows={3}
                                            className="text-sm resize-none rounded-2xl border-gray-200 focus:ring-red-400 focus:border-red-400"
                                        />
                                    </div>
                                )}
                            </div>

                            {selected.status === "pending" && (
                                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                                    <SheetFooter className="flex-row sm:justify-end gap-3">
                                        {showRejectInput ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="lg"
                                                    className="flex-1 rounded-xl text-gray-500"
                                                    onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    disabled={!rejectReason.trim() || isProcessing}
                                                    onClick={() => handleReject(selected.id)}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-100"
                                                >
                                                    {isProcessing ? "Rejecting..." : "Confirm Reject"}
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    disabled={isProcessing}
                                                    onClick={() => setShowRejectInput(true)}
                                                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
                                                >
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="lg"
                                                    disabled={isProcessing}
                                                    onClick={() => handleApprove(selected.id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-100"
                                                >
                                                    {isProcessing ? "Approving..." : "Approve"}
                                                </Button>
                                            </>
                                        )}
                                    </SheetFooter>
                                </div>
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default Approvals;
