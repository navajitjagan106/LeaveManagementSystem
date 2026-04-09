import { useState } from "react";
import { ApprovalRequest } from "../../types";
import { Check, X } from 'lucide-react';

type Props = {
    request: ApprovalRequest;
    onApprove: (id: number) => void;
    onReject: (id: number, reason: string) => void;
    ProcessingId: number | null;
};

const ApprovalCard: React.FC<Props> = ({ request, onApprove, onReject, ProcessingId }) => {
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const isProcessing = ProcessingId === request.id;

    const dateFields = [
        { label: "From", value: new Date(request.from_date).toLocaleDateString("en-GB") },
        { label: "To", value: new Date(request.to_date).toLocaleDateString("en-GB") },
        { label: "Days", value: request.total_days },
    ];

    const actions = [
        {
            label: isProcessing ? "Processing..." : "Approve",
            onClick: () => onApprove(request.id),
            className: "bg-green-500 hover:bg-green-600",
            disabled: isProcessing,
        },
        {
            label: "Reject",
            onClick: () => setShowRejectModal(true),
            className: "bg-red-500 hover:bg-red-600",
            disabled: isProcessing,
        },
    ];

    const modalButtons = [
        {
            label: "Cancel",
            onClick: () => { setShowRejectModal(false); setRejectReason(''); },
            className: "border border-gray-200 text-gray-600 hover:bg-gray-50",
            disabled: false,
        },
        {
            label: "Confirm Reject",
            onClick: () => {
                if (!rejectReason.trim()) return;
                onReject(request.id, rejectReason.trim());
                setShowRejectModal(false);
                setRejectReason('');
            },
            className: "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
            disabled: !rejectReason.trim(),
        },
    ];

    return (
        <>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="font-semibold text-gray-900 text-base">{request.employee_name}</p>
                        <p className="text-sm text-gray-500 mt-1">{request.department} • {request.leave_type}</p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${request.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        request.status === "approved" ? "bg-green-100 text-green-700" :
                            "bg-red-100 text-red-700"
                        }`}>
                        {request.status}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    {dateFields.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-500 text-xs">{item.label}</p>
                            <p className="font-medium text-gray-800">{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="mb-5">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{request.reason}</p>
                </div>

                {request.approved_at && request.status !== "pending" && (
                    <p className={`text-xs mb-3 flex items-center gap-1 ${request.status === "approved" ? "text-green-600" : "text-red-500"
                        }`}>
                        {request.status === "approved" ? <Check size={10} /> : <X size={10} />}
                        Processed on {new Date(request.approved_at).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short"
                        })}
                    </p>
                )}

                {request.status === "rejected" && request.rejection_reason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                        <p className="text-xs text-red-500 mb-0.5">Rejection reason</p>
                        <p className="text-sm text-red-700">{request.rejection_reason}</p>
                    </div>
                )}

                {request.status === "pending" && (
                    <div className="flex gap-3">
                        {actions.map((btn, index) => (
                            <button
                                key={index}
                                onClick={btn.onClick}
                                disabled={btn.disabled}
                                className={`flex-1 py-2.5 text-white rounded-xl font-medium transition disabled:opacity-50 ${btn.className}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {showRejectModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold text-gray-900 mb-1">Reject Leave</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Rejecting <span className="font-medium text-gray-700">{request.employee_name}</span>'s request. Please provide a reason.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Insufficient leave balance, team availability..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                        <div className="flex gap-3 mt-4">
                            {modalButtons.map((btn, index) => (
                                <button
                                    key={index}
                                    onClick={btn.onClick}
                                    disabled={btn.disabled}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium ${btn.className}`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ApprovalCard;