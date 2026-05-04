import { useEffect, useState } from "react";
import { getEmployees } from "../../../api/adminApi";
import { getPageDefinitions, getUserPermissions, setUserPermissions } from "../../../api/permissionsApi";
import { PagePermission } from "../../../types/user";
import { useToast } from "../../common/ToastContext";
import { ShieldCheck, User } from "lucide-react";

interface PageDef {
    key: string;
    label: string;
    description: string;
}

const ACTIONS: { key: keyof PagePermission; label: string }[] = [
    { key: "can_view", label: "View" },
    { key: "can_edit", label: "Edit" },
    { key: "can_delete", label: "Delete" },
];

const empty = (): PagePermission => ({ can_view: false, can_edit: false, can_delete: false });

const PermissionsSection = () => {
    const toast = useToast();
    const [employees, setEmployees] = useState<any[]>([]);
    const [pages, setPages] = useState<PageDef[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [permissions, setPermissions] = useState<Record<string, PagePermission>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([getEmployees(), getPageDefinitions()]).then(([empRes, pageRes]) => {
            setEmployees(empRes.data.data.filter((e: any) => e.role !== "admin"));
            setPages(pageRes.data.data);
        });
    }, []);

    const loadPermissions = async (userId: number) => {
        setSelectedId(userId);
        const res = await getUserPermissions(userId);
        setPermissions(res.data.data);
    };

    const toggle = (pageKey: string, action: keyof PagePermission) => {
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
        if (!selectedId) return;
        try {
            setSaving(true);
            await setUserPermissions(selectedId, permissions);
            toast.success("Permissions saved");
        } catch {
            toast.error("Failed to save permissions");
        } finally {
            setSaving(false);
        }
    };

    const selectedUser = employees.find((e) => e.id === selectedId);

    return (
        <div className="flex gap-6 h-full">
            {/* User list */}
            <div className="w-64 shrink-0 flex flex-col gap-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Select User</p>
                {employees.map((emp) => (
                    <button
                        key={emp.id}
                        onClick={() => loadPermissions(emp.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedId === emp.id
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 bg-gray-50 hover:border-purple-300"
                            }`}
                    >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <User size={14} className="text-purple-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Permissions grid */}
            <div className="flex-1 flex flex-col">
                {!selectedId ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <ShieldCheck size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">Select a user to manage their page access</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    Page Access — {selectedUser?.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Toggle what this user can see and do on each page
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                            >
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {/* Header row */}
                            <div className="grid grid-cols-[1fr_repeat(3,_80px)] items-center px-4 py-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Page</span>
                                {ACTIONS.map((a) => (
                                    <span key={a.key} className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                                        {a.label}
                                    </span>
                                ))}
                            </div>

                            {pages.map((page) => {
                                const perm = permissions[page.key] ?? empty();
                                return (
                                    <div
                                        key={page.key}
                                        className="grid grid-cols-[1fr_repeat(3,_80px)] items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{page.label}</p>
                                            <p className="text-xs text-gray-400">{page.description}</p>
                                        </div>
                                        {ACTIONS.map((action) => (
                                            <div key={action.key} className="flex justify-center">
                                                <button
                                                    onClick={() => toggle(page.key, action.key)}
                                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${perm[action.key]
                                                            ? "bg-purple-600 border-purple-600"
                                                            : "bg-white border-gray-300 hover:border-purple-400"
                                                        }`}
                                                    title={`Toggle ${action.label} for ${page.label}`}
                                                >
                                                    {perm[action.key] && (
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PermissionsSection;
