type Approval = {
    id: number;
    employeeName: string;
    role: string;
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
};

type Props = {
    request: Approval;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
};

const fieldConfig = [
    { label: "From Date", key: "fromDate" },
    { label: "To Date", key: "toDate" },
    { label: "Reason", key: "reason" },
];

const ApprovalCard: React.FC<Props> = ({ request, onApprove, onReject }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">

            {/* Header */}
            <div className="mb-4">
                <p className="font-semibold text-gray-800">
                    {request.employeeName}
                </p>
                <p className="text-sm text-gray-600">
                    {request.role} • {request.leaveType}
                </p>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                {fieldConfig.map((field, i) => (
                    <div key={i}>
                        <label className="text-sm text-gray-600">
                            {field.label}
                        </label>
                        <input
                            type="text"
                            value={request[field.key as keyof Approval]}
                            disabled
                            className="w-full border border-gray-300 rounded px-2 py-1 mt-1 bg-gray-50"
                        />
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={() => onApprove(request.id)}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                    Approve
                </button>
                <button
                    onClick={() => onReject(request.id)}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Reject
                </button>
            </div>

        </div>
    );
};

export default ApprovalCard;