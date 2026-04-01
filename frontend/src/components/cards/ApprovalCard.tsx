
import { ApprovalRequest } from "../../types";

type Props = {
    request: ApprovalRequest;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    ProcessingId: number | null
};

const ApprovalCard: React.FC<Props> = ({ request, onApprove, onReject, ProcessingId }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">

            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-semibold text-gray-800 text-base">
                        {request.employee_name}
                    </p>
                    <p className="text-sm text-gray-500">
                        {request.role} • {request.leave_type}
                    </p>
                </div>

                {/* Status badge */}
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Pending
                </span>
            </div>

            {/* Dates */}
            <div className="flex gap-6 text-sm text-gray-700 mb-3">
                <div>
                    <p className="text-gray-500">From</p>
                    <p>{new Date(request.from_date).toLocaleDateString("en-GB")}</p>
                </div>
                <div>
                    <p className="text-gray-500">To</p>
                    <p> {new Date(request.to_date).toLocaleDateString("en-GB")}</p>
                </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
                <p className="text-sm text-gray-500">Reason</p>
                <p className="text-sm text-gray-800">{request.reason}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => onApprove(request.id)}
                    disabled={ProcessingId === request.id}
                    className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                    {ProcessingId === request.id ? "Processing..." : "Approve"}
                </button>

                <button
                    onClick={() => onReject(request.id)}
                    className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

export default ApprovalCard;