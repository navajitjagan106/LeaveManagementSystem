import React, { useState } from 'react';
import FormField from '../forms/FormField';
import RadioGroup from '../forms/RadioGroup';

const ApplyLeave: React.FC = () => {
    const [formData, setFormData] = useState({
        leaveType: 'sick',
        durationType: 'full',
        fromDate: '',
        toDate: '',
        reason: '',
        manager: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Leave request:', formData);
        alert('Leave request submitted!');
    };

    return (
        <div className='flex justify-center'>

            <div className="bg-white p-8 rounded-lg shadow-sm  w-full">
                <form onSubmit={handleSubmit}>
                    {/* Leave Type */}
                    <FormField label="Leave Type">
                        <RadioGroup
                            name="leaveType"
                            value={formData.leaveType}
                            options={[
                                { label: "Sick Leave", value: "sick" },
                                { label: "Casual Leave", value: "casual" },
                                { label: "Earned Leave", value: "earned" },
                            ]}
                            onChange={(val) => setFormData({ ...formData, leaveType: val })}
                        />
                    </FormField>

                    {/* Duration Type */}
                    <div className="mb-6">
                        <FormField label="Duration Type">
                            <RadioGroup
                                name="durationType"
                                value={formData.durationType}
                                options={[
                                    { label: "Full Day", value: "full" },
                                    { label: "Half Day", value: "half" },
                                ]}
                                onChange={(val) => setFormData({ ...formData, durationType: val })}
                            />
                        </FormField>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <FormField label="From Date">
                            <input
                                type="date"
                                value={formData.fromDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, fromDate: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                        </FormField>
                        <FormField label="To Date">
                            <input
                                type="date"
                                value={formData.toDate}
                                onChange={(e) =>
                                    setFormData({ ...formData, fromDate: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            />
                        </FormField>
                    </div>

                    {/* Reason */}
                    <div className="mb-6">
                        <FormField label="Reason">
                            <textarea
                                value={formData.reason}
                                onChange={(e) =>
                                    setFormData({ ...formData, reason: e.target.value })
                                }
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24"
                            />
                        </FormField>
                    </div>

                    {/* Manager */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2">Apply to (Manager)</label>
                        <input
                            type="text"
                            value={formData.manager}
                            onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2"
                            placeholder="Search employee"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                    >
                        Submit Request
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ApplyLeave;