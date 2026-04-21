import { useEffect, useState } from "react";
import { getLeaveTypes } from "../../../api/leaveApi";
import { addLeaveType } from "../../../api/adminApi";
import { Plus } from "lucide-react";
import { useToast } from "../../common/ToastContext";

const LeaveSection = () => {
    const toast = useToast();
    const [types, setTypes] = useState<any[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    const fetchTypes = async () => {
        const res = await getLeaveTypes();
        setTypes(res.data.data || []);
    };
    useEffect(() => { fetchTypes(); }, []);

    const handleAdd = async () => {
        if (!newName.trim()) { toast.warning("Name is required"); return; }
        try {
            await addLeaveType({ name: newName.trim(), description: newDesc.trim() || undefined });
            setNewName("");
            setNewDesc("");
            setShowAdd(false);
            fetchTypes();
            toast.success("Leave type added!");
        } catch { toast.error("Failed to add leave type"); }
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Leave Types</h2>
                    <p className="text-sm text-gray-500">Categories used across all policies</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm"
                >
                    <Plus size={14} /> Add Type
                </button>
            </div>

            {showAdd && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-medium text-purple-700">New Leave Type</p>
                    <input
                        placeholder="e.g. Paternity Leave"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <input
                        placeholder="Description (optional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAdd} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm">Save</button>
                        <button onClick={() => setShowAdd(false)} className="flex-1 border text-gray-500 py-2 rounded-lg text-sm">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {types.map((t) => (
                    <div key={t.id} className="bg-white rounded-xl border px-4 py-3">
                        <p className="font-medium text-gray-800">{t.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.description || "Allocations defined per policy"}</p>
                    </div>
                ))}
                {types.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">
                        No leave types configured
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveSection;