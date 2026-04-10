import { useEffect, useState } from "react";
import { getHolidays } from "../../../api/leaveApi";
import { addHoliday, deleteHoliday } from "../../../api/adminApi";
import { Trash2, Plus } from "lucide-react";

const HolidaySection = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", date: "" });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchHolidays = async () => {
    const res = await getHolidays();
    setHolidays(res.data);
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.date) {
      alert("Fill all fields");
      return;
    }
    try {
      setLoading(true);
      await addHoliday(form);
      setForm({ name: "", date: "" });
      setShowForm(false);
      fetchHolidays();
    } catch {
      alert("Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHoliday(id);
      fetchHolidays();
    } catch {
      alert("Failed to delete holiday");
    }
  };

  const upcoming = holidays.filter(h => new Date(h.date) >= new Date());
  const past = holidays.filter(h => new Date(h.date) < new Date());

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold">Holidays</h3>
          <p className="text-xs text-gray-400">{upcoming.length} upcoming</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          <Plus size={14} />
          Add Holiday
        </button>
      </div>

      {showForm && (
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-4 space-y-3">
          <p className="text-sm font-medium text-purple-700">New Holiday</p>
          <input
            placeholder="Holiday name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? "Adding..." : "Confirm"}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ name: "", date: "" }); }}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
        {upcoming.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Upcoming</p>
            <div className="space-y-1">
              {upcoming.map((h) => (
                <HolidayRow key={h.id} holiday={h} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Past</p>
            <div className="space-y-1 opacity-50">
              {past.map((h) => (
                <HolidayRow key={h.id} holiday={h} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HolidayRow = ({ holiday, onDelete }: { holiday: any; onDelete: (id: number) => void }) => (
  <div className="flex justify-between items-center p-2.5 hover:bg-gray-50 rounded-lg group">
    <div className="flex items-center gap-3">
      <div className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-md w-12 text-center">
        {new Date(holiday.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </div>
      <span className="text-sm font-medium text-gray-800">{holiday.name}</span>
    </div>
    <button
      onClick={() => onDelete(holiday.id)}
      className="text-gray-300 group-hover:text-red-500 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  </div>
);

export default HolidaySection;