import React, { useEffect, useState } from 'react';
import ApprovalCard from '../cards/ApprovalCard';
import { getPending, approveLeave } from '../../api/leaveApi';
import { ApprovalRequest } from "../../types";
import PageHeader from '../common/PageHeader';
const Approvals: React.FC = () => {

    const filtersConfig = [
        { type: "select", options: ["All Status", "Pending"] },
        { type: "input", placeholder: "Employee Name" },
        { type: "input", placeholder: "Search" },
        { type: "input", placeholder: "Date Range" },
    ];
    const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([])
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);


    useEffect(() => {
        fetchApprovals();
    }, []);
    const fetchApprovals = async () => {
        try {
            setLoading(true)
            const res = await (getPending())
            setApprovalQueue(res.data.data);
        }
        catch (err) {
            console.error("Failed to get leave requests", err)

        } finally {
            setLoading(false)
        }

    }
    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            const res = await approveLeave(id, "approved");

            if (res.data.success) {
                setApprovalQueue(prev =>
                    prev.filter(item => item.id !== id)
                );
                alert("Approved")
            } else {
                throw new Error("Not successful");
            }

        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data?.error || "Failed to approve");
        }
        finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        try {
            await approveLeave(id, "rejected");
            alert("Rejected!");
            fetchApprovals();
        } catch (err) {
            console.error(err);
            alert("Failed to reject");
        }
        finally {
            setProcessingId(null);
        }
    };
    if (loading) {
        return <p className="text-center py-6">Loading approvals...</p>;
    }

    return (
        <div>
            <PageHeader
                title="Approvals"
                subtitle="Manage pending leave requests"
                action={
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg">
                        Refresh
                    </button>
                }
            />
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
                        ProcessingId={processingId}
                    />
                ))}
            </div>
        </div>
    );
};

export default Approvals;