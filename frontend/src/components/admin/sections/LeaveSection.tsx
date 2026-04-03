import { useEffect, useState } from "react";
import { getLeaveTypes } from "../../../api/leaveApi";
import { updateLeaveType, addLeaveType } from "../../../api/adminApi";

const LeaveSection = () => {
    const [types, setTypes] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newType, setNewType] = useState({
        name: "",
        max_days: 0
    });
    const fetchTypes = async () => {
        const res = await getLeaveTypes();
        setTypes(res.data.data);
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between mb-4">
                <h3 className="font-semibold">Leave Types</h3>
                <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm"
                    onClick={() => setShowAdd(!showAdd)}>+ Add</button>
            </div>
            {showAdd && (
                <div className="flex gap-2 mb-3">
                    <input
                        placeholder="Type name"
                        value={newType.name}
                        onChange={(e) =>
                            setNewType({ ...newType, name: e.target.value })
                        }
                        className="border p-2 rounded"
                    />

                    <input
                        type="number"
                        placeholder="Days"
                        value={newType.max_days}
                        onChange={(e) =>
                            setNewType({
                                ...newType,
                                max_days: Number(e.target.value)
                            })
                        }
                        className="border p-2 rounded w-20"
                    />

                    <button
                        onClick={async () => {
                            await addLeaveType(newType);
                            setShowAdd(false);
                            setNewType({ name: "", max_days: 0 });
                            fetchTypes();
                        }}
                        className="bg-purple-600 text-white px-3 rounded"
                    >
                        Save
                    </button>
                </div>
            )}

            <div className="space-y-3">
                {types.map(t => (
                    <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">

                        <span>{t.name}</span>

                        {editingId === t.id ? (
                            <input
                                type="number"
                                defaultValue={t.max_days}
                                onBlur={(e) => {
                                    updateLeaveType(t.id, Number(e.target.value));
                                    setEditingId(null);
                                }}
                                className="border px-2 py-1 rounded w-20"
                            />
                        ) : (
                            <span
                                onClick={() => setEditingId(t.id)}
                                className="cursor-pointer text-purple-600 font-medium"
                            >
                                {t.max_days} days
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>

    );
};
export default LeaveSection;