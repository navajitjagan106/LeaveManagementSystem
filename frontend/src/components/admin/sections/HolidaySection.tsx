import { useEffect, useState } from "react";
import { getHolidays } from "../../../api/leaveApi";
import { addHoliday, deleteHoliday } from "../../../api/adminApi";
import { Trash2, Plus, CalendarCheck } from "lucide-react";
import { useToast } from "../../common/ToastContext";

const HolidaySection = () => {
  const toast = useToast();
  const [holidays, setHolidays] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", date: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchHolidays = async () => {
    const res = await getHolidays();
    setHolidays(res.data);
  };
  useEffect(() => { fetchHolidays(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.date) { toast.warning("Fill all fields"); return; }
    try {
      setLoading(true);
      await addHoliday(form);
      setForm({ name: "", date: "" });
      setShowForm(false);
      fetchHolidays();
    } catch { toast.error("Failed to add holiday"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    try { await deleteHoliday(id); fetchHolidays(); }
    catch { toast.error("Failed to delete holiday"); }
  };

  const upcoming = holidays.filter((h) => new Date(h.date) >= new Date());
  const past = holidays.filter((h) => new Date(h.date) < new Date());

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Holidays</h2>
          <p className="text-sm text-gray-400">{upcoming.length} upcoming this year</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm"
        >
          <Plus size={14} /> Add Holiday
        </button>
      </div>

      {showForm && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-purple-700">New Holiday</p>
          <input
            placeholder="Holiday name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <input
            type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">
              {loading ? "Adding..." : "Confirm"}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ name: "", date: "" }); }}
              className="flex-1 border text-gray-500 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming</p>
          <div className="grid gap-2">
            {upcoming.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border p-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-700 rounded-xl p-2">
                    <CalendarCheck size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-400">{fmt(h.date)}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(h.id)} className="text-gray-300 group-hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</p>
          <div className="grid gap-2 opacity-50">
            {past.map((h) => (
              <div key={h.id} className="bg-white rounded-xl border p-4 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 text-gray-400 rounded-xl p-2">
                    <CalendarCheck size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{h.name}</p>
                    <p className="text-xs text-gray-400">{fmt(h.date)}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(h.id)} className="text-gray-300 group-hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
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
