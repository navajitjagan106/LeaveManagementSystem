import { useEffect, useState } from "react";
import { getHolidays } from "../../../api/leaveApi";
import { addHoliday } from "../../../api/adminApi";

const HolidaySection = () => {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", date: "" });

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

  await addHoliday(form);
  setForm({ name: "", date: "" });
  fetchHolidays();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold">Holidays</h3>

        <button
          onClick={handleAdd}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
        >
          + Add
        </button>
      </div>

      {/* Inputs inline */}
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Holiday"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded flex-1"
        />

        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {holidays.map(h => (
          <div key={h.id} className="flex justify-between p-2 hover:bg-gray-100 rounded">

            <span>{h.name}</span>

            <span className="text-sm text-gray-500">
              {new Date(h.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidaySection;