import { useEffect, useState } from "react";
import { getEmployees } from "../../api/adminApi";
import InviteEmployeeModal from "./modal/InviteEmployeeModal";
import EmployeeDetailsModal from "./modal/EmployeeDetailModal";

const ROLE_STYLES: Record<string, string> = {
    admin: "bg-purple-100 text-purple-600",
    manager: "bg-blue-100 text-blue-600",
    employee: "bg-gray-100 text-gray-600",
};

const RoleBadge = ({ role }: { role: string }) => (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[role] ?? "bg-gray-100 text-gray-600"}`}>
        {role}
    </span>
);

const EmployeeCard = ({ emp, onEdit }: any) => (
    <div className="bg-white border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:border-purple-200 transition">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-semibold text-sm shrink-0">
                    {emp.name[0].toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{emp.name}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[160px]">{emp.email}</p>
                </div>
            </div>
            <button
                onClick={() => onEdit(emp)}
                className="text-gray-400 hover:text-purple-600 hover:bg-purple-50 p-1.5 rounded-lg transition text-xs"
                title="Edit"
            >
                ···
            </button>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <RoleBadge role={emp.role} />
            <span className="text-xs text-gray-400">
                {emp.manager_name ? `Reports to ${emp.manager_name}` : "No manager"}
            </span>
        </div>
    </div>
);

const AdminEmployees = () => {
    const [employees, setEmployees] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const fetchEmployees = async () => {
        const res = await getEmployees();
        setEmployees(res.data.data || []);
    };

    useEffect(() => { fetchEmployees(); }, []);

    const filtered = employees.filter(({ name, email }) =>
        `${name} ${email}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h2 className="text-xl font-semibold">Employees</h2>
                    <p className="text-sm text-gray-500">{employees.length} team members</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-3 py-2 rounded-lg text-sm min-w-[200px]"
                    />
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="border border-purple-600 text-purple-600 px-4 py-2 rounded-lg text-sm hover:bg-purple-50 transition"
                    >
                        + Invite
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">No employees found</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((emp) => (
                        <EmployeeCard key={emp.id} emp={emp} onEdit={setSelectedUser} />
                    ))}
                </div>
            )}

            {selectedUser && (
                <EmployeeDetailsModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSuccess={fetchEmployees}
                />
            )}
            {showInviteModal && (
                <InviteEmployeeModal
                    onClose={() => setShowInviteModal(false)}
                    onSuccess={fetchEmployees}
                />
            )}
        </div>
    );
};

export default AdminEmployees;
