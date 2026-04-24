import { useState, useEffect } from "react";
import { getPolicies, createPolicy, deletePolicy, getPolicyRules, setPolicyRules } from "../../../api/adminApi";
import { getLeaveTypes } from "../../../api/leaveApi";
import { useToast } from "../../common/ToastContext";
import { Plus, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Field, FieldGroup } from "../../ui/field";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const PoliciesSection = () => {
    const toast = useToast();
    const [policies, setPolicies] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [rulesMap, setRulesMap] = useState<Record<number, any[]>>({});
    const [newPolicy, setNewPolicy] = useState({ name: "", description: "" });
    const [saving, setSaving] = useState(false);

    const fetchPolicies = async () => {
        const res = await getPolicies();
        setPolicies(res.data.data || []);
    };

    useEffect(() => {
        fetchPolicies();
        getLeaveTypes().then((res) => setLeaveTypes(res.data.data || []));
    }, []);

    const handleExpand = async (id: number) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        if (!rulesMap[id]) {
            const res = await getPolicyRules(id);
            setRulesMap((prev) => ({ ...prev, [id]: res.data.data || [] }));
        }
    };

    const getRuleAllocated = (policyId: number, leaveTypeId: number) => {
        const rules = rulesMap[policyId] || [];
        return rules.find((r) => r.leave_type_id === leaveTypeId)?.total_allocated ?? 0;
    };

    const setRuleValue = (policyId: number, leaveTypeId: number, value: number) => {
        setRulesMap((prev) => {
            const rules = [...(prev[policyId] || [])];
            const idx = rules.findIndex((r) => r.leave_type_id === leaveTypeId);
            if (idx >= 0) rules[idx] = { ...rules[idx], total_allocated: value };
            else rules.push({ leave_type_id: leaveTypeId, total_allocated: value });
            return { ...prev, [policyId]: rules };
        });
    };

    const handleSaveRules = async (policyId: number) => {
        setSaving(true);
        try {
            const rules = (rulesMap[policyId] || []).filter((r) => r.total_allocated > 0);
            await setPolicyRules(policyId, rules.map((r) => ({
                leave_type_id: r.leave_type_id,
                total_allocated: r.total_allocated,
            })));
            toast.success("Rules saved!");
        } catch {
            toast.error("Failed to save rules");
        } finally {
            setSaving(false);
        }
    };

    const handleAdd = async () => {
        if (!newPolicy.name) { toast.warning("Policy name is required"); return; }
        try {
            await createPolicy(newPolicy);
            setNewPolicy({ name: "", description: "" });
            fetchPolicies();
            toast.success("Policy created!");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to create policy");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deletePolicy(id);
            fetchPolicies();
            toast.success("Policy deleted");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete policy");
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Employment Policies</h2>
                    <p className="text-sm text-gray-500">Define leave entitlements per employment level</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition">
                            <Plus size={15} /> New Policy
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Policy</DialogTitle>
                            <DialogDescription>Create a leave entitlement policy for an employment level.</DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="p-name">Policy name</Label>
                                <Input
                                    id="p-name"
                                    placeholder="e.g. Senior Developer"
                                    value={newPolicy.name}
                                    onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                                />
                            </Field>
                            <Field>
                                <Label htmlFor="p-desc">Description (optional)</Label>
                                <Input
                                    id="p-desc"
                                    placeholder="Short description"
                                    value={newPolicy.description}
                                    onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                                />
                            </Field>
                        </FieldGroup>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleAdd}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {policies.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">
                    No policies yet — create one to get started
                </div>
            ) : (
                <div className="space-y-3">
                    {policies.map((policy) => (
                        <div key={policy.id} className="bg-white border rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div>
                                    <p className="font-semibold text-gray-800">{policy.name}</p>
                                    {policy.description && (
                                        <p className="text-xs text-gray-400">{policy.description}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-0.5">{policy.rule_count} leave type{policy.rule_count !== 1 ? "s" : ""}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(policy.id)}
                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleExpand(policy.id)}
                                        className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-lg transition"
                                    >
                                        {expandedId === policy.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                </div>
                            </div>

                            {expandedId === policy.id && (
                                <div className="border-t px-4 py-4 bg-gray-50 space-y-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Allocations</p>
                                    {leaveTypes.length === 0 ? (
                                        <p className="text-sm text-gray-400">No leave types configured yet</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {leaveTypes.map((lt) => (
                                                <div key={lt.id} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-lg border">
                                                    <span className="text-sm text-gray-700">{lt.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={getRuleAllocated(policy.id, lt.id)}
                                                            onChange={(e) => setRuleValue(policy.id, lt.id, Number(e.target.value))}
                                                            className="w-16 border border-gray-200 p-1.5 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-300"
                                                        />
                                                        <span className="text-xs text-gray-400">days</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400">Set to 0 to exclude a leave type from this policy</p>
                                    <button
                                        onClick={() => handleSaveRules(policy.id)}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                                    >
                                        <Save size={14} />
                                        {saving ? "Saving..." : "Save Rules"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PoliciesSection;
