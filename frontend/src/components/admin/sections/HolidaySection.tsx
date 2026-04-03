import { useEffect, useState } from "react";
import { getHolidays } from "../../../api/leaveApi";
import { addHoliday, deleteHoliday } from "../../../api/adminApi";

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
  const handleDelete = async (id: number) => {
    try {
      await deleteHoliday(id);
      fetchHolidays(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to delete holiday");
    }
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

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {holidays.map((h) => (
          <div
            key={h.id}
            className="flex justify-between items-center p-2 hover:bg-gray-100 rounded"
          >
            {/* Left */}
            <div>
              <span className="font-medium">{h.name}</span>
              <div className="text-sm text-gray-500">
                {new Date(h.date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>

            <button
              onClick={() => handleDelete(h.id)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidaySection;