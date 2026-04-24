import { useEffect, useState } from "react";
import { getHolidays } from "../../../api/leaveApi";
import { addHoliday, deleteHoliday } from "../../../api/adminApi";
import { Trash2, Plus, CalendarCheck } from "lucide-react";
import { useToast } from "../../common/ToastContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Field, FieldGroup } from "../../ui/field";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const HolidaySection = () => {
  const toast = useToast();
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
      <button
        onClick={() => handleDelete(h.id)}
        className="text-gray-300 group-hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Holidays</h2>
          <p className="text-sm text-gray-400">{upcoming.length} upcoming this year</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-purple-700 transition">
              <Plus size={14} /> Add Holiday
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Holiday</DialogTitle>
              <DialogDescription>Add a public holiday to the calendar.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="h-name">Holiday name</Label>
                <Input
                  id="h-name"
                  placeholder="e.g. Republic Day"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="h-date">Date</Label>
                <Input
                  id="h-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAdd} disabled={loading}>
                {loading ? "Adding..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
