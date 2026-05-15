import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getPending, approveLeave } from "../../api/leaveApi";
import { ApprovalRequest } from "../../types";
import PageHeader from "../common/PageHeader";
import { getAvatarGradient } from "../../utils/avatar";
import Loader from "../common/Loader";
import { useToast } from "../common/ToastContext";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import ApprovalSheetModal from "../modals/ApprovalSheetModal";
import {
    CalendarDays, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
    Search, Filter, Check, X, Eye, FileText
} from "lucide-react";

const STATUS_CONFIG = {
    pending: { label: "Pending", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    approved: { label: "Approved", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected: { label: "Rejected", badge: "bg-rose-50 text-rose-700 border-rose-200" },
    cancelled: { label: "Cancelled", badge: "bg-gray-50 text-gray-700 border-gray-200" },
};



const fmtShortDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
};

const fmtAppliedAt = (d: string) => {
    return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short"
    });
};

const Approvals: React.FC = () => {
    const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [filters, setFilters] = useState({ status: "", search: "", date: "" });
    const [page, setPage] = useState(1);
    const [pageInputVal, setPageInputVal] = useState("1");
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [selected, setSelected] = useState<ApprovalRequest | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const toast = useToast();

    // Keep page input in sync
    useEffect(() => {
        setPageInputVal(page.toString());
    }, [page]);

    useEffect(() => {
        const t = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput }));
            setPage(1);
        }, 400);
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

    useEffect(() => { 
        fetchApprovals(); 
    }, [fetchApprovals]);

    const openSheet = (req: ApprovalRequest) => {
        setSelected(req);
        setSheetOpen(true);
        setShowRejectInput(false);
        setRejectReason("");
    };

    const closeSheet = () => {
        setSheetOpen(false);
        setShowRejectInput(false);
        setRejectReason("");
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            const res = await approveLeave(id, "approved");
            if (res.data.success) {
                toast.success("Leave request approved successfully!");
                closeSheet();
                fetchApprovals();
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to approve request");
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
                toast.success("Leave request rejected successfully");
                closeSheet();
                fetchApprovals();
            }
        } catch (err) {
            toast.error("Failed to reject request");
        } finally {
            setProcessingId(null);
        }
    };

    // Calculate metadata statistics for the current page queue representation
    const stats = useMemo(() => {
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let cancelled = 0;
        approvalQueue.forEach((r) => {
            if (r.status === "pending") pending++;
            else if (r.status === "approved") approved++;
            else if (r.status === "rejected") rejected++;
            else if (r.status === "cancelled") cancelled++;
        });
        return {
            total: approvalQueue.length,
            pending,
            approved,
            rejected,
            cancelled
        };
    }, [approvalQueue]);

    const isProcessing = processingId === selected?.id;

    if (loading && approvalQueue.length === 0) {
        return (
            <div className="flex justify-center items-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Loader />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 relative w-full max-w-full flex flex-col mb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <PageHeader
                        title="Approvals Hub"
                        subtitle="Review, approve, or reject pending leave requests from your team"
                    />
                    <img 
                        src="/Forms-cuate.svg" 
                        className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                        alt="Approvals Illustration" 
                    />
                </div>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                    {approvalQueue.length} Active Request{approvalQueue.length !== 1 ? "s" : ""}
                </span>
            </div>

            <hr className="border-gray-100" />

            {/* Metrics ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-gray-100 bg-gray-50/40 p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                        <FileText size={18} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Handled</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
                    </div>
                </Card>
                <Card className="border-gray-100 bg-gray-50/40 p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Awaiting Review</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.pending}</p>
                    </div>
                </Card>
                <Card className="border-gray-100 bg-gray-50/40 p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Approved</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.approved}</p>
                    </div>
                </Card>
                <Card className="border-gray-100 bg-gray-50/40 p-4 flex items-center gap-3.5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                        <XCircle size={18} className="text-rose-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rejected</p>
                        <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.rejected}</p>
                    </div>
                </Card>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col md:flex-row items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="relative w-full md:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <Input
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by employee name or category..."
                        className="pl-9 h-10 bg-white border border-gray-200 outline-none focus:border-primary rounded-xl w-full text-xs font-semibold text-gray-700 transition-colors shadow-inner"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                    <Filter size={14} className="text-gray-400 hidden lg:block" />

                    <Select
                        value={filters.status || "all"}
                        onValueChange={(v) => {
                            setPage(1);
                            setFilters(prev => ({ ...prev, status: v === "all" ? "" : v }));
                        }}
                    >
                        <SelectTrigger className="w-full md:w-36 h-10 text-xs font-bold bg-white border border-gray-200 rounded-xl focus:ring-0">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="text-xs font-semibold">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        value={filters.date}
                        onChange={(e) => {
                            setPage(1);
                            setFilters(prev => ({ ...prev, date: e.target.value }));
                        }}
                        className="w-full md:w-40 h-10 text-xs font-bold bg-white border border-gray-200 rounded-xl text-gray-700"
                        title="Filter by date of leave"
                    />

                    {(filters.status || filters.search || filters.date) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 px-4 rounded-xl font-bold text-xs"
                            onClick={() => {
                                setPage(1);
                                setFilters({ status: "", search: "", date: "" });
                                setSearchInput("");
                            }}
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>

            {/* List Table */}
            {approvalQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border rounded-2xl border-dashed border-gray-200 bg-white">
                    <CalendarDays size={42} className="text-gray-300 mb-3 animate-pulse" />
                    <p className="font-semibold text-gray-700 text-sm">All caught up!</p>
                    <p className="text-xs text-gray-400 mt-1">No pending or matching leave approvals require your attention.</p>
                </div>
            ) : (
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white w-full max-w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-4">Employee</th>
                                    <th className="px-5 py-4">Category</th>
                                    <th className="px-5 py-4">Date Range</th>
                                    <th className="px-5 py-4 text-center">Duration</th>
                                    <th className="px-5 py-4">Reason</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {approvalQueue.map((req) => {
                                    const cfg = STATUS_CONFIG[req.status];
                                    const initials = req.employee_name
                                        ?.split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase();

                                    return (
                                        <tr 
                                            key={req.id} 
                                            className="hover:bg-gray-50/50 transition-colors text-xs text-gray-700 cursor-pointer"
                                            onClick={() => openSheet(req)}
                                        >
                                            {/* Employee */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shadow-sm bg-gradient-to-tr ${getAvatarGradient(req.employee_name)}`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{req.employee_name}</p>
                                                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{req.department}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-5 py-4 font-bold text-primary">
                                                {req.leave_type}
                                            </td>

                                            {/* Date Range */}
                                            <td className="px-5 py-4 font-semibold text-gray-600">
                                                <div className="flex flex-col">
                                                    <span>{fmtShortDate(req.from_date)} - {fmtShortDate(req.to_date)}</span>
                                                    {req.applied_at && (
                                                        <span className="text-[9px] text-gray-400 mt-0.5">Applied on {fmtAppliedAt(req.applied_at)}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Duration */}
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-extrabold bg-[#EFF6FC] text-primary rounded-lg border border-primary-light/20">
                                                    {req.total_days}d
                                                </span>
                                            </td>

                                            {/* Reason */}
                                            <td className="px-5 py-4">
                                                {req.reason ? (
                                                    <div className="max-w-[150px] truncate text-gray-500 italic font-semibold" title={req.reason}>
                                                        "{req.reason}"
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 italic">No reason</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${cfg.badge}`}>
                                                    {cfg.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                                                        onClick={() => openSheet(req)}
                                                        title="Review Details"
                                                    >
                                                        <Eye size={14} />
                                                    </Button>

                                                    {req.status === "pending" && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-lg"
                                                                onClick={() => {
                                                                    openSheet(req);
                                                                    setTimeout(() => setShowRejectInput(true), 0);
                                                                }}
                                                                title="Reject Request"
                                                            >
                                                                <X size={14} />
                                                            </Button>

                                                            <Button
                                                                size="sm"
                                                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm"
                                                                disabled={processingId === req.id}
                                                                onClick={() => handleApprove(req.id)}
                                                                title="Approve Request"
                                                            >
                                                                {processingId === req.id ? (
                                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Check size={14} />
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {approvalQueue.length > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex-wrap gap-4 select-none">
                            <span className="text-[11px] font-medium text-gray-400">
                                Showing <span className="font-bold text-gray-700">{approvalQueue.length}</span> records
                            </span>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 bg-white"
                                >
                                    <ChevronLeft size={14} />
                                    Prev
                                </Button>

                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500 font-medium">Page</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInputVal}
                                        onChange={(e) => setPageInputVal(e.target.value)}
                                        onBlur={() => {
                                            let num = parseInt(pageInputVal);
                                            if (isNaN(num) || num < 1) num = 1;
                                            if (num > totalPages) num = totalPages;
                                            setPageInputVal(num.toString());
                                            setPage(num);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                let num = parseInt(pageInputVal);
                                                if (isNaN(num) || num < 1) num = 1;
                                                if (num > totalPages) num = totalPages;
                                                setPageInputVal(num.toString());
                                                setPage(num);
                                            }
                                        }}
                                        disabled={totalPages <= 1}
                                        className="w-12 h-8 text-center border border-gray-200 rounded-lg text-xs font-bold focus:border-primary outline-none focus:ring-1 focus:ring-primary shadow-inner bg-white text-gray-800 disabled:opacity-50 disabled:bg-gray-50"
                                    />
                                    <span className="text-xs text-gray-400 font-medium">of {totalPages}</span>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 bg-white"
                                >
                                    Next
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
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
