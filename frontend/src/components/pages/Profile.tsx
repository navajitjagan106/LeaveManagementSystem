import React, { useEffect, useState } from "react";
import Card from "../cards/Card";
import { getUser } from "../../utils/getUser";
import { User } from "../../types";

const Profile: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);

   useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await getUser();
            setUser(res.data.data);
        } catch (err) {
            console.error("Failed to fetch user", err);
        }
    };

    fetchUser();
}, []);


    if (!user) {
        return <p className="text-center py-8">Loading profile...</p>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <p className="text-purple-100">{user.email}</p>
            </div>

            {/* Profile Details */}
            <Card>
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>

                <div className="space-y-4">

                    <div className="flex justify-between">
                        <span className="text-gray-500">Full Name</span>
                        <span className="font-medium">{user.name}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium">{user.email}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Role</span>
                        <span className="font-medium capitalize">{user.role}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Department</span>
                        <span className="font-medium">{user.department || "-"}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Manager</span>
                        <span className="font-medium">{user.manager_name || "N/A"}</span>
                    </div>

                </div>
            </Card>

        </div>
    );
};

export default Profile;