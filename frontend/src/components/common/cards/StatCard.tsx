import React from "react";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    accent?: string;
    bg?: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, accent = "#5746AF", bg = "#ede9fe" }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
            {Icon && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon size={18} style={{ color: accent }} />
                </div>
            )}
            <span className="text-xs font-medium uppercase tracking-widest text-gray-400">{label}</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

export default StatCard;
