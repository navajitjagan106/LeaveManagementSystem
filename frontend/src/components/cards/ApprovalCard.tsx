import { ApprovalRequest } from "../../types";

type Props = {
    request: ApprovalRequest;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    ProcessingId: number | null
};

const ApprovalCard: React.FC<Props> = ({ request, onApprove, onReject, ProcessingId }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">

            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="font-semibold text-gray-900 text-base">
                        {request.employee_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {request.role} • {request.leave_type}
                    </p>
                </div>

                <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                    Pending
                </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">From</p>
                    <p className="font-medium text-gray-800">
                        {new Date(request.from_date).toLocaleDateString("en-GB")}
                    </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">To</p>
                    <p className="font-medium text-gray-800">
                        {new Date(request.to_date).toLocaleDateString("en-GB")}
                    </p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs">Days</p>
                    <p className="font-medium text-gray-800">
                        {request.total_days}
                    </p>
                </div>
            </div>

            <div className="mb-5">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {request.reason}
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => onApprove(request.id)}
                    disabled={ProcessingId === request.id}
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 transition"
                >
                    {ProcessingId === request.id ? "Processing..." : "Approve"}
                </button>

                <button
                    onClick={() => onReject(request.id)}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

export default ApprovalCard;