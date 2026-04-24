import React, { useEffect, useState } from "react";
import Card from "../common/cards/Card";
import PageHeader from "../common/PageHeader";
import { getuserdata } from "../../api/leaveApi";
import { User } from "../../types";

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        getuserdata()
            .then(res => setUser(res.data.data))
            .catch(err => console.error("Failed to fetch user", err));
    }, []);

    if (!user) return <p className="text-center py-8">Loading profile...</p>;

    const profileFields = [
        { label: "Full Name",     value: user.name },
        { label: "Email",         value: user.email },
        { label: "Leave Policy",  value: user.policy_name || "-" },
        { label: "Department",    value: user.department || "-" },
        { label: "Manager",       value: user.manager_name || "N/A" },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeader title="Profile" subtitle="View your personal and organisational details" />

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">{user.name}</h2>
                    <p className="text-purple-100 text-sm">{user.email}</p>
                </div>
                {user.policy_name && (
                    <div className="bg-white/20 px-4 py-1 rounded-full text-sm">
                        {user.policy_name}
                    </div>
                )}
            </div>

            <Card>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Profile Information</h3>
                <div className="divide-y">
                    {profileFields.map((field, index) => (
                        <div key={index} className="flex justify-between py-3 text-sm">
                            <span className="text-gray-500">{field.label}</span>
                            <span className="font-medium text-gray-800">{field.value}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default Profile;
