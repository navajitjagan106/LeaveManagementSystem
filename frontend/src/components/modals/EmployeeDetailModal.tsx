import { useCallback, useEffect, useState } from "react";
import {
    deleteEmployee, getuserBalance, getEmployees, getPolicies,
    reassignPolicy, resetLeaveBalance, updateManager, updateEmployee
} from "../../api/managementApi";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useToast } from "../common/ToastContext";
import { ManagerCombobox } from "../common/ManagerCombobox";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../ui/sheet";
import { getAvailableRoles } from "../../api/permissionsApi";

const getRoleColor = (role: string) => {
    const r = role.toLowerCase().trim();
    
    // Dynamic deterministic palette for rich, harmonious role colors
    const colors = [
        "bg-primary-light text-primary-dark",
        "bg-blue-100 text-blue-700",
        "bg-pink-100 text-pink-700",
        "bg-emerald-100 text-emerald-700",
        "bg-teal-100 text-teal-700",
        "bg-cyan-100 text-cyan-700",
        "bg-sky-100 text-sky-700",
        "bg-indigo-100 text-indigo-700",
        "bg-violet-100 text-violet-700",
        "bg-fuchsia-100 text-fuchsia-700",
        "bg-rose-100 text-rose-700",
        "bg-red-100 text-red-700",
        "bg-orange-100 text-orange-700",
        "bg-amber-100 text-amber-700"
    ];
    
    let hash = 0;
    for (let i = 0; i < r.length; i++) {
        hash = r.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isAdmin = currentUser?.role_id === 1;
    const canEdit = isAdmin || !!currentUser?.permissions?.['manage_employees']?.can_edit;
    const canDelete = isAdmin || !!currentUser?.permissions?.['manage_employees']?.can_delete;
    const canViewBalance = isAdmin || !!currentUser?.permissions?.["manage_leave_records"]?.can_view;
    const toast = useToast();

    const [balances, setBalances] = useState<any[]>([]);
    const [balancesLoading, setBalancesLoading] = useState(true);
    const [managers, setManagers] = useState<any[]>([]);
    const [policies, setPolicies] = useState<any[]>([]);

    const [selectedPolicy, setSelectedPolicy] = useState<number | "">(user.policy_id || "");
    const [selectedManager, setSelectedManager] = useState<number | "">(user.manager_id || "");
    const [selectedRole, setSelectedRole] = useState<string>(user.role);
    const [selectedDept, setSelectedDept] = useState<string>(user.department || "");
    const [roles, setRoles] = useState<any[]>([user.role]);

    const [savingPolicy, setSavingPolicy] = useState(false);
    const [savingManager, setSavingManager] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const policyChanged = selectedPolicy !== (user.policy_id || "");
    const managerChanged = selectedManager !== (user.manager_id || "");
    const roleChanged = selectedRole !== user.role;
    const deptChanged = selectedDept !== (user.department || "");
    const profileChanged = roleChanged || deptChanged;

    const fetchManagers = useCallback(async () => {
        try {
            const res = await getEmployees();
            const list = res.data.data || [];
            const filtered = list.filter((u: any) => {
                if (u.id === user.id) return false;
                
                // Prevent circular manager loops (if u reports up to user.id, u cannot be user.id's manager)
                let tempId = u.manager_id;
                while (tempId) {
                    if (tempId === user.id) return false; // reports to user, filter out
                    const currentSearchId = tempId;
                    const parent = list.find((e: any) => e.id === currentSearchId);
                    tempId = parent ? parent.manager_id : null;
                }
                return true;
            });
            setManagers(filtered);
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
        if (!canEdit) return;
        fetchManagers();
        fetchPolicies();
        getAvailableRoles()
            .then((roleRes) => {
                const fetched = roleRes.data.data;
                if (fetched && fetched.length > 0) {
                    const updated = [...fetched];
                    const hasAdmin = updated.some(r => (typeof r === "string" ? r : r.name) === "admin");
                    if (!hasAdmin) {
                        updated.push("admin");
                    }
                    setRoles(updated);
                }
            })
            .catch(() => {
                console.log("Using fallback default roles due to permission restrictions.");
            });
    }, [canEdit, fetchManagers, fetchPolicies]);

    useEffect(() => { 
        if (canViewBalance) {
            fetchBalance(); 
        } else {
            setBalancesLoading(false);
        }
    }, [canViewBalance, fetchBalance]);

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

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await updateEmployee(user.id, {
                role: selectedRole,
                department: selectedDept === "" ? null : selectedDept,
                manager_id: selectedManager === "" ? null : Number(selectedManager),
            });
            toast.success("Profile details updated successfully");
            onSuccess();
        } catch {
            toast.error("Failed to update profile details");
        } finally {
            setSavingProfile(false);
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
        <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl">
                {/* ── Header ── */}
                <div className="px-6 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <SheetHeader className="text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-light flex-shrink-0">
                                {initials(user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <SheetTitle className="text-lg font-bold text-gray-900">{user.name}</SheetTitle>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${getRoleColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <SheetDescription className="text-sm text-gray-500 font-medium mt-0.5">{user.email}</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                <div className="flex flex-col gap-8 px-8 py-8 flex-1 bg-white">

                    {/* ── Profile ── */}
                    <div>
                        <SectionLabel>Profile & Role</SectionLabel>
                        {canEdit ? (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">Role</p>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors capitalize"
                                        >
                                            {roles.map((r) => {
                                                const rVal = typeof r === "string" ? r : r.name;
                                                const rLabel = typeof r === "string"
                                                    ? r.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
                                                    : r.label || r.name;
                                                return (
                                                    <option key={rVal} value={rVal}>
                                                        {rLabel}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">Department</p>
                                        <input
                                            type="text"
                                            placeholder="e.g. Engineering"
                                            value={selectedDept}
                                            onChange={(e) => setSelectedDept(e.target.value)}
                                            className="w-full border border-gray-200 px-3 py-2.5 rounded-xl text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl mt-2 text-xs text-gray-500">
                                    <span>Joined: {user.created_at
                                        ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
                                        : "—"}
                                    </span>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile || !profileChanged}
                                        className="px-4 py-1.5 bg-primary text-white rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors text-xs shadow-sm hover:shadow-primary-light"
                                    >
                                        {savingProfile ? "Updating…" : "Update Details"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: "Role", value: user.role },
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
                                        <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
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
                        {canEdit ? (
                            <div className="flex gap-2">
                                <ManagerCombobox
                                    value={selectedManager}
                                    onChange={setSelectedManager}
                                    managers={managers}
                                    changed={managerChanged}
                                    className="flex-1"
                                />
                                <button
                                    onClick={handleSaveManager}
                                    disabled={savingManager || !managerChanged}
                                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary-dark transition-colors"
                                >
                                    {savingManager ? "Saving…" : "Update"}
                                </button>
                            </div>
                        ) : (
                            !user.manager_name && (
                                <p className="text-xs text-gray-400">No manager assigned</p>
                            )
                        )}
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
                        {canEdit ? (
                            <>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedPolicy}
                                        onChange={(e) => setSelectedPolicy(e.target.value === "" ? "" : Number(e.target.value))}
                                        className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors ${policyChanged ? "border-primary-light bg-primary-light" : "border-gray-200"}`}
                                    >
                                        <option value="">No policy</option>
                                        {policies.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleSavePolicy}
                                        disabled={savingPolicy || !policyChanged}
                                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary-dark transition-colors"
                                    >
                                        {savingPolicy ? "Saving…" : "Update"}
                                    </button>
                                </div>
                                {policyChanged && (
                                    <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                        <span>⚠</span> Updating will reset all leave balances to the new policy
                                    </p>
                                )}
                            </>
                        ) : (
                            !user.policy_name && (
                                <p className="text-xs text-gray-400">No policy assigned</p>
                            )
                        )}
                    </div>

                    <Divider />

                    {/* ── Leave Balances ── */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <SectionLabel>Leave Balances</SectionLabel>
                            {canEdit && (
                                <button
                                    onClick={handleResetBalance}
                                    disabled={resetting || balancesLoading || balances.length === 0}
                                    className="text-xs text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-colors font-medium"
                                >
                                    {resetting ? "Resetting…" : "Reset Used to 0"}
                                </button>
                            )}
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
                    {canDelete && (
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
                    )}

                </div>
            </SheetContent>
        </Sheet>
    );
};

export default EmployeeDetailsModal;
