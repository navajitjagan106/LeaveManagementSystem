import { useEffect, useState } from "react";
import { getHolidays } from "../../api/leaveApi";
import { addHoliday, updateHoliday, deleteHoliday } from "../../api/managementApi";
import { CalendarCheck, Trash2, Plus, Edit2 } from "lucide-react";
import PageHeader from "../common/PageHeader";
import Loader from "../common/Loader";
import { useToast } from "../common/ToastContext";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
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

const HolidaysPage = () => {
    const toast = useToast();
    const { user } = useSelector((state: RootState) => state.auth);
    const isAdmin = user?.role_id === 1;
    const canEdit = isAdmin || user?.permissions?.['manage_holidays']?.can_edit === true;
    const canDelete = isAdmin || user?.permissions?.['manage_holidays']?.can_delete === true;

    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<any | null>(null);

    const fetchHolidays = () => {
        getHolidays()
            .then((res) => setHolidays(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleSubmit = async () => {
        if (!name || !date) { toast.warning("Fill all fields"); return; }
        try {
            setSubmitting(true);
            if (editingHoliday) {
                await updateHoliday(editingHoliday.id, { name, date });
                toast.success("Holiday updated!");
            } else {
                await addHoliday({ name, date });
                toast.success("Holiday added!");
            }
            setName("");
            setDate("");
            setEditingHoliday(null);
            setIsDialogOpen(false);
            fetchHolidays();
        } catch {
            toast.error(editingHoliday ? "Failed to update holiday" : "Failed to add holiday");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try { await deleteHoliday(id); fetchHolidays(); toast.success("Holiday deleted"); }
        catch { toast.error("Failed to delete holiday"); }
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setName("");
            setDate("");
            setEditingHoliday(null);
        }
    };

    const today = new Date();
    const upcoming = holidays.filter((h) => new Date(h.date) >= today);
    const past = holidays.filter((h) => new Date(h.date) < today);

    const fmt = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", {
            weekday: "short", day: "numeric", month: "short", year: "numeric",
        });

    if (loading) return <div className="flex justify-center items-center h-48"><Loader /></div>;

    const HolidayRow = ({ h }: { h: any }) => (
        <div className="bg-white rounded-xl border p-4 flex items-center justify-between group hover:border-primary-light transition-colors">
            <div className="flex items-center gap-3">
                <div className="bg-primary-light text-primary-dark rounded-xl p-2">
                    <CalendarCheck size={16} />
                </div>
                <div>
                    <p className="font-medium text-gray-800 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-400">{fmt(h.date)}</p>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {canEdit && (
                    <button
                        onClick={() => {
                            setEditingHoliday(h);
                            setName(h.name);
                            setDate(h.date.split("T")[0]);
                            setIsDialogOpen(true);
                        }}
                        className="text-gray-300 group-hover:text-blue-500 transition p-1.5 rounded-lg hover:bg-blue-50 focus:outline-none"
                        title="Edit holiday"
                    >
                        <Edit2 size={14} />
                    </button>
                )}
                {canDelete && (
                    <button
                        onClick={() => handleDelete(h.id)}
                        className="text-gray-300 group-hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50 focus:outline-none"
                        title="Delete holiday"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Company Holidays"
                    subtitle={`${upcoming.length} upcoming holidays this year`}
                />
                {canEdit && (
                    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md active:scale-95 flex-shrink-0">
                                <Plus size={13} className="stroke-[3px]" /> Add Holiday
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{editingHoliday ? "Edit Holiday" : "Add New Holiday"}</DialogTitle>
                                <DialogDescription>
                                    {editingHoliday ? "Update the holiday details below." : "Enter the holiday details below."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Holiday Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Christmas"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="rounded-xl border-gray-200"
                                        maxLength={100}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="ghost" className="rounded-xl">Cancel</Button>
                                </DialogClose>
                                <Button 
                                    onClick={handleSubmit} 
                                    disabled={submitting} 
                                    className="bg-primary hover:bg-primary-dark text-white rounded-xl"
                                >
                                    {submitting ? (editingHoliday ? "Saving..." : "Adding...") : (editingHoliday ? "Save Changes" : "Add Holiday")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="h-px bg-gray-100 w-full mb-6"></div>

                {upcoming.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Upcoming
                        </p>
                        <div className="grid gap-2">
                            {upcoming.map((h) => <HolidayRow key={h.id ?? h.date} h={h} />)}
                        </div>
                    </div>
                )}

                {past.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Past
                        </p>
                        <div className="grid gap-2 opacity-50">
                            {past.map((h) => <HolidayRow key={h.id ?? h.date} h={h} />)}
                        </div>
                    </div>
                )}

                {holidays.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-100">
                        <img 
                            src="/empty.svg" 
                            className="w-36 h-36 mb-4 object-contain opacity-75 select-none" 
                            alt="No holidays" 
                        />
                        <p className="font-bold text-slate-800 text-base">No company holidays</p>
                        <p className="text-xs text-slate-400 mt-1">There are no holidays registered for this year yet.</p>
                    </div>
                )}
        </div>
    );
};

export default HolidaysPage;
