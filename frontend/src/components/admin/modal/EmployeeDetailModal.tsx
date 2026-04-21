import { useCallback, useEffect, useState } from "react";
import {
    deleteEmployee, getuserBalance, getEmployees, getPolicies,
    reassignPolicy, resetLeaveBalance, updateManager
} from "../../../api/adminApi";
import { useToast } from "../../common/ToastContext";

const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    employee: "bg-gray-100 text-gray-600",
};

const barColor = (pct: number) => {
    if (pct >= 80) return "bg-red-400";
    if (pct >= 50) return "bg-amber-400";
    return "bg-emerald-400";
};

const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const Divider = () => <div className="border-t border-gray-100" />;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{children}</p>
);

const EmployeeDetailsModal = ({ user, onClose, onSuccess }: any) => {
    const toast = useToast();

    const [balances, setBalances] = useState<any[]>([]);
    const [balancesLoading, setBalancesLoading] = useState(true);
    const [managers, setManagers] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);

    const [selectedPolicy, setSelectedPolicy] = useState<number | "">(user.policy_id || "");
    const [selectedManager, setSelectedManager] = useState<number | "">(user.manager_id || "");

    const [savingPolicy, setSavingPolicy] = useState(false);
    const [savingManager, setSavingManager] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const policyChanged = selectedPolicy !== (user.policy_id || "");
    const managerChanged = selectedManager !== (user.manager_id || "");

    const fetchManagers = useCallback(async () => {
        try {
            const res = await getEmployees();
            setManagers(res.data.data.filter((u: any) =>
                (u.role === "manager" || u.role === "admin") && u.id !== user.id
            ));
        } catch { }
    }, [user.id]);

    const fetchPolicies = useCallback(async () => {
        try {
            const res = await getPolicies();
            setPolicies(res.data.data || []);
        } catch { }
    }, []);

    const fetchBalance = useCallback(async () => {
        setBalancesLoading(true);
        try {
            const res = await getuserBalance(user.id);
            setBalances((res.data.data || []).map((b: any) => ({
                ...b,
                total_allocated: Number(b.total_allocated),
                used: Number(b.used),
                remaining: Number(b.remaining),
            })));
        } catch { } finally {
            setBalancesLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchManagers();
        fetchPolicies();
    }, [fetchManagers, fetchPolicies]);

    useEffect(() => { fetchBalance(); }, [fetchBalance]);

    const handleSavePolicy = async () => {
        setSavingPolicy(true);
        try {
            await reassignPolicy(user.id, selectedPolicy === "" ? null : Number(selectedPolicy));
            toast.success("Policy updated — balances reset");
            fetchBalance();
            onSuccess();
        } catch {
            toast.error("Failed to update policy");
        } finally {
            setSavingPolicy(false);
        }
    };

    const handleSaveManager = async () => {
        setSavingManager(true);
        try {
            await updateManager(user.id, selectedManager === "" ? null : Number(selectedManager));
            toast.success("Manager updated");
            onSuccess();
        } catch {
            toast.error("Failed to update manager");
        } finally {
            setSavingManager(false);
        }
    };

    const handleResetBalance = async () => {
        setResetting(true);
        try {
            await resetLeaveBalance(user.id);
            toast.success("Leave balance reset to 0 used");
            fetchBalance();
        } catch {
            toast.error("Failed to reset balance");
        } finally {
            setResetting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteEmployee(user.id);
            onSuccess();
            onClose();
        } catch {
            toast.error("Failed to delete employee");
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="w-[460px] h-full bg-white shadow-2xl overflow-y-auto flex flex-col animate-slide-in-right">

                {/* ── Header ── */}
                <div className="px-6 pt-6 pb-5 flex items-start gap-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {initials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold text-gray-900 truncate">{user.name}</h2>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[user.role] || roleColors.employee}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate mt-0.5">{user.email}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg w-8 h-8 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex flex-col gap-6 px-6 py-5 flex-1">

                    {/* ── Profile ── */}
                    <div>
                        <SectionLabel>Profile</SectionLabel>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: "Department", value: user.department || "—" },
                                {
                                    label: "Joined",
                                    value: user.created_at
                                        ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
                                        : "—"
                                },
                            ].map(({ label, value }) => (
                                <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                    <p className="text-sm font-medium text-gray-800">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Divider />

                    {/* ── Manager ── */}
                    <div>
                        <SectionLabel>Manager</SectionLabel>
                        {user.manager_name && (
                            <p className="text-xs text-gray-500 mb-2">
                                Currently: <span className="font-medium text-gray-700">{user.manager_name}</span>
                            </p>
                        )}
                        <div className="flex gap-2">
                            <select
                                value={selectedManager}
                                onChange={(e) => setSelectedManager(e.target.value === "" ? "" : Number(e.target.value))}
                                className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors ${managerChanged ? "border-purple-300 bg-purple-50" : "border-gray-200"}`}
                            >
                                <option value="">No manager</option>
                                {managers.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name} — {m.department || m.role}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleSaveManager}
                                disabled={savingManager || !managerChanged}
                                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-purple-700 transition-colors"
                            >
                                {savingManager ? "Saving…" : "Update"}
                            </button>
                        </div>
                    </div>

                    <Divider />

                    {/* ── Leave Policy ── */}
                    <div>
                        <SectionLabel>Leave Policy</SectionLabel>
                        {user.policy_name && (
                            <p className="text-xs text-gray-500 mb-2">
                                Currently: <span className="font-medium text-gray-700">{user.policy_name}</span>
                            </p>
                        )}
                        <div className="flex gap-2">
                            <select
                                value={selectedPolicy}
                                onChange={(e) => setSelectedPolicy(e.target.value === "" ? "" : Number(e.target.value))}
                                className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-colors ${policyChanged ? "border-purple-300 bg-purple-50" : "border-gray-200"}`}
                            >
                                <option value="">No policy</option>
                                {policies.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleSavePolicy}
                                disabled={savingPolicy || !policyChanged}
                                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-purple-700 transition-colors"
                            >
                                {savingPolicy ? "Saving…" : "Update"}
                            </button>
                        </div>
                        {policyChanged && (
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                <span>⚠</span> Updating will reset all leave balances to the new policy
                            </p>
                        )}
                    </div>

                    <Divider />

                    {/* ── Leave Balances ── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <SectionLabel>Leave Balances</SectionLabel>
                            <button
                                onClick={handleResetBalance}
                                disabled={resetting || balancesLoading || balances.length === 0}
                                className="text-xs text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-colors font-medium"
                            >
                                {resetting ? "Resetting…" : "Reset Used to 0"}
                            </button>
                        </div>

                        {balancesLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
                                ))}
                            </div>
                        ) : balances.length === 0 ? (
                            <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl">
                                No leave balances — assign a policy first
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {balances.map((b) => {
                                    const pct = b.total_allocated > 0
                                        ? Math.min(100, Math.round((b.used / b.total_allocated) * 100))
                                        : 0;
                                    return (
                                        <div key={b.leave_type_id} className="bg-gray-50 rounded-xl px-4 py-3">
                                            <div className="flex justify-between items-baseline mb-2">
                                                <p className="text-sm font-medium text-gray-800">{b.type}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="text-gray-400">{b.used} used</span>
                                                    <span>·</span>
                                                    <span className="font-medium text-gray-700">{b.remaining} left</span>
                                                    <span className="text-gray-300">/ {b.total_allocated}</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all ${barColor(pct)}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Divider />

                    {/* ── Danger Zone ── */}
                    <div className="pb-2">
                        <SectionLabel>Danger Zone</SectionLabel>
                        {!confirmDelete ? (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 hover:bg-red-100 transition-colors"
                            >
                                Delete Employee
                            </button>
                        ) : (
                            <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
                                <p className="text-sm text-red-700 font-medium">Delete {user.name}?</p>
                                <p className="text-xs text-red-500">This will permanently remove the employee and all their data. This cannot be undone.</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-60 hover:bg-red-700 transition-colors"
                                    >
                                        {deleting ? "Deleting…" : "Yes, Delete"}
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(false)}
                                        className="flex-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeDetailsModal;
