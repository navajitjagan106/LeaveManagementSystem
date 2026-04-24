import React, { useState, useEffect } from 'react';
import FormField from '../common/forms/FormField';
import RadioGroup from '../common/forms/RadioGroup';
import DateRangePicker from '../common/forms/DateRangePicker';
import { applyLeave, calculateDays, getLeaveInitData, getTeamOnLeave } from "../../api/leaveApi";

import { LeaveBalance, LeaveType } from "../../types";
import PageHeader from '../common/PageHeader';
import { useToast } from '../common/ToastContext';


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
    const toast = useToast();
    const [teamOnLeave, setTeamOnLeave] = useState<{ id: number; name: string; from_date: string; to_date: string; leave_type: string }[]>([]);

    useEffect(() => {
        if (!formData.fromDate || !formData.toDate) {
            setTeamOnLeave([]);
            return;
        }
        getTeamOnLeave(formData.fromDate, formData.toDate)
            .then(res => setTeamOnLeave(res.data.data))
            .catch(() => setTeamOnLeave([]));
    }, [formData.fromDate, formData.toDate]);

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
            toast.warning('Please fill all required fields');
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

            toast.success('Leave applied successfully!');

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

            toast.error(err.response?.data?.error || 'Failed to apply leave');
        }
    };

    const selectedLeaveType = leaveTypes.find(
        (t: any) => t.id === parseInt(formData.leaveType)
    );
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
                            {selectedLeaveType?.description && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-600">{selectedLeaveType.description}</p>
                                </div>
                            )}
                            
                            {selectedLeaveType && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm text-green-700">
                                        Remaining Leave:{" "}
                                        <span className="font-semibold">
                                            {selectedLeaveType.is_unlimited ? "∞ Unlimited" : remaining}
                                        </span>
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
                        <DateRangePicker
                            fromDate={formData.fromDate}
                            toDate={formData.toDate}
                            totalDays={totalDays}
                            onFromChange={(val) => setFormData({ ...formData, fromDate: val })}
                            onToChange={(val) => setFormData({ ...formData, toDate: val })}
                        />


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

                        {teamOnLeave.length > 0 && (
                            <div className="mb-6">
                                <p className="text-sm text-blue-500 mb-2">Also on leave during this period</p>
                                <div className="flex gap-2 flex-wrap">
                                    {teamOnLeave.map((person, i) => (
                                        <div key={`${person.id}-${i}`} className="relative group flex flex-col items-center">
                                            <div className="w-9 h-9 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 cursor-default">
                                                {person.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                                                <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                                                    <p className="font-semibold">{person.name}</p>
                                                    <p className="text-gray-300 mt-0.5">{person.leave_type}</p>
                                                    <p className="text-gray-400 mt-0.5">{person.from_date} to {person.to_date}</p>
                                                </div>
                                                <div className="border-4 border-transparent border-t-gray-800" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


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