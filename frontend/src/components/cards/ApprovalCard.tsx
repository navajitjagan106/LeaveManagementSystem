import { ApprovalRequest } from "../../types";

type Props = {
    request: ApprovalRequest;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    ProcessingId: number | null;
};

const ApprovalCard: React.FC<Props> = ({
    request,
    onApprove,
    onReject,
    ProcessingId,
}) => {

    const dateFields = [
        {
            label: "From",
            value: new Date(request.from_date).toLocaleDateString("en-GB"),
        },
        {
            label: "To",
            value: new Date(request.to_date).toLocaleDateString("en-GB"),
        },
        {
            label: "Days",
            value: request.total_days,
        },
    ];

    const actions = [
        {
            label: ProcessingId === request.id ? "Processing..." : "Approve",
            onClick: () => onApprove(request.id),
            className: "bg-green-500 hover:bg-green-600 disabled:opacity-50",
            disabled: ProcessingId === request.id,
        },
        {
            label: "Reject",
            onClick: () => onReject(request.id),
            className: "bg-red-500 hover:bg-red-600",
            disabled: false,
        },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">

            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="font-semibold text-gray-900 text-base">
                        {request.employee_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {request.department} • {request.leave_type}
                    </p>
                </div>

                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    request.status === "pending" ? "bg-yellow-100 text-yellow-700" :
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
                <p className="text-sm text-gray-700 leading-relaxed">
                    {request.reason}
                </p>
            </div>

            {request.status === "pending" && (
                <div className="flex gap-3">
                    {actions.map((btn, index) => (
                        <button
                            key={index}
                            onClick={btn.onClick}
                            disabled={btn.disabled}
                            className={`flex-1 py-2.5 text-white rounded-xl font-medium transition ${btn.className}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApprovalCard;