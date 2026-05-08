import PageHeader from "../common/PageHeader";
import { useEffect, useState, useMemo } from "react";
import { getLeaveTypes } from "../../api/leaveApi";
import { addLeaveType, deleteLeaveType } from "../../api/managementApi";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "../common/ToastContext";
import { useAsync } from "../../hooks/useAsync";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const ManageLeaveTypesPage = () => {
    const toast = useToast();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role === 'admin';
    const canEdit = isAdmin || user?.permissions?.['manage_leave_types']?.can_edit === true;

    const { data: typesData, LoadingScreen, execute: fetchTypes } = useAsync(getLeaveTypes, true);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const types = useMemo(() => typesData?.data || [], [typesData]);

    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!name.trim()) { toast.warning("Name is required"); return; }
        try {
            setSubmitting(true);
            await addLeaveType({ name: name.trim(), description: desc.trim() || undefined });
            setName("");
            setDesc("");
            fetchTypes();
            toast.success("Leave type added!");
        } catch {
            toast.error("Failed to add leave type");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (id === 7) {
            toast.warning("Loss of Pay is the system's default fallback leave type and cannot be deleted.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this leave type? Past approved requests of this type will remain in history as 'Unknown Leave Type'. This action cannot be undone.")) {
            return;
        }

        try {
            await deleteLeaveType(id);
            fetchTypes();
            toast.success("Leave type deleted successfully!");
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete leave type");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 relative min-h-[400px]">
            <LoadingScreen />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <PageHeader title="Leave Categories" subtitle="Configure and manage corporate leave types" />
                    {/* Small cute Admin illustration next to title */}
                    <img 
                        src="/Admin-rafiki.svg" 
                        className="w-10 h-10 object-contain select-none opacity-85 hover:scale-110 transition-transform duration-300 hidden sm:block flex-shrink-0" 
                        alt="Admin Graphic" 
                    />
                </div>
                {canEdit && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 flex-shrink-0">
                                <Plus size={13} className="stroke-[3px]" /> Add Category
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-xl">
                            <DialogHeader className="text-left mb-4">
                                <DialogTitle className="text-xl font-bold text-gray-900">New Leave Category</DialogTitle>
                                <DialogDescription className="text-sm font-medium text-gray-500 mt-1">
                                    Create a new leave category. This will be available for inclusion in all entitlement policies.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 my-5">
                                <div className="space-y-2">
                                    <Label htmlFor="lt-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Type Name</Label>
                                    <Input
                                        id="lt-name"
                                        placeholder="e.g. Paternity Leave"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="rounded-xl border-gray-200 h-11 focus-visible:ring-primary-light"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lt-desc" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Description (Optional)</Label>
                                    <Input
                                        id="lt-desc"
                                        placeholder="e.g. Leave for new fathers"
                                        value={desc}
                                        onChange={(e) => setDesc(e.target.value)}
                                        className="rounded-xl border-gray-200 h-11 focus-visible:ring-primary-light"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="flex gap-3 mt-6">
                                <DialogClose asChild>
                                    <Button variant="outline" className="flex-1 rounded-xl text-gray-500 border-gray-200 font-medium h-11">Cancel</Button>
                                </DialogClose>
                                <Button
                                    onClick={handleAdd}
                                    disabled={submitting}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary-light font-bold h-11"
                                >
                                    {submitting ? "Saving..." : "Save Leave Category"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <hr className="border-gray-100" />

            <div className="grid gap-3">
                {types.map((t: any) => (
                    <div
                        key={t.id}
                        className="bg-white rounded-xl border border-gray-150 p-4 hover:shadow-sm hover:border-primary-light transition-all flex items-center justify-between group"
                    >
                        <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{t.name}</p>
                                {t.id === 7 && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-gray-400 bg-gray-100 tracking-wide uppercase select-none">
                                        Protected fallback
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 font-medium">{t.description || "No description provided for this leave category"}</p>
                        </div>
                        {canEdit && t.id !== 7 && (
                            <button
                                onClick={() => handleDelete(t.id)}
                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                title="Delete category"
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageLeaveTypesPage;
