import PageHeader from "../common/PageHeader";
import { useState, useEffect, useRef, useMemo } from "react";
import { getPolicies, createPolicy, updatePolicy, deletePolicy, getPolicyRules, setPolicyRules } from "../../api/managementApi";
import { getLeaveTypes } from "../../api/leaveApi";
import { useToast } from "../common/ToastContext";
import { useAsync } from "../../hooks/useAsync";
import { Plus, Trash2, Edit2, FileText, Info, X } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NativeSelect } from "../ui/native-select";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const fetchPoliciesInitData = async () => {
    const [polRes, ltRes] = await Promise.all([getPolicies(), getLeaveTypes()]);
    return {
        policies: polRes.data.data || [],
        leaveTypes: ltRes.data.data || []
    };
};

const ManagePoliciesPage = () => {
    const toast = useToast();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role_id === 1;
    const canEdit = isAdmin || user?.permissions?.['manage_policies']?.can_edit === true;
    const canDelete = isAdmin || user?.permissions?.['manage_policies']?.can_delete === true;

    const { data: initData, LoadingScreen, execute: loadInitData } = useAsync(fetchPoliciesInitData, true);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const policies = useMemo(() => initData?.policies || [], [initData]);
    const leaveTypes = useMemo(() => initData?.leaveTypes || [], [initData]);

    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [sheetOpen, setSheetOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
    const [policyForm, setPolicyForm] = useState({ name: "", description: "" });

    const [activeLeaveTypeIds, setActiveLeaveTypeIds] = useState<number[]>([]);
    const [allocations, setAllocations] = useState<Record<number, number>>({});
    const [selectedToAdd, setSelectedToAdd] = useState<string>("");

    const [saving, setSaving] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    const LOP_ID = 7;

    const openCreateSheet = () => {
        setEditMode(false);
        setSelectedPolicyId(null);
        setPolicyForm({ name: "", description: "" });
        setSelectedToAdd("");

        setActiveLeaveTypeIds([LOP_ID]);
        setAllocations({ [LOP_ID]: 0 });

        setSheetOpen(true);
        setTimeout(() => nameRef.current?.focus(), 150);
    };

    const openEditSheet = async (policy: any) => {
        setEditMode(true);
        setSelectedPolicyId(policy.id);
        setPolicyForm({ name: policy.name, description: policy.description || "" });
        setSelectedToAdd("");

        // Fetch allocations
        try {
            const res = await getPolicyRules(policy.id);
            const rules = res.data.data || [];

            if (rules.length === 0) {
                // If policy currently has no custom rules, default to LOP at least
                setActiveLeaveTypeIds([LOP_ID]);
                setAllocations({ [LOP_ID]: 0 });
            } else {
                const activeIds = rules.map((r: any) => r.leave_type_id);
                const initialAllocs: Record<number, number> = {};
                rules.forEach((r: any) => {
                    initialAllocs[r.leave_type_id] = r.total_allocated;
                });

                // Keep LOP_ID present in the list just in case
                if (!activeIds.includes(LOP_ID)) {
                    activeIds.push(LOP_ID);
                    initialAllocs[LOP_ID] = 0;
                }

                setActiveLeaveTypeIds(activeIds);
                setAllocations(initialAllocs);
            }
        } catch {
            toast.error("Failed to load leave rules for this policy");
        }

        setSheetOpen(true);
        setTimeout(() => nameRef.current?.focus(), 150);
    };

    const handleAddLeaveType = () => {
        const idNum = Number(selectedToAdd);
        if (!idNum || activeLeaveTypeIds.includes(idNum)) return;

        setActiveLeaveTypeIds(prev => [...prev, idNum]);
        setAllocations(prev => ({ ...prev, [idNum]: 0 }));
        setSelectedToAdd("");
    };

    const handleRemoveLeaveType = (id: number) => {
        if (id === LOP_ID) {
            toast.warning("Loss of Pay (unpaid) is the default policy fallback and cannot be removed.");
            return;
        }
        setActiveLeaveTypeIds(prev => prev.filter(item => item !== id));
        setAllocations(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    };

    const handleSave = async () => {
        if (!policyForm.name.trim()) {
            toast.warning("Policy name is required");
            nameRef.current?.focus();
            return;
        }

        try {
            setSaving(true);
            let policyId = selectedPolicyId;

            // Step 1: Create or update policy meta
            if (editMode && policyId) {
                await updatePolicy(policyId, {
                    name: policyForm.name.trim(),
                    description: policyForm.description.trim() || undefined,
                });
            } else {
                const res = await createPolicy({
                    name: policyForm.name.trim(),
                    description: policyForm.description.trim() || undefined,
                });
                policyId = res.data.data?.id;
            }

            // Step 2: Set page rules (allocations)
            if (policyId) {
                // Ensure Loss of Pay is in allocations with 0 days always
                const rulesToSave = activeLeaveTypeIds.map((ltId) => ({
                    leave_type_id: ltId,
                    total_allocated: ltId === LOP_ID ? 0 : Number(allocations[ltId]) || 0,
                }));

                await setPolicyRules(policyId, rulesToSave);
                toast.success(editMode ? "Policy rules updated!" : "Policy created and rules assigned!");
                setSheetOpen(false);
                loadInitData();
            }
        } catch {
            toast.error("An error occurred while saving the leave policy");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (id === 1) {
            toast.warning("The Standard Enterprise Policy is a system protected template and cannot be deleted.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this policy? Any employees assigned to this policy will automatically revert to the Standard Enterprise Policy fallback. This action cannot be undone.")) {
            return;
        }

        try {
            setDeletingId(id);
            await deletePolicy(id);
            toast.success("Policy deleted successfully!");
            loadInitData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete policy");
        } finally {
            setDeletingId(null);
        }
    };

    const totalDays = Object.values(allocations).reduce((a, b) => a + (Number(b) || 0), 0);

    // List of leave types available to add to this policy
    const availableToAdd = leaveTypes.filter((lt: any) => !activeLeaveTypeIds.includes(lt.id));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 relative min-h-[400px]">
            <LoadingScreen />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PageHeader
                        title="Leave Policies"
                        subtitle="Create, configure, and assign customized leave entitlement policies for your workforce"
                    />
                    {/* Small cute Admin illustration next to title */}
                    <img 
                        src="/Admin-rafiki.svg" 
                        className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                        alt="Admin Graphic" 
                    />
                </div>
                {canEdit && (
                    <button
                        onClick={openCreateSheet}
                        className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 flex-shrink-0"
                    >
                        <Plus size={13} className="stroke-[3px]" /> New Policy
                    </button>
                )}
            </div>

            {/* Explanatory Info Alert */}
            <div className="flex gap-3 bg-[#EFF6FC] border border-primary/10 rounded-xl p-4 text-sm text-primary-dark">
                <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                    <span className="font-semibold">How Policies Work:</span> Policies define exact yearly leave balances for your employees. Click any policy card to edit its allocations, set values, or add new leave types in the drawer.
                </div>
            </div>

            {/* Policy Grid */}
            {policies.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center gap-2">
                    <FileText size={28} className="text-gray-300" />
                    <p>No policies yet — create one to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {policies.map((policy: any) => (
                        <div
                            key={policy.id}
                            onClick={() => openEditSheet(policy)}
                            className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-light transition-all duration-250 cursor-pointer flex flex-col justify-between group relative min-h-[160px]"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-primary-light/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                                        <FileText size={18} className="text-primary" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {canDelete && (
                                            <button
                                                onClick={(e) => handleDelete(e, policy.id)}
                                                disabled={deletingId === policy.id}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                                title="Delete policy"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                        <button
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light/30 rounded-lg transition"
                                            title="Edit Policy"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-gray-800 text-base group-hover:text-primary transition-colors">{policy.name}</h3>
                                    {policy.description ? (
                                        <p className="text-xs text-gray-400 line-clamp-2">{policy.description}</p>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No description provided</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                <span>Allocations</span>
                                <span className="font-semibold text-primary bg-primary-light/30 px-2 py-0.5 rounded-full text-[10px]">
                                    {policy.rule_count} leave type{policy.rule_count !== 1 ? "s" : ""}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Sliding Policy Configuration Sheet ── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-xl bg-white p-6 rounded-l-2xl shadow-2xl flex flex-col h-full border-l border-gray-100 overflow-y-auto">
                    <SheetHeader className="text-left mb-6 pb-4 border-b border-gray-100 flex-shrink-0">
                        <SheetTitle className="text-xl font-bold text-gray-900">{editMode ? "Modify Entitlements" : "Construct Entitlements"}</SheetTitle>
                        <SheetDescription className="text-sm font-medium text-gray-400 mt-1">
                            Set names, descriptions, and custom allocation rules for each specific leave type inside this policy.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                        {/* Meta */}
                        <div className="grid gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div className="space-y-2">
                                <Label htmlFor="p-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Policy Title</Label>
                                <Input
                                    id="p-name"
                                    ref={nameRef}
                                    placeholder="e.g. Executive Staff Policy"
                                    value={policyForm.name}
                                    onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                                    className="rounded-xl border-gray-200 h-11 focus-visible:ring-primary-light bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="p-desc" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Summary (Optional)</Label>
                                <Input
                                    id="p-desc"
                                    placeholder="e.g. Upgraded allowances for management team"
                                    value={policyForm.description}
                                    onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                                    className="rounded-xl border-gray-200 h-11 focus-visible:ring-primary-light bg-white"
                                />
                            </div>
                        </div>

                        {/* Allocations Table */}
                        <div className="space-y-3">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Configured Entitlements</p>

                            <div className="border border-gray-150 rounded-xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3 w-32">Allocated Days</th>
                                            <th className="px-4 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {activeLeaveTypeIds.map((ltId) => {
                                            const type = leaveTypes.find((lt: any) => lt.id === ltId);
                                            if (!type) return null;
                                            const isLop = ltId === LOP_ID;

                                            return (
                                                <tr key={ltId} className="hover:bg-gray-50/50 transition">
                                                    <td className="px-4 py-3">
                                                        <span className="font-bold text-gray-800">{type.name}</span>
                                                        {isLop && <span className="block text-[10px] text-gray-400 font-medium">Default fallback (unpaid)</span>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isLop ? (
                                                            <span className="font-semibold text-gray-400 italic">No limit</span>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    max={365}
                                                                    placeholder="0"
                                                                    value={allocations[ltId] ?? ""}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setAllocations(prev => ({ ...prev, [ltId]: val === "" ? 0 : Number(val) }));
                                                                    }}
                                                                    className="h-8 w-20 text-xs rounded-lg border-gray-200 text-center font-bold text-gray-700"
                                                                />
                                                                <span className="text-[11px] text-gray-400 font-bold">days</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        {!isLop && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveLeaveType(ltId)}
                                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Add More Entitlements Trigger */}
                        {availableToAdd.length > 0 && (
                            <div className="bg-[#EFF6FC]/30 border border-primary-light/40 rounded-xl p-4 flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-gray-800">Add Leave Category</p>
                                    <p className="text-[11px] text-gray-400 font-medium">Grant another leave type balance</p>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <NativeSelect
                                        value={selectedToAdd}
                                        onChange={(e) => setSelectedToAdd(e.target.value)}
                                        className="h-9 text-xs font-bold text-gray-700 rounded-lg min-w-[140px]"
                                    >
                                        <option value="">Choose category…</option>
                                        {availableToAdd.map((lt: any) => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </NativeSelect>
                                    <Button
                                        type="button"
                                        onClick={handleAddLeaveType}
                                        disabled={!selectedToAdd}
                                        className="h-9 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 gap-3">
                        <div className="text-left">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Yearly Entitlement</p>
                            <p className="text-lg font-extrabold text-primary">{totalDays} Days Allocated</p>
                        </div>
                        <div className="flex gap-2.5">
                            <SheetClose asChild>
                                <Button variant="outline" className="rounded-xl text-gray-500 font-medium h-11 border-gray-250">Cancel</Button>
                            </SheetClose>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary-light font-bold h-11"
                            >
                                {saving ? "Saving Policy..." : "Save Policy"}
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default ManagePoliciesPage;
