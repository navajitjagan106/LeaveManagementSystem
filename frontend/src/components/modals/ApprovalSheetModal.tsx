import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "../ui/sheet";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { X } from "lucide-react";
import { ApprovalRequest } from "../../types";

const STATUS_CONFIG = {
    pending: { label: "Pending", row: "bg-amber-50/40 text-amber-600 border-amber-100/50", badge: "bg-amber-50 text-amber-600 border-amber-100/80" },
    approved: { label: "Approved", row: "bg-emerald-50/40 text-emerald-600 border-emerald-100/50", badge: "bg-emerald-50 text-emerald-600 border-emerald-100/80" },
    rejected: { label: "Rejected", row: "bg-rose-50/40 text-rose-600 border-rose-100/50", badge: "bg-rose-50 text-rose-600 border-rose-100/80" },
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
    new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

interface ApprovalSheetModalProps {
    selected: ApprovalRequest | null;
    sheetOpen: boolean;
    closeSheet: () => void;
    showRejectInput: boolean;
    setShowRejectInput: (show: boolean) => void;
    rejectReason: string;
    setRejectReason: (reason: string) => void;
    handleReject: (id: number) => void;
    handleApprove: (id: number) => void;
    isProcessing: boolean;
}

const ApprovalSheetModal: React.FC<ApprovalSheetModalProps> = ({
    selected,
    sheetOpen,
    closeSheet,
    showRejectInput,
    setShowRejectInput,
    rejectReason,
    setRejectReason,
    handleReject,
    handleApprove,
    isProcessing
}) => {
    return (
        <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o) closeSheet(); }}>
            <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                {selected && (
                    <>
                        <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <SheetHeader className="text-left">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-primary-light/40 shrink-0">
                                            {selected.employee_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <SheetTitle className="text-xl font-bold text-gray-900 truncate">{selected.employee_name}</SheetTitle>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${STATUS_CONFIG[selected.status].badge}`}>
                                                    {STATUS_CONFIG[selected.status].label}
                                                </span>
                                            </div>
                                            <SheetDescription className="text-sm font-medium text-gray-500 mt-0.5 truncate">
                                                {selected.department} · {selected.leave_type}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeSheet}
                                        className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={16} />
                                    </button>
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
                                        {selected.duration_type === "half" ? "Half Day" : "Full Day"} • {selected.total_days} day{selected.total_days !== 1 ? 's' : ''} requested
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
                                    <p className="text-sm font-semibold text-gray-800">
                                        Processed on {fmtDateTime(selected.approved_at)}
                                        {selected.approved_by_name && ` by ${selected.approved_by_name}`}
                                    </p>
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
    );
};

export default ApprovalSheetModal;
