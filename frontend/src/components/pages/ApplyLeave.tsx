import React, { useState, useEffect } from 'react';
import FormField from '../forms/FormField';
import RadioGroup from '../forms/RadioGroup';
import {
    applyLeave,
    calculateDays,
    getLeaveInitData,
} from "../../api/leaveApi";
import { LeaveBalance, LeaveType } from "../../types";
import PageHeader from '../common/PageHeader';


const ApplyLeave: React.FC = () => {
    const [formData, setFormData] = useState({
        leaveType: '1',
        durationType: 'full',
        fromDate: '',
        toDate: '',
        reason: '',
    });

    const [manager, setManager] = useState<({ id: '', name: '' }) | null>(null);
    const [totalDays, setTotalDays] = useState(0);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const res = await getLeaveInitData();

            setManager(res.data.data.manager);
            setLeaveTypes(res.data.data.leaveTypes);
            setBalances(res.data.data.balances);

        } catch (error) {
            console.error("Failed to fetch initial data", error);
        }
    };

    useEffect(() => {
        const fetchTotalDays = async () => {
            if (!formData.fromDate || !formData.toDate) {
                setTotalDays(0);
                return;
            }

            try {
                const res = await calculateDays({
                    from_date: formData.fromDate,
                    to_date: formData.toDate,
                    duration_type: formData.durationType
                });
                setTotalDays(res.data.days);
            } catch (err) {
                console.error("Failed to calculate days");
                setTotalDays(0);
            }
        };

        fetchTotalDays();
    }, [formData.fromDate, formData.toDate, formData.durationType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fromDate || !formData.toDate || !formData.reason) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const payload = {
                leave_type_id: parseInt(formData.leaveType),
                from_date: formData.fromDate,
                to_date: formData.toDate,
                reason: formData.reason,
                duration_type: formData.durationType,
            };

            await applyLeave(payload);

            alert('Leave applied successfully!');

            setFormData({
                leaveType: '1',
                durationType: 'full',
                fromDate: '',
                toDate: '',
                reason: '',
            });

            setTotalDays(0);

        } catch (err: any) {
            console.error(err);

            alert(err.response?.data?.error || 'Failed to apply leave');
        }
    };

    const selectedBalance = balances.find(
        (b: any) => b.leave_type_id === parseInt(formData.leaveType)
    );

    const remaining = selectedBalance?.remaining || 0;

    return (
        <>
            <PageHeader
                title="Apply Leave"
                subtitle="Submit a new leave request"
            />
            <div className='flex justify-center'>

                <div className="bg-white p-8 rounded-lg shadow-sm w-full">
                    <form onSubmit={handleSubmit}>

                        {/* leave type */}
                        <FormField label="Leave Type">
                            <RadioGroup
                                name="leaveType"
                                value={formData.leaveType}
                                options={leaveTypes.map((type: any) => ({
                                    label: type.name,
                                    value: type.id.toString(),
                                }))}
                                onChange={(val) =>
                                    setFormData({ ...formData, leaveType: val })
                                }
                            />

                            {selectedBalance && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-700">
                                        Remaining Leave:{" "}
                                        <span className="font-semibold">{remaining}</span>
                                    </p>
                                </div>
                            )}
                        </FormField>

                        {/* duration */}
                        <FormField label="Duration Type">
                            <RadioGroup
                                name="durationType"
                                value={formData.durationType}
                                options={[
                                    { label: "Full Day", value: "full" },
                                    { label: "Half Day", value: "half" },
                                ]}
                                onChange={(val) =>
                                    setFormData({ ...formData, durationType: val })
                                }
                            />
                        </FormField>

                        {/* dates */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <FormField label="From Date">
                                <input
                                    type="date"
                                    value={formData.fromDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, fromDate: e.target.value })
                                    }
                                    className="w-full border px-4 py-2 rounded-lg"
                                    required
                                />
                            </FormField>

                            <FormField label="To Date">
                                <input
                                    type="date"
                                    value={formData.toDate}
                                    min={formData.fromDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, toDate: e.target.value })
                                    }
                                    className="w-full border px-4 py-2 rounded-lg"
                                    required
                                />
                            </FormField>
                            {totalDays > 0 && (
                                <div className="mb-1 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-700">
                                        Total Days: <span className="font-semibold">{totalDays}</span>
                                    </p>
                                </div>
                            )}
                        </div>


                        {/* reason */}
                        <FormField label="Reason">
                            <textarea
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData({ ...formData, reason: e.target.value })
                                }
                                className="w-full border px-4 py-2 rounded-lg h-24"
                                required
                            />
                        </FormField>

                        {/* manager */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">
                                Apply to (Manager)
                            </label>
                            <div className="border px-4 py-2 rounded-lg bg-gray-50">
                                {manager ? manager.name : "Loading..."}
                            </div>
                        </div>

                        {/* submit */}
                        <button
                            type="submit"
                            className="w-full bg-[#5746AF] text-white py-3 rounded-lg"
                        >
                            Submit Request
                        </button>

                    </form>
                </div>
            </div>
        </>
    );
};

export default ApplyLeave;