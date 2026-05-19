import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, LayoutDashboard, FileText, Settings, History, Calendar, Shield, Wallet,  Mail, ShieldCheck, ArrowUp, ArrowDown, CornerDownLeft } from "lucide-react";
import { searchUsers } from "../../api/managementApi";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const isAdmin = user?.role_id === 1;

    // Static Navigation Items - Restoring actual LMS content in the new style
    const navigationItems = [
        { label: "Dashboard", desc: "Overview of your leave status and stats.", path: isAdmin ? "/management" : "/dashboard", icon: LayoutDashboard, category: "Navigation" },
        { label: "Apply Leave", desc: "Submit a new request for time-off.", path: "/apply-leave", icon: FileText, category: "Actions", show: !isAdmin },
        { label: "Leave History", desc: "View all your past and pending requests.", path: "/leave-history", icon: History, category: "Navigation", show: !isAdmin },
        { label: "Leave Balance", desc: "Check your remaining leave quotas.", path: "/leave-balance", icon: Wallet, category: "Personal", show: !isAdmin },
        { label: "Employee Directory", desc: "Search and view colleague profiles.", path: "/employees", icon: Users, category: "Company" },
        { label: "Holiday Calendar", desc: "Upcoming public holidays and events.", path: "/holidays", icon: Calendar, category: "Navigation" },
        { label: "Leave Policies", desc: "View and manage company leave rules.", path: "/management/policies", icon: Shield, category: "Admin", show: isAdmin },
        { label: "Manage Invitations", desc: "Invite and onboard new employees.", path: "/management/invitations", icon: Mail, category: "Admin", show: isAdmin },
        { label: "Permissions", desc: "Configure role-based access control.", path: "/management/permissions", icon: ShieldCheck, category: "Admin", show: isAdmin },
        { label: "Profile Settings", desc: "Manage your personal account details.", path: "/profile", icon: Settings, category: "Personal" },
    ].filter(item => item.show !== false)

    const filteredNav = navigationItems.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase())
    );

    const fetchUsers = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await searchUsers(q);
            setResults(res.data.data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) fetchUsers(query);
            else setResults([]);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, fetchUsers]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query, results]);

    const handleSelect = (path: string) => {
        navigate(path);
        onClose();
        setQuery("");
    };

    interface SearchResult {
        label: string;
        path: string;
        icon: any;
        category: string;
        type: 'nav' | 'user';
        sub?: string;
        desc?: string;
    }

    const allResults: SearchResult[] = [
        ...filteredNav.map(item => ({ 
            label: item.label, 
            path: item.path, 
            icon: item.icon, 
            category: item.category, 
            desc: item.desc,
            type: 'nav' as const 
        })),
        ...results.map(u => ({ 
            label: u.name, 
            sub: `${u.role} • ${u.department || 'No Dept'}`,
            path: `/employees/${u.id}`, 
            icon: Users, 
            category: "Employees",
            type: 'user' as const
        }))
    ];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % allResults.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
            } else if (e.key === "Enter" && allResults[selectedIndex]) {
                e.preventDefault();
                handleSelect(allResults[selectedIndex].path);
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line
    }, [isOpen,allResults , selectedIndex, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] px-4">
            <div 
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] animate-in fade-in duration-200" 
                onClick={onClose} 
            />
            
            <div className="relative w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-200">
                {/* Search Input Area */}
                <div className="flex items-center px-8 pt-6 pb-4">
                    <input
                        autoFocus
                        className="w-full text-2xl font-medium bg-transparent border-none focus:outline-none text-slate-400 placeholder:text-slate-300 tracking-tight"
                        placeholder="Search any action or ask for help"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* Recent / Suggested Pills Row */}
                {!query && (
                    <div className="px-8 flex items-center gap-3 mb-6">
                        <History size={20} className="text-slate-400 mr-1" />
                        <button onClick={() => handleSelect("/apply-leave")} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                            Apply Leave
                        </button>
                        <button onClick={() => handleSelect("/leave-balance")} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                            My Leave Balance
                        </button>
                        <button onClick={() => handleSelect("/employees")} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-full text-sm font-medium hover:bg-slate-200 transition-colors">
                            Employee Directory
                        </button>
                    </div>
                )}

                {/* Section Title */}
                <div className="px-8 pb-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">
                    {allResults.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                            {allResults.map((item, index) => {
                                const Icon = item.icon;
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={`${item.type}-${item.path}-${index}`}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        onClick={() => handleSelect(item.path)}
                                        className={`flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all duration-200 text-left group
                                            ${isSelected ? "bg-[#f5f7f9] shadow-sm" : "hover:bg-slate-50 text-slate-700"}`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`${isSelected ? "text-primary" : "text-slate-400"}`}>
                                                <Icon size={22} className="stroke-[1.5px]" />
                                            </div>
                                            <div>
                                                <p className="text-base font-medium text-slate-700">
                                                    {item.label}
                                                </p>
                                                {(item.desc || item.sub) && (
                                                    <p className="text-sm text-slate-400 mt-0.5">
                                                        {item.desc || item.sub}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            {loading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Searching...</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Search size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No results found for "{query}"</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer - Matching image style */}
                <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end text-[13px] text-slate-400 font-medium tracking-tight">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            Navigate <span className="flex items-center gap-1"><kbd className="bg-white border p-1 rounded shadow-sm text-slate-500 flex items-center justify-center"><ArrowUp size={11} className="stroke-[2.5px]" /></kbd> <kbd className="bg-white border p-1 rounded shadow-sm text-slate-500 flex items-center justify-center"><ArrowDown size={11} className="stroke-[2.5px]" /></kbd></span>
                        </div>
                        <div className="flex items-center gap-2">
                            To select <kbd className="bg-white border px-1.5 py-0.5 rounded shadow-sm text-slate-500 flex items-center gap-1.5 text-[11px] font-bold">Enter <CornerDownLeft size={11} className="stroke-[2.5px]" /></kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
