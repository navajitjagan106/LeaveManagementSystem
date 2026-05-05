import { useEffect, useState } from "react";
import { getHolidays } from "../../../api/leaveApi";
import { addHoliday, deleteHoliday } from "../../../api/adminApi";
import { Trash2, Plus, CalendarCheck } from "lucide-react";
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
import { useSelector } from "react-redux";
import { RootState } from "../../../store";

const HolidaySection = () => {
  const toast = useToast();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.permissions?.['admin_holidays']?.can_edit === true;
  const canDelete = isAdmin || user?.permissions?.['admin_holidays']?.can_delete === true;
  const [holidays, setHolidays] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHolidays = async () => {
    const res = await getHolidays();
    setHolidays(res.data);
  };
  useEffect(() => { fetchHolidays(); }, []);

  const handleAdd = async () => {
    if (!name || !date) { toast.warning("Fill all fields"); return; }
    try {
      setLoading(true);
      await addHoliday({ name, date });
      setName("");
      setDate("");
      fetchHolidays();
      toast.success("Holiday added!");
    } catch {
      toast.error("Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try { await deleteHoliday(id); fetchHolidays(); }
    catch { toast.error("Failed to delete holiday"); }
  };

  const upcoming = holidays.filter((h) => new Date(h.date) >= new Date());
  const past = holidays.filter((h) => new Date(h.date) < new Date());

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const HolidayRow = ({ h }: { h: any }) => (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className="bg-purple-100 text-purple-700 rounded-xl p-2">
          <CalendarCheck size={16} />
        </div>
        <div>
          <p className="font-medium text-gray-800 text-sm">{h.name}</p>
          <p className="text-xs text-gray-400">{fmt(h.date)}</p>
        </div>
      </div>
      {canDelete && (
        <button
          onClick={() => handleDelete(h.id)}
          className="text-gray-300 group-hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Holidays</h2>
          <p className="text-sm text-gray-400">{upcoming.length} upcoming this year</p>
        </div>
        {canEdit && (
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-100">
                <Plus size={14} /> Add Holiday
              </button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
              <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-xl font-bold text-gray-900">New Holiday</SheetTitle>
                  <SheetDescription className="text-sm font-medium text-gray-500 mt-1">
                    Add a public holiday to the company calendar. This will be visible to all employees.
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="px-8 py-8 flex-1 flex flex-col gap-8 overflow-y-auto">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="h-name" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Holiday Name</Label>
                    <Input
                      id="h-name"
                      placeholder="e.g. Republic Day"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl border-gray-200 h-11"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="h-date" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Date</Label>
                    <Input
                      id="h-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
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
                    {loading ? "Adding..." : "Add Holiday"}
                  </Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
          <div className="grid gap-2">
            {upcoming.map((h) => <HolidayRow key={h.id} h={h} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</p>
          <div className="grid gap-2 opacity-50">
            {past.map((h) => <HolidayRow key={h.id} h={h} />)}
          </div>
        </div>
      )}

      {holidays.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border">
          No holidays added yet
        </div>
      )}
    </div>
  );
};

export default HolidaySection;
