import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { X } from "lucide-react";

type RawLeave = {
    id: number
    name: string
    leave_type: string
    from_date: string
    to_date: string
    duration_type: string
    reason?: string
}

const toDisplay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const DRAWER_FIELDS: { label: string; render: (l: RawLeave) => string }[] = [
    { label: "Leave Type", render: (l) => l.leave_type },
    { label: "Duration", render: (l) => l.duration_type === "half" ? "Half Day" : "Full Day" },
    { label: "From", render: (l) => toDisplay(l.from_date) },
    { label: "To", render: (l) => toDisplay(l.to_date) },
];

interface TeamViewModalProps {
    selectedLeave: RawLeave | null;
    onClose: () => void;
    hasTeamAccess: boolean;
}

const TeamViewModal: React.FC<TeamViewModalProps> = ({ selectedLeave, onClose, hasTeamAccess }) => {
    return (
        <Sheet open={!!selectedLeave} onOpenChange={(open) => { if (!open) onClose(); }}>
            <SheetContent className="overflow-y-auto sm:max-w-[540px] w-full p-0 flex flex-col border-l-0 shadow-2xl bg-white">
                {selectedLeave && (() => {
                    const name = selectedLeave.name;
                    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    return (
                        <>
                            <div className="px-6 py-8 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <SheetHeader className="text-left">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary-light flex-shrink-0">
                                                {initials}
                                            </div>
                                            <div className="min-w-0">
                                                <SheetTitle className="text-xl font-bold text-gray-900 truncate">{name}</SheetTitle>
                                                <SheetDescription className="text-sm font-medium text-gray-500 mt-0.5 truncate">
                                                    {selectedLeave.duration_type === "half" ? "Half Day Leave" : "Full Day Leave"} · {selectedLeave.leave_type}
                                                </SheetDescription>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </SheetHeader>
                            </div>

                            <div className="px-8 py-8 space-y-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4">
                                    {DRAWER_FIELDS.map(({ label, render }) => (
                                        <div key={label} className="bg-gray-50 rounded-2xl px-5 py-4 flex flex-col gap-1 transition-colors hover:bg-gray-100/70 border border-gray-100/50">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
                                            <span className="text-sm font-semibold text-gray-800">{render(selectedLeave)}</span>
                                        </div>
                                    ))}
                                </div>

                                {hasTeamAccess && selectedLeave.reason && (
                                    <div className="p-6 rounded-2xl bg-indigo-50/40 border border-indigo-100/50">
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">Reason for Leave</p>
                                        <p className="text-sm text-gray-700 leading-relaxed font-medium italic">"{selectedLeave.reason}"</p>
                                    </div>
                                )}
                            </div>
                        </>
                    );
                })()}
            </SheetContent>
        </Sheet>
    );
};

export default TeamViewModal;
