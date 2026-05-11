import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Manager = { id: number; name: string; department?: string | null; role?: string };

type Props = {
    value: number | "";
    onChange: (id: number | "") => void;
    managers: Manager[];
    placeholder?: string;
    className?: string;
    changed?: boolean;
};

export function ManagerCombobox({ value, onChange, managers, placeholder = "No manager", className, changed }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selected = value !== "" ? managers.find((m) => m.id === value) ?? null : null;

    const filtered = managers.filter((m) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return m.name.toLowerCase().includes(q) || (m.role ?? "").toLowerCase().includes(q);
    });

    const select = (id: number | "") => {
        onChange(id);
        setOpen(false);
        setQuery("");
    };

    return (
        <div className={cn("relative", className)}>
            <div className={cn(
                "flex items-center gap-2 w-full border rounded-xl px-3 py-2 text-sm transition-colors",
                changed ? "border-primary-light bg-primary-light" : "border-gray-200 bg-white",
                open && "ring-2 ring-primary-light border-primary-light"
            )}>
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                    value={open ? query : (selected?.name ?? "")}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { setOpen(true); setQuery(""); }}
                    onBlur={() => { setOpen(false); setQuery(""); }}
                    placeholder={open ? "Search by name or role…" : placeholder}
                    className="flex-1 outline-none bg-transparent text-sm min-w-0 placeholder:text-gray-400"
                    readOnly={!open}
                />
                {selected && !open && (
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); select(""); }}
                        className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto">
                        <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); select(""); }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50",
                                value === "" && "bg-primary-light text-primary-dark font-medium"
                            )}
                        >
                            <span className="italic text-gray-400">No manager</span>
                        </button>
                        {filtered.length === 0 ? (
                            <div className="px-3 py-5 text-sm text-center text-gray-400">No matches</div>
                        ) : (
                            filtered.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); select(m.id); }}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2",
                                        value === m.id && "bg-primary-light text-primary-dark"
                                    )}
                                >
                                    <span className="font-medium truncate">{m.name}</span>
                                    <span className="text-xs text-gray-400 shrink-0 capitalize">{m.role || m.department}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
