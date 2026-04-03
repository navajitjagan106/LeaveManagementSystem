import { useState } from "react";
import { createEmployee } from "../../../api/adminApi";

const fields = [
    { name: "name", placeholder: "Name", type: "text" },
    { name: "email", placeholder: "Email", type: "text" },
    { name: "password", placeholder: "Password", type: "password" },
    { name: "department", placeholder: "Department", type: "text" },
    { name: "manager_id", placeholder: "Manager ID", type: "text" },
];

const roles = ["employee", "manager", "admin"];

const AddEmployeeModal = ({ onClose, onSuccess }: any) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department: "",
        manager_id: "",
    });

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.name || !form.email || !form.password) {
            alert("Name, Email and Password required");
            return;
        }

        try {
            await createEmployee(form);
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create employee");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">

            <div className="w-[440px] h-full bg-white p-6 shadow-xl overflow-y-auto">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Add Employee</h2>
                        <p className="text-sm text-gray-500">
                            Create a new employee account
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500">✕</button>
                </div>

                <div className="space-y-3">

                    {fields.map((field) => (
                        <input
                            key={field.name}
                            name={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={form[field.name as keyof typeof form]}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    ))}

                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    >
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>

                </div>

                <div className="flex gap-3 mt-6">
                    {[
                        {
                            label: "Create Employee",
                            onClick: handleSubmit,
                            className: "bg-purple-600 text-white",
                        },
                        {
                            label: "Cancel",
                            onClick: onClose,
                            className: "bg-gray-200",
                        },
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={btn.onClick}
                            className={`flex-1 py-2 rounded-lg ${btn.className}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AddEmployeeModal;