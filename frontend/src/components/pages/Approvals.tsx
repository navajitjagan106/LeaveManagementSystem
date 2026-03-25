import React, { useState } from 'react';
import ApprovalCard from '../cards/ApprovalCard';

const Approvals: React.FC = () => {

    const filtersConfig = [
        { type: "select", options: ["All Status", "Pending"] },
        { type: "input", placeholder: "Employee Name" },
        { type: "input", placeholder: "Search" },
        { type: "input", placeholder: "Date Range" },
    ];
    const [approvalQueue] = useState([
        {
            id: 1,
            employeeName: 'Sundar',
            role: 'Backend',
            leaveType: 'Casual Leave',
            fromDate: '2026-03-25',
            toDate: '2026-03-27',
            reason: 'Personal work',
        },
        {
            id: 2,
            employeeName: 'Priya',
            role: 'Frontend',
            leaveType: 'Sick Leave',
            fromDate: '2026-03-24',
            toDate: '2026-03-24',
            reason: 'Doctor appointment',
        },
    ]);

    const handleApprove = (id: number) => {
        console.log('Approved:', id);
        alert('Leave approved!');
    };

    const handleReject = (id: number) => {
        console.log('Rejected:', id);
        alert('Leave rejected!');
    };

    return (
        <div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex gap-4">
                {filtersConfig.map((f, i) =>
                    f.type === "select" ? (
                        <select key={i} className="border border-gray-300 rounded-lg px-4 py-2">
                            {f.options?.map((opt, idx) => (
                                <option key={idx}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            key={i}
                            placeholder={f.placeholder}
                            className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
                        />
                    )
                )}
            </div>

            {/* Approval Cards */}
            <div className="space-y-4">
                {approvalQueue.map((req) => (
                    <ApprovalCard
                        key={req.id}
                        request={req}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ))}
            </div>
        </div>
    );
};

export default Approvals;