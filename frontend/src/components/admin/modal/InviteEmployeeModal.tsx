import { useState, useEffect } from "react";
import { sendInvitation, getEmployees, getPolicies } from "../../../api/adminApi";
import { useToast } from "../../common/ToastContext";
import { ManagerCombobox } from "../../common/ManagerCombobox";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

const roles = ["employee", "manager", "admin"];

const InviteEmployeeModal = ({ onClose, onSuccess }: any) => {
    const toast = useToast();
    const [form, setForm] = useState({
        name: "", email: "", role: "employee", department: "",
        manager_id: "" as number | "", policy_id: "", expires_in_hours: "48",
    });
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
                manager_id: form.manager_id !== "" ? Number(form.manager_id) : undefined,
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

    const Field = ({ label }: { label: string }) => (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    );

    return (
        <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-xl font-bold text-gray-900">Invite Employee</SheetTitle>
                        <SheetDescription className="text-sm font-medium text-gray-500 mt-1">
                            Employee will receive a secure link to set their password and join the organization.
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="px-8 py-8 flex-1 flex flex-col gap-8 overflow-y-auto">
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <Field label="Personal Information" />
                        <div className="grid gap-3">
                            <Input
                                placeholder="Full name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="rounded-xl border-gray-200 h-10"
                            />
                            <Input
                                type="email"
                                placeholder="Email address"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="rounded-xl border-gray-200 h-10"
                            />
                            <Input
                                placeholder="Department (optional)"
                                value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })}
                                className="rounded-xl border-gray-200 h-10"
                            />
                        </div>
                    </div>

                    {/* Role & Manager */}
                    <div className="space-y-4">
                        <Field label="Role & Organization" />
                        <div className="grid gap-3">
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                            >
                                {roles.map((r) => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </select>
                            <ManagerCombobox
                                value={form.manager_id}
                                onChange={(id) => setForm({ ...form, manager_id: id })}
                                managers={managers}
                                placeholder="Assign Manager (optional)"
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Employment Level */}
                    <div className="space-y-4">
                        <Field label="Leave Policy" />
                        <div className="grid gap-3">
                            <select
                                value={form.policy_id}
                                onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                            >
                                <option value="">No policy (set later)</option>
                                {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <p className="text-[11px] text-gray-400 leading-relaxed px-1 font-medium">
                                Leave allocations will be applied automatically once the employee joins.
                            </p>
                        </div>
                    </div>

                    {/* Link Expiry */}
                    <div className="space-y-4">
                        <Field label="Invitation Security" />
                        <div className="grid gap-3">
                            <select
                                value={form.expires_in_hours}
                                onChange={(e) => setForm({ ...form, expires_in_hours: e.target.value })}
                                className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all bg-white"
                            >
                                <option value="24">Expires in 24 hours</option>
                                <option value="48">Expires in 48 hours (default)</option>
                                <option value="72">Expires in 72 hours</option>
                                <option value="168">Expires in 7 days</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                    <SheetFooter className="flex-row sm:justify-end gap-3">
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={onClose}
                            className="flex-1 rounded-xl text-gray-500 font-medium"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            size="lg"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-100 font-bold"
                        >
                            {loading ? "Sending Invitation…" : "Send Invitation"}
                        </Button>
                    </SheetFooter>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default InviteEmployeeModal;
