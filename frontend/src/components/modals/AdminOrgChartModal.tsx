import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getOrgTree } from "../../api/managementApi";
import { getAvatarGradient } from "../../utils/avatar";
import Loader from "../common/Loader";
import { X, Network, Plus, Minus } from "lucide-react";

interface AdminOrgChartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TreeNodeProps {
    node: any;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isExpanded && node.has_children && children.length === 0) {
            setLoading(true);
            try {
                const res = await getOrgTree(node.id);
                setChildren(res.data.data);
            } catch (err) {
                console.error("Failed to load children", err);
            } finally {
                setLoading(false);
            }
        }
        setIsExpanded(!isExpanded);
    };

    const initials = node.name 
        ? node.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() 
        : "?";

    const getRoleStyles = (roleName: string) => {
        const r = roleName?.toLowerCase() || "";
        if (r.includes("admin")) return "bg-rose-50 text-rose-600 border-rose-100";
        if (r.includes("manager")) return "bg-blue-50 text-blue-600 border-blue-100";
        return "bg-slate-50 text-slate-600 border-slate-100";
    };

    const hasChildren = isExpanded && children.length > 0;

    return (
        <div className="flex flex-col items-center flex-1">
            <div className="flex flex-col items-center relative">
                <div 
                    onClick={() => {
                        // In a portal, navigate might need a full page reload or proper routing context
                        // But since it's a SPA with React Router, it should work if the portal is within the Router tree
                        window.location.href = `/employees/${node.id}`;
                    }}
                    className="bg-white border border-gray-100 rounded-2xl p-2 shadow-sm hover:shadow-md hover:border-primary-light hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 w-38 group relative flex flex-col items-center text-center cursor-pointer select-none z-10"
                >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${getAvatarGradient(node.id)} text-white font-bold text-xs flex items-center justify-center shadow-sm mb-1.5`}>
                        {initials}
                    </div>

                    <p className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors truncate w-full">{node.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium mb-1.5 truncate w-full">{node.email}</p>

                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getRoleStyles(node.role)}`}>
                            {node.role}
                        </span>
                    </div>

                    {node.has_children && (
                        <button 
                            onClick={handleToggle}
                            className={`absolute -bottom-2.5 w-6 h-6 rounded-full border shadow-sm flex items-center justify-center transition-all z-20 hover:scale-110 ${
                                isExpanded ? "bg-slate-800 text-white border-slate-800" : "bg-white text-primary border-primary-light hover:bg-primary-light hover:text-white"
                            }`}
                        >
                            {loading ? (
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : isExpanded ? (
                                <Minus size={12} strokeWidth={3} />
                            ) : (
                                <Plus size={12} strokeWidth={3} />
                            )}
                        </button>
                    )}
                </div>

                {hasChildren && (
                    <div className="w-0.5 h-6 bg-slate-300 -mt-0.5" />
                )}
            </div>

            {hasChildren && (
                <div className="flex relative">
                    {children.map((child: any, index: number) => {
                        const isFirst = index === 0;
                        const isLast = index === children.length - 1;
                        return (
                            <div key={child.id} className="relative flex flex-col items-center flex-1 px-4">
                                {children.length > 1 && (
                                    <div className="absolute top-0 left-0 right-0 flex">
                                        <div className={`flex-1 h-0.5 ${isFirst ? "bg-transparent" : "bg-slate-300"}`} />
                                        <div className={`flex-1 h-0.5 ${isLast ? "bg-transparent" : "bg-slate-300"}`} />
                                    </div>
                                )}
                                <div className="w-0.5 h-6 bg-slate-300 relative z-0" />
                                <TreeNode node={child} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AdminOrgChartModal: React.FC<AdminOrgChartModalProps> = ({ isOpen, onClose }) => {
    const [roots, setRoots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRoots = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getOrgTree();
            setRoots(res.data.data);
        } catch (err) {
            console.error("Failed to load roots", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadRoots();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, loadRoots]);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-auto">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
                onClick={onClose} 
            />

            <div className="relative bg-white w-full max-w-7xl h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
                            <Network size={24} className="stroke-[2.5px]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Organization Hierarchy</h2>
                            <p className="text-sm text-gray-400 font-medium">Explore company reporting structure</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-8 bg-[#fafafa] relative">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader />
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse">Building the tree...</p>
                        </div>
                    ) : roots.length > 0 ? (
                        <div className="flex flex-col items-center space-y-6 min-w-[max-content] pb-20">
                            {/* Dash-border container style exactly like OrgChartModal */}
                            <div className="p-10 rounded-[3rem] border-2 border-dashed border-slate-200 bg-white shadow-inner flex flex-col items-center gap-12">
                                {roots.map((root: any, index: number) => (
                                    <div key={root.id} className="flex flex-col items-center">
                                        <TreeNode node={root} />
                                        {index < roots.length - 1 && (
                                            <div className="h-10 border-l-2 border-dashed border-gray-200 mt-10" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <p className="text-sm font-medium">No corporate hierarchy data found.</p>
                        </div>
                    )}
                </div>

                {/* Footer - Identical to OrgChartModal */}
                <div className="px-8 py-4 bg-white border-t border-gray-100 flex items-center justify-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Interactive View
                    </div>
                    <span className="text-gray-200">|</span>
                    <p className="text-[10px] text-gray-400 font-medium italic">Click cards to view full profiles</p>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AdminOrgChartModal;
