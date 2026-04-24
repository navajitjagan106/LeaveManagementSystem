import { useState, useEffect } from "react";
import { sendInvitation, getEmployees, getPolicies } from "../../../api/adminApi";
import { useToast } from "../../common/ToastContext";

const roles = ["employee", "manager", "admin"];

const InviteEmployeeModal = ({ onClose, onSuccess }: any) => {
    const toast = useToast();
    const [form, setForm] = useState({ name: "", email: "", role: "employee", department: "", manager_id: "", policy_id: "", expires_in_hours: "48" });
    const [managers, setManagers] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Promise.all([getEmployees(), getPolicies()]).then(([empRes, polRes]) => {
            setManagers(empRes.data.data.filter((u: any) => u.role === "manager" || u.role === "admin"));
            setPolicies(polRes.data.data || []);
        });
    }, []);

    const handleSubmit = async () => {
        if (!form.name) { toast.warning("Full name is required"); return; }
        if (!form.email) { toast.warning("Email is required"); return; }
        try {
            setLoading(true);
            await sendInvitation({
                name: form.name,
                email: form.email,
                role: form.role,
                department: form.department || undefined,
                manager_id: form.manager_id ? Number(form.manager_id) : undefined,
                policy_id: form.policy_id ? Number(form.policy_id) : undefined,
                expires_in_hours: Number(form.expires_in_hours),
            });
            toast.success("Invitation sent!");
            onSuccess?.();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to send invitation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
            <div className="w-[440px] h-full bg-white p-6 shadow-xl overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold">Invite Employee</h2>
                        <p className="text-sm text-gray-500">Employee will only set their password</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-gray-700">Personal Info</p>
                    <input
                        type="text" placeholder="Full name"
                        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <input
                        type="email" placeholder="Email address"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <input
                        type="text" placeholder="Department (optional)"
                        value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                </div>

                <div className="space-y-3 mb-6">
                    <p className="text-sm font-medium text-gray-700">Role & Manager</p>
                    <select
                        value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        {roles.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                    </select>
                    <select
                        value={form.manager_id} onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        <option value="">No Manager</option>
                        {managers.map((m) => <option key={m.id} value={m.id}>{m.name} — {m.department || m.role}</option>)}
                    </select>
                </div>

                <div className="space-y-3 mb-8">
                    <p className="text-sm font-medium text-gray-700">Employment Level</p>
                    <select
                        value={form.policy_id} onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        <option value="">No policy (set later)</option>
                        {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-400">Leave allocations will be applied automatically based on the selected policy</p>
                </div>

                <div className="space-y-3 mb-8">
                    <p className="text-sm font-medium text-gray-700">Link Expiry</p>
                    <select
                        value={form.expires_in_hours} onChange={(e) => setForm({ ...form, expires_in_hours: e.target.value })}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        <option value="24">24 hours</option>
                        <option value="48">48 hours (default)</option>
                        <option value="72">72 hours</option>
                        <option value="168">7 days</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-2.5 rounded-lg bg-purple-600 text-white text-sm disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Invitation"}
                    </button>
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteEmployeeModal;
