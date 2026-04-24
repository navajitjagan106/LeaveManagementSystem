import React, { useCallback, useEffect, useState } from 'react';
import ApprovalCard from '../common/cards/ApprovalCard';
import { getPending, approveLeave } from '../../api/leaveApi';
import { ApprovalRequest } from "../../types";
import PageHeader from '../common/PageHeader';
import Loader from '../common/Loader';
import { useToast } from '../common/ToastContext';

const Approvals: React.FC = () => {
    const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
const toast = useToast();

    const statusOptions = [
        { label: "All Status", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
    ];


    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchInput }));
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchApprovals = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const res = await getPending({ ...params, page, limit: 10 });
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

    const handleFilterChange = (key: string, value: string) => {
        setPage(1);
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApprove = async (id: number) => {
        try {
            setProcessingId(id);
            const res = await approveLeave(id, "approved");
            if (res.data.success) {
                setApprovalQueue(prev => prev.filter(item => item.id !== id));
                toast.success("Approved");
            } else {
                throw new Error("Not successful");
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to approve");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number, reason: string) => {
        try {
            setProcessingId(id);
            const res = await approveLeave(id, "rejected", reason);
            if (res.data.success) {
                fetchApprovals();
                toast.success("Rejected!");
            }
        } catch (err) {
            toast.error("Failed to reject");
        } finally {
            setProcessingId(null);
        }
    };

    const paginationButtons = [
        { label: "Prev", disabled: page === 1, onClick: () => setPage(prev => prev - 1) },
        { label: "Next", disabled: page === totalPages, onClick: () => setPage(prev => prev + 1) },
    ];

    if (loading) return <div className="text-center py-8"><Loader /></div>;

    return (
        <div>
            <PageHeader
                title="Approvals"
                subtitle="Manage pending leave requests"
            />

            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2"
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>

                <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by employee name"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                />

                {(filters.status || filters.search) && (
                    <button
                        onClick={() => {
                            setPage(1);
                            setFilters({ status: '', search: '' });
                            setSearchInput('')
                        }}
                        className="text-sm text-red-500 hover:underline whitespace-nowrap"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {approvalQueue.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-lg">
                        No leave requests found
                    </div>
                ) : (
                    approvalQueue.map((req) => (
                        <ApprovalCard
                            key={req.id}
                            request={req}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            ProcessingId={processingId}
                        />
                    ))
                )}
            </div>

            <div className="flex justify-center items-center gap-4 mt-4">
                {paginationButtons.map((btn) => (
                    <button
                        key={btn.label}
                        disabled={btn.disabled}
                        onClick={btn.onClick}
                        className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                        {btn.label}
                    </button>
                )).reduce((acc: any[], btn, i) => [
                    ...acc,
                    btn,
                    i === 0 && (
                        <span key="page" className="px-4 py-2 text-sm">
                            Page {page} of {totalPages}
                        </span>
                    )
                ], [])}
            </div>
        </div>
    );
};

export default Approvals;