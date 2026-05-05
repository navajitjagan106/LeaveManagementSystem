import { useEffect, useState } from "react";
import { getLeaveTypes } from "../../../api/leaveApi";
import { addLeaveType } from "../../../api/adminApi";
import { Plus } from "lucide-react";
import { useToast } from "../../common/ToastContext";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
    SheetTrigger,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { getUserLocal } from "../../../utils/getUser";

const LeaveSection = () => {
    const toast = useToast();
    const user = getUserLocal();
    const isAdmin = user?.role === 'admin';
    const canEdit = isAdmin || user?.permissions?.['admin_leave_types']?.can_edit === true;
    const [types, setTypes] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchTypes = async () => {
        const res = await getLeaveTypes();
        setTypes(res.data.data || []);
    };
    useEffect(() => { fetchTypes(); }, []);

    const handleAdd = async () => {
        if (!name.trim()) { toast.warning("Name is required"); return; }
        try {
            setLoading(true);
            await addLeaveType({ name: name.trim(), description: desc.trim() || undefined });
            setName("");
            setDesc("");
            fetchTypes();
            toast.success("Leave type added!");
        } catch {
            toast.error("Failed to add leave type");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Leave Types</h2>
                    <p className="text-sm text-gray-400">Categories used across all leave policies</p>
                </div>
                {canEdit && (
                    <Sheet>
                        <SheetTrigger asChild>
                            <button className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100">
                                <Plus size={14} /> Add Type
                            </button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                            <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <SheetHeader className="text-left">
                                    <SheetTitle className="text-xl font-bold text-gray-900">New Leave Type</SheetTitle>
                                    <SheetDescription className="text-sm font-medium text-gray-500 mt-1">
                                        Create a new leave category. This will be available for inclusion in all entitlement policies.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            <div className="px-8 py-8 flex-1 flex flex-col gap-8 overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="lt-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Type Name</Label>
                                        <Input
                                            id="lt-name"
                                            placeholder="e.g. Paternity Leave"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="rounded-xl border-gray-200 h-11"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="lt-desc" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description (Optional)</Label>
                                        <Input
                                            id="lt-desc"
                                            placeholder="e.g. Leave for new fathers"
                                            value={desc}
                                            onChange={(e) => setDesc(e.target.value)}
                                            className="rounded-xl border-gray-200 h-11"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                                <SheetFooter className="flex-row sm:justify-end gap-3">
                                    <SheetClose asChild>
                                        <Button variant="ghost" size="lg" className="flex-1 rounded-xl text-gray-500 font-medium">Cancel</Button>
                                    </SheetClose>
                                    <Button 
                                        onClick={handleAdd} 
                                        disabled={loading}
                                        size="lg"
                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-100 font-bold"
                                    >
                                        {loading ? "Saving..." : "Save Leave Type"}
                                    </Button>
                                </SheetFooter>
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
            </div>

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
