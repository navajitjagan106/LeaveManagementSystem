import { useEffect, useState } from "react";
import { getLeaveTypes } from "../../../api/leaveApi";
import { addLeaveType } from "../../../api/adminApi";
import { Plus } from "lucide-react";
import { useToast } from "../../common/ToastContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Field, FieldGroup } from "../../ui/field";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const LeaveSection = () => {
    const toast = useToast();
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
                    <h2 className="text-xl font-semibold">Leave Types</h2>
                    <p className="text-sm text-gray-500">Categories used across all policies</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition">
                            <Plus size={14} /> Add Type
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Leave Type</DialogTitle>
                            <DialogDescription>Add a new category used across all policies.</DialogDescription>
                        </DialogHeader>
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="lt-name">Name</Label>
                                <Input
                                    id="lt-name"
                                    placeholder="e.g. Paternity Leave"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </Field>
                            <Field>
                                <Label htmlFor="lt-desc">Description (optional)</Label>
                                <Input
                                    id="lt-desc"
                                    placeholder="Short description"
                                    value={desc}
                                    onChange={(e) => setDesc(e.target.value)}
                                />
                            </Field>
                        </FieldGroup>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleAdd} disabled={loading}>
                                {loading ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
