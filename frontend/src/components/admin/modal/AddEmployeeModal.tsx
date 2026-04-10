import { useEffect, useState } from "react";
import { createEmployee, getEmployees } from "../../../api/adminApi";
import { getLeaveTypes } from "../../../api/leaveApi";

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

    const [managers, setManagers] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [leaveAllocations, setLeaveAllocations] = useState<Record<number, { enabled: boolean; days: number }>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [empRes, ltRes] = await Promise.all([getEmployees(), getLeaveTypes()]);
            const managerList = empRes.data.data.filter((u: any) => u.role === "manager");
            setManagers(managerList);

            const types = ltRes.data.data;
            setLeaveTypes(types);

            // default all enabled with max_days
            const defaults: Record<number, { enabled: boolean; days: number }> = {};
            types.forEach((lt: any) => {
                defaults[lt.id] = { enabled: true, days: lt.max_days };
            });
            setLeaveAllocations(defaults);
        };
        fetchData();
    }, []);

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.name || !form.email || !form.password) {
            alert("Name, Email and Password are required");
            return;
        }

        const leave_allocations = Object.entries(leaveAllocations)
            .filter(([, v]) => v.enabled && v.days > 0)
            .map(([leave_type_id, v]) => ({
                leave_type_id: Number(leave_type_id),
                total_allocated: v.days,
            }));

        try {
            setLoading(true);
            await createEmployee({ ...form, leave_allocations });
            onSuccess();
            onClose();
        } catch {
            alert("Failed to create employee");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
            <div className="w-[440px] h-full bg-white p-6 shadow-xl overflow-y-auto">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Add Employee</h2>
                        <p className="text-sm text-gray-500">Create a new employee account</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500">✕</button>
                </div>

                {/* Basic Info */}
                <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-gray-700">Basic Info</p>
                    {[
                        { name: "name", placeholder: "Full Name", type: "text" },
                        { name: "email", placeholder: "Email", type: "text" },
                        { name: "password", placeholder: "Password", type: "password" },
                        { name: "department", placeholder: "Department", type: "text" },
                    ].map((field) => (
                        <input
                            key={field.name}
                            name={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            value={form[field.name as keyof typeof form]}
                            onChange={handleChange}
                            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        />
                    ))}
                </div>

                {/* Role & Manager */}
                <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-gray-700">Role & Manager</p>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        {roles.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>

                    <select
                        name="manager_id"
                        value={form.manager_id}
                        onChange={handleChange}
                        className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        <option value="">No Manager</option>
                        {managers.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} — {m.department}</option>
                        ))}
                    </select>
                </div>

                {/* Leave Allocation */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Leave Allocation</p>
                    <div className="space-y-2">
                        {leaveTypes.map((lt) => {
                            const alloc = leaveAllocations[lt.id];
                            if (!alloc) return null;
                            return (
                                <div key={lt.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                                    <input
                                        type="checkbox"
                                        checked={alloc.enabled}
                                        onChange={(e) =>
                                            setLeaveAllocations(prev => ({
                                                ...prev,
                                                [lt.id]: { ...prev[lt.id], enabled: e.target.checked }
                                            }))
                                        }
                                        className="accent-purple-600"
                                    />
                                    <span className="text-sm flex-1">{lt.name}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={lt.max_days}
                                        value={alloc.days}
                                        disabled={!alloc.enabled}
                                        onChange={(e) =>
                                            setLeaveAllocations(prev => ({
                                                ...prev,
                                                [lt.id]: { ...prev[lt.id], days: Number(e.target.value) }
                                            }))
                                        }
                                        className="w-16 border border-gray-200 p-1 rounded text-sm text-center disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-purple-300"
                                    />
                                    <span className="text-xs text-gray-400">/ {lt.max_days}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Employee"}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;