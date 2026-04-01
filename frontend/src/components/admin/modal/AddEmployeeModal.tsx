import React, { useState } from "react";
import { createEmployee } from "../../../api/adminApi";

const AddEmployeeModal = ({ onClose, onSuccess }: any) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password:"",
        role: "employee",
        department: "",
        manager_id: "",
    });

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.name || !form.email) {
            alert("Name and Email required");
            return;
        }

        try {
            await createEmployee(form);
            onSuccess(); // refresh table
            onClose();
        } catch (err) {
            alert("Failed to create employee");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 shadow-lg">

                <h2 className="text-lg font-semibold mb-4">
                    Add Employee
                </h2>

                <div className="space-y-3">
                    <input
                        name="name"
                        placeholder="Name"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />
                    <input
                        name="password"
                        placeholder="password"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />

                    <input
                        name="email"
                        placeholder="Email"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />

                    <select
                        name="role"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>

                    <input
                        name="department"
                        placeholder="Department"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />

                    <input
                        name="manager_id"
                        placeholder="Manager ID"
                        className="w-full border p-2 rounded"
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
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
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;