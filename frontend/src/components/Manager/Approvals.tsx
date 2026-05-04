import React, { useCallback, useEffect, useState } from 'react';
import { getPending, approveLeave } from '../../api/leaveApi';
import { ApprovalRequest } from "../../types";
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { useToast } from '../common/ToastContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '../ui/sheet';
import {
    Calendar, Clock, FileText, CheckCircle2, XCircle, ChevronLeft, ChevronRight, AlertCircle,
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

            {/* Detail Sheet */}
            <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o) closeSheet(); }}>
                <SheetContent className="overflow-y-auto">
                    {selected && (
                        <>
                            <SheetHeader>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-xl font-bold text-indigo-600 shrink-0">
                                        {selected.employee_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <SheetTitle>{selected.employee_name}</SheetTitle>
                                        <SheetDescription>{selected.department}</SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="flex-1 px-6 py-5 space-y-5">
                                {/* Status */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Status</span>
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_CONFIG[selected.status].badge}`}>
                                        {STATUS_CONFIG[selected.status].label}
                                    </span>
                                </div>

                                <Separator />

                                {/* Leave type */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        <FileText size={16} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Leave Type</p>
                                        <p className="text-sm font-medium text-gray-800">{selected.leave_type}</p>
                                    </div>
                                </div>

                                {/* Duration */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                        <Calendar size={16} className="text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Duration</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {fmtDate(selected.from_date)} – {fmtDate(selected.to_date)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {selected.total_days} day{selected.total_days !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Applied on */}
                                {selected.applied_at && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                            <Clock size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Applied on</p>
                                            <p className="text-sm font-medium text-gray-800">{fmtDateTime(selected.applied_at)}</p>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Reason */}
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Reason</p>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5">
                                        {selected.reason}
                                    </p>
                                </div>

                                {/* Processed info for non-pending */}
                                {selected.approved_at && selected.status !== "pending" && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected.status === "approved" ? "bg-green-50" : "bg-red-50"}`}>
                                                {selected.status === "approved"
                                                    ? <CheckCircle2 size={16} className="text-green-500" />
                                                    : <XCircle size={16} className="text-red-500" />
                                                }
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400">
                                                    {selected.status === "approved" ? "Approved on" : "Rejected on"}
                                                </p>
                                                <p className="text-sm font-medium text-gray-800">{fmtDateTime(selected.approved_at)}</p>
                                            </div>
                                        </div>

                                        {selected.status === "rejected" && selected.rejection_reason && (
                                            <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                                                <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
                                                <p className="text-sm text-red-700 leading-relaxed">{selected.rejection_reason}</p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Reject textarea */}
                                {showRejectInput && selected.status === "pending" && (
                                    <>
                                        <Separator />
                                        <div>
                                            <p className="text-xs text-gray-500 mb-2">Rejection reason <span className="text-red-400">*</span></p>
                                            <Textarea
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="e.g. Insufficient leave balance, team availability..."
                                                rows={3}
                                                className="text-sm resize-none"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer actions — only for pending */}
                            {selected.status === "pending" && (
                                <SheetFooter>
                                    {showRejectInput ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={!rejectReason.trim() || isProcessing}
                                                onClick={() => handleReject(selected.id)}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                            >
                                                {isProcessing ? "Rejecting..." : "Confirm Reject"}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={isProcessing}
                                                onClick={() => setShowRejectInput(true)}
                                                className="flex-1 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={isProcessing}
                                                onClick={() => handleApprove(selected.id)}
                                                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                            >
                                                {isProcessing ? "Approving..." : "Approve"}
                                            </Button>
                                        </>
                                    )}
                                </SheetFooter>
                            )}
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default Approvals;
