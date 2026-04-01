import React, { useEffect, useState } from "react";
import { getEmployees, deleteEmployee } from "../../api/adminApi";
import AddEmployeeModal from "./modal/AddEmployeeModal";
import EditEmployeeModal from "./modal/EditEmployeeModal";

// 🔹 Small reusable components
const RoleBadge = ({ role }: { role: string }) => {
    const styles =
        role === "admin"
            ? "bg-purple-100 text-purple-600"
            : role === "manager"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-200 text-gray-700";

    return (
        <span className={`text-xs px-2 py-1 rounded ${styles}`}>
            {role}
        </span>
    );
};

const EmployeeRow = ({ emp, onEdit, onDelete }: any) => (
    <div className="grid grid-cols-5 items-center px-4 py-3 border-t hover:bg-white">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 text-sm font-semibold">
                {emp.name[0]}
            </div>
            {emp.name}
        </div>

        <span className="text-sm text-gray-600">{emp.email}</span>
        <RoleBadge role={emp.role} />
        <span className="text-sm text-gray-600">{emp.manager_name || "—"}</span>

        <div className="flex gap-3 text-sm">
            <button onClick={() => onEdit(emp)} className="text-blue-500">Edit</button>
            <button onClick={() => onDelete(emp.id)} className="text-red-500">Delete</button>
        </div>
    </div>
);

const AdminEmployees = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const fetchEmployees = async () => {
        const res = await getEmployees();
        setEmployees(res.data.data || []);
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleDelete = async (id: number) => {
        await deleteEmployee(id);
        fetchEmployees();
    };

    const filtered = employees.filter(({ name, email }) =>
        `${name} ${email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border">

            {/* Header */}
            <div className="flex justify-between mb-6 gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Employees</h2>
                    <p className="text-sm text-gray-500">Manage your team</p>
                </div>

                <div className="flex gap-2">
                    <input
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm"
                    />
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                        + Add
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-5 text-xs font-semibold text-gray-500 px-4 py-3">
                    {["Name", "Email", "Role", "Manager", "Actions"].map((h) => (
                        <span key={h}>{h}</span>
                    ))}
                </div>

                {filtered.length ? (
                    filtered.map((emp) => (
                        <EmployeeRow
                            key={emp.id}
                            emp={emp}
                            onEdit={setSelectedUser}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div className="text-center py-6 text-gray-500">
                        No employees found
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <AddEmployeeModal
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchEmployees}
                />
            )}

            {selectedUser && (
                <EditEmployeeModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={fetchEmployees}
                />
            )}
        </div>
    );
};

export default AdminEmployees;