import PageHeader from "../common/PageHeader";
import { useEffect, useState, useMemo } from "react";
import { getPageDefinitions, getRolePermissions, setRolePermissions, getAvailableRoles, deleteRole, createRole } from "../../api/permissionsApi";
import { PagePermission } from "../../types/user";
import { useToast } from "../common/ToastContext";
import { ShieldCheck, Users, Plus, Trash2 } from "lucide-react";
import { useAsync } from "../../hooks/useAsync";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";

interface PageDef {
    key: string;
    label: string;
    description: string;
}

interface RoleDef {
    id: number;
    name: string;
    label: string;
    description: string;
}

const ACTIONS: { key: "can_view" | "can_edit" | "can_delete"; label: string }[] = [
    { key: "can_view", label: "View" },
    { key: "can_edit", label: "Edit" },
    { key: "can_delete", label: "Delete" },
];

const SUPPORTED_ACTIONS: Record<string, ("can_view" | "can_edit" | "can_delete")[]> = {
    approvals: ["can_view", "can_edit"],
    manage_employees: ["can_view", "can_edit", "can_delete"],
    manage_invitations: ["can_view", "can_edit", "can_delete"],
    manage_leave_types: ["can_view", "can_edit", "can_delete"],
    manage_holidays: ["can_view", "can_edit", "can_delete"],
    manage_policies: ["can_view", "can_edit", "can_delete"],
    manage_leave_records: ["can_view"],
    bulk_upload: ["can_view"],
    manage_permissions: ["can_view", "can_edit", "can_delete"],
};

const isSupported = (pageKey: string, actionKey: "can_view" | "can_edit" | "can_delete") => {
    const supported = SUPPORTED_ACTIONS[pageKey] || ["can_view", "can_edit", "can_delete"];
    return supported.includes(actionKey);
};

const empty = (): PagePermission => ({ can_view: false, can_edit: false, can_delete: false, scope: "sub" });

const fetchPermissionsInitData = async () => {
    const [pageRes, roleRes] = await Promise.all([getPageDefinitions(), getAvailableRoles()]);
    return {
        pages: pageRes.data.data as PageDef[],
        roles: (roleRes.data.data as RoleDef[]).filter((r: RoleDef) => r.name !== "admin")
    };
};

const ManagePermissionsPage = () => {
    const toast = useToast();
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [permissions, setPermissions] = useState<Record<string, PagePermission>>({});
    const [saving, setSaving] = useState(false);

    // Dynamic role creation state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleLabel, setNewRoleLabel] = useState("");
    const [newRoleDesc, setNewRoleDesc] = useState("");

    const { data: initData, LoadingScreen, execute: loadInitData } = useAsync(fetchPermissionsInitData, true);

    useEffect(() => {
        loadInitData();
    }, [loadInitData]);

    const pages = useMemo(() => initData?.pages || [], [initData]);
    const roles = useMemo(() => initData?.roles || [], [initData]);

    // Select first role automatically once loaded
    useEffect(() => {
        if (roles.length > 0 && !selectedRole) {
            setSelectedRole(roles[0].name);
        }
    }, [roles, selectedRole]);

    useEffect(() => {
        const loadPermissions = async (role: string) => {
            try {
                const res = await getRolePermissions(role);
                setPermissions(res.data.data);
            } catch {
                toast.error("Failed to load role permissions");
            }
        };

        if (selectedRole) {
            loadPermissions(selectedRole);
        }
    }, [selectedRole, toast]);

    const toggle = (pageKey: string, action: "can_view" | "can_edit" | "can_delete") => {
        setPermissions((prev) => {
            const current = prev[pageKey] ?? empty();
            const updated = { ...current, [action]: !current[action] };

            if (action !== "can_view" && updated[action] && !updated.can_view) {
                updated.can_view = true;
            }
            if (action === "can_view" && !updated.can_view) {
                updated.can_edit = false;
                updated.can_delete = false;
            }

            return { ...prev, [pageKey]: updated };
        });
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        try {
            setSaving(true);
            await setRolePermissions(selectedRole, permissions);
            toast.success("Permissions updated successfully!");
        } catch {
            toast.error("Failed to save role permissions");
        } finally {
            setSaving(false);
        }
    };

    // Auto slugify role label into key
    useEffect(() => {
        const slug = newRoleLabel
            .toLowerCase()
            .replace(/[^a-z0-9\s_]/g, "")
            .replace(/\s+/g, "_");
        setNewRoleName(slug);
    }, [newRoleLabel]);

    const handleAddRole = async () => {
        if (!newRoleLabel.trim()) {
            toast.warning("Role name is required");
            return;
        }
        if (!newRoleName.trim()) {
            toast.warning("Key identifier is required");
            return;
        }

        try {
            await createRole(
                newRoleName.trim(),
                newRoleLabel.trim(),
                newRoleDesc.trim()
            );
            toast.success("Custom role created successfully!");
            setNewRoleLabel("");
            setNewRoleDesc("");
            setIsDialogOpen(false);
            loadInitData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to persist the custom role to server");
        }
    };

    const handleDeleteRole = async (roleName: string) => {
        if (!window.confirm(`Are you sure you want to delete the role "${roleName}"? Employees currently holding this role will remain, but you won't be able to edit its page security. This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteRole(roleName);
            toast.success("Role deleted successfully!");
            setSelectedRole("");
            loadInitData();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete custom role");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative min-h-[400px] h-fit flex-shrink-0 pb-10">
            <LoadingScreen />

            <div className="mb-6 flex items-center gap-3">
                <PageHeader title="Page Permissions" subtitle="Control which pages each user can access and what they can do" divider={false} />
                {/* Small cute Admin illustration next to title */}
                <img 
                    src="/Admin-rafiki.svg" 
                    className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                    alt="Admin Graphic" 
                />
            </div>
            <hr className="border-gray-100 mb-6" />

            <div className="flex gap-6 h-[calc(100%-80px)]">
                {/* Roles Selection */}
                <div className="w-64 shrink-0 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Role</p>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <button
                                    className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 flex-shrink-0"
                                >
                                    <Plus size={13} className="stroke-[3px]" />
                                    Create Role
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl shadow-xl">
                                <DialogHeader>
                                    <DialogTitle>Create Custom Role</DialogTitle>
                                    <DialogDescription>
                                        Create a new custom corporate role (e.g. hr-assistant, dev-lead). You can configure its permissions on the grid after creation.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role-label" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Role Label (Display Name)</Label>
                                        <Input
                                            id="role-label"
                                            placeholder="e.g. HR Assistant"
                                            value={newRoleLabel}
                                            onChange={(e) => setNewRoleLabel(e.target.value)}
                                            className="rounded-xl border-gray-200 h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role-key" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Internal Identifier Key</Label>
                                        <Input
                                            id="role-key"
                                            placeholder="e.g. hr_assistant"
                                            value={newRoleName}
                                            onChange={(e) => setNewRoleName(e.target.value)}
                                            className="rounded-xl border-gray-200 h-11 bg-gray-50"
                                        />
                                        <p className="text-[11px] text-gray-400 font-medium px-1 mt-1">
                                            Lowercase, numbers, and underscores only. This is used internally.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role-desc" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description (Optional)</Label>
                                        <Input
                                            id="role-desc"
                                            placeholder="e.g. Can manage employees and view leaves"
                                            value={newRoleDesc}
                                            onChange={(e) => setNewRoleDesc(e.target.value)}
                                            className="rounded-xl border-gray-200 h-11"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="sm:justify-end gap-2">
                                    <DialogClose asChild>
                                        <Button variant="ghost" className="rounded-xl text-gray-500 font-medium">Cancel</Button>
                                    </DialogClose>
                                    <Button
                                        onClick={handleAddRole}
                                        className="bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary-light font-bold"
                                    >
                                        Create Role
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                        {roles.map((role: any) => {
                            return (
                                <div
                                    key={role.name}
                                    onClick={() => setSelectedRole(role.name)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer group ${selectedRole === role.name
                                        ? "border-primary bg-primary-light shadow-sm"
                                        : "border-gray-200 bg-gray-50 hover:border-primary-light"
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                                        <Users size={14} className="text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{role.label}</p>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">{role.description || "Custom role"}</p>
                                    </div>
                                    {role.name !== "employee" && role.name !== "manager" && role.name !== "hr" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteRole(role.name);
                                            }}
                                            className="text-gray-300 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title="Delete custom role"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    {!selectedRole ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
                                <p className="text-sm font-medium">Select a role to manage system page access</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {(() => {
                                const activeRoleInfo = roles.find((r: any) => r.name === selectedRole) || { label: selectedRole, description: "" };
                                return (
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">
                                                Role Access Settings — {activeRoleInfo.label}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                Define global view, edit, and delete scopes for all {activeRoleInfo.label}s
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark disabled:opacity-50 shadow-sm hover:shadow-primary-light transition-all"
                                        >
                                            {saving ? "Saving..." : "Save Role Permissions"}
                                        </button>
                                    </div>
                                );
                            })()}
                            <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1">
                                {/* Header row */}
                                <div className="grid grid-cols-[1fr_repeat(3,_80px)] items-center px-4 py-2 border-b border-gray-50 bg-gray-50/50 rounded-lg">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Area</span>
                                    {ACTIONS.map((a) => (
                                        <span key={a.key as string} className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                                            {a.label}
                                        </span>
                                    ))}
                                </div>

                                {pages.map((page: any) => {
                                    const perm = permissions[page.key] ?? empty();
                                    return (
                                        <div
                                            key={page.key}
                                            className="grid grid-cols-[1fr_repeat(3,_80px)] items-center bg-gray-50/30 hover:bg-gray-50/70 border border-gray-100 rounded-xl px-4 py-3.5 transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">{page.label}</p>
                                                <p className="text-xs text-gray-400 font-medium mt-0.5 leading-relaxed">{page.description}</p>
                                                {(page.key === "approvals" || page.key === "manage_employees") && perm.can_view && (
                                                    <div className="mt-2.5 flex items-center gap-3 bg-primary-light/40 border border-primary-light/60 rounded-xl p-2.5 w-max">
                                                        <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest px-1">Target Scope:</span>
                                                        <NativeSelect
                                                            value={perm.scope || "sub"}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setPermissions((prev) => ({
                                                                    ...prev,
                                                                    [page.key]: {
                                                                        ...(prev[page.key] ?? empty()),
                                                                        scope: val
                                                                    }
                                                                }));
                                                            }}
                                                            className="min-w-[280px] h-9 border-primary-light text-xs font-bold text-primary-dark rounded-lg"
                                                        >
                                                            <NativeSelectOption value="all">Global Organization (All Employees)</NativeSelectOption>
                                                            <NativeSelectOption value="sub">Reporting Line (Team / Direct Reports)</NativeSelectOption>
                                                        </NativeSelect>
                                                    </div>
                                                )}
                                            </div>
                                            {ACTIONS.map((action) => {
                                                const supported = isSupported(page.key, action.key);
                                                return (
                                                    <div key={action.key as string} className="flex justify-center">
                                                        {supported ? (
                                                            <button
                                                                onClick={() => toggle(page.key, action.key)}
                                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${perm[action.key]
                                                                    ? "bg-primary border-primary shadow-sm shadow-primary-light"
                                                                    : "bg-white border-gray-200 hover:border-primary"
                                                                    }`}
                                                                title={`Toggle ${action.label} for ${page.label}`}
                                                            >
                                                                {perm[action.key] && (
                                                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="text-gray-300 font-medium select-none">—</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManagePermissionsPage;
