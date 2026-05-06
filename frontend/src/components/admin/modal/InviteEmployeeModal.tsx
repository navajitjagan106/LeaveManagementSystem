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
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Invite Employee</SheetTitle>
                    <SheetDescription>Employee will receive a link to set their password</SheetDescription>
                </SheetHeader>

                <div className="px-6 py-5 flex-1 flex flex-col gap-6">
                    {/* Personal Info */}
                    <div className="space-y-2">
                        <Field label="Personal Info" />
                        <Input
                            placeholder="Full name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <Input
                            type="email"
                            placeholder="Email address"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <Input
                            placeholder="Department (optional)"
                            value={form.department}
                            onChange={(e) => setForm({ ...form, department: e.target.value })}
                        />
                    </div>

                    {/* Role & Manager */}
                    <div className="space-y-2">
                        <Field label="Role & Manager" />
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                            {roles.map((r) => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                            ))}
                        </select>
                        <ManagerCombobox
                            value={form.manager_id}
                            onChange={(id) => setForm({ ...form, manager_id: id })}
                            managers={managers}
                            placeholder="No Manager"
                        />
                    </div>

                    {/* Employment Level */}
                    <div className="space-y-2">
                        <Field label="Employment Level" />
                        <select
                            value={form.policy_id}
                            onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
                            className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                            <option value="">No policy (set later)</option>
                            {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <p className="text-xs text-gray-400">Leave allocations will be applied automatically based on the selected policy</p>
                    </div>

                    {/* Link Expiry */}
                    <div className="space-y-2">
                        <Field label="Link Expiry" />
                        <select
                            value={form.expires_in_hours}
                            onChange={(e) => setForm({ ...form, expires_in_hours: e.target.value })}
                            className="w-full border border-gray-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        >
                            <option value="24">24 hours</option>
                            <option value="48">48 hours (default)</option>
                            <option value="72">72 hours</option>
                            <option value="168">7 days</option>
                        </select>
                    </div>
                </div>

                <SheetFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {loading ? "Sending…" : "Send Invitation"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default InviteEmployeeModal;
