import { useCallback, useEffect, useState } from "react";
import {
    updateEmployee,
    deleteEmployee,
    updateLeaveBalance,
    getuserBalance,
    getEmployees
} from "../../../api/adminApi";
import { useToast } from "../../common/ToastContext";

const roles = ["employee", "manager", "admin"];

const profileFields = [
    
    { name: "department", placeholder: "Department", type: "text" },
];

const EmployeeDetailsModal = ({ user, onClose, onSuccess }: any) => {
    const toast = useToast();
    const [form, setForm] = useState({
        name: user.name,
        email: user.email,
        role: user.role,
        manager_id: user.manager_id || "",
        department: user.department || ""
    });

    const [balances, setBalances] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);

    const [balanceChanges, setBalanceChanges] = useState<Record<number, number>>({});

    const adjustLeave = (leave_type_id: number, change: number) => {
        setBalanceChanges(prev => ({
            ...prev,
            [leave_type_id]: (prev[leave_type_id] || 0) + change
        }));
        setBalances(prev => prev.map(b =>
            b.leave_type_id === leave_type_id
                ? { ...b, total_allocated: b.total_allocated + change, remaining: b.remaining + change }
                : b
        ));
    };

    const handleSave = async () => {
        try {
            // Save profile changes
            await updateEmployee(user.id, form);

            // Save all balance changes
            await Promise.all(
                Object.entries(balanceChanges).map(([leave_type_id, change]) =>
                    change !== 0
                        ? updateLeaveBalance({ user_id: user.id, leave_type_id: Number(leave_type_id), change })
                        : Promise.resolve()
                )
            );

            onSuccess();
            onClose();
        } catch (err) {
            toast.error("Failed to save changes");
        }
    };
    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const res = await getEmployees();
            const managerList = res.data.data.filter(
                (u: any) => u.role === "manager"
            );

            setManagers(managerList);
        } catch (err) {
            console.error("Failed to fetch managers", err);
        }
    };
    const fetchBalance = useCallback(async () => {
        const res = await getuserBalance(user.id);
        const data = (res.data.data || []).map((b: any) => ({
            ...b,
            total_allocated: Number(b.total_allocated),
            used: Number(b.used),
            remaining: Number(b.remaining),
        }));
        setBalances(data);
    }, [user.id]);
    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);


    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };



    const handleDelete = async () => {
        await deleteEmployee(user.id);
        onSuccess();
        onClose();
    };



    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">

            <div className="w-[440px] h-full bg-white p-6 shadow-xl overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">{user.name}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500">✕</button>
                </div>

                <div className="mb-6 space-y-3">
                    <h3 className="font-medium text-gray-700">Profile</h3>

                    {profileFields.map((field) => (
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
                        name="manager_id"
                        value={form.manager_id}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    >
                        <option value="">Select Manager</option>

                        {managers.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>

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

                <div className="mb-6">
                    <h3 className="font-medium text-gray-700 mb-3">
                        Leave Balance
                    </h3>

                    <div className="space-y-3">
                        {balances.map((b) => (
                            <div
                                key={b.leave_type_id}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                            >
                                <div>
                                    <p className="text-sm font-medium">{b.type}</p>
                                    <p className="text-xs text-gray-500">
                                        {b.remaining} / {b.total_allocated}
                                    </p>
                                </div>

                                {[
                                    { label: "-", value: -1, style: "bg-red-100 text-red-600" },
                                    { label: "+", value: 1, style: "bg-green-100 text-green-600" },
                                ].map((btn, i) => (
                                    <button
                                        key={i}
                                        onClick={() => adjustLeave(b.leave_type_id, btn.value)}
                                        className={`px-2 py-1 text-sm rounded ${btn.style}`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    {[
                        {
                            label: "Save Changes",
                            onClick: handleSave,
                            className: "bg-purple-600 text-white",
                        },
                        {
                            label: "Delete",
                            onClick: handleDelete,
                            className: "bg-red-500 text-white",
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

export default EmployeeDetailsModal;