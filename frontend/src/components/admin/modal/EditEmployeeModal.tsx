import React, { useState } from "react";
import { updateEmployee } from "../../../api/adminApi";

const EditEmployeeModal = ({ user, onClose, onSuccess }: any) => {
    const [form, setForm] = useState({
        role: user.role || "",
        manager_id: user.manager_id || "",
        department: user.department || ""
    });

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            await updateEmployee(user.id, form);
            onSuccess(); // refresh table
            onClose();
        } catch {
            alert("Failed to update employee");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white w-96 p-6 rounded-xl shadow-lg">

                <h2 className="text-lg font-semibold mb-4">
                    Edit Employee
                </h2>

                {/* Form */}
                <div className="space-y-3">

                    {/* Role */}
                    <div>
                        <label className="text-sm text-gray-500">Role</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {/* Manager */}
                    <div>
                        <label className="text-sm text-gray-500">Manager ID</label>
                        <input
                            name="manager_id"
                            value={form.manager_id}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            placeholder="Manager ID"
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className="text-sm text-gray-500">Department</label>
                        <input
                            name="department"
                            value={form.department}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            placeholder="Department"
                        />
                    </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-5">

                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 rounded"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-purple-600 text-white rounded"
                    >
                        Save
                    </button>

                </div>
            </div>
        </div>
    );
};

export default EditEmployeeModal;