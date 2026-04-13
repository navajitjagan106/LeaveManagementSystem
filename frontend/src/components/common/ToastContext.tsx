import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "warning";

type Toast = {
    id: number;
    message: string;
    type: ToastType;
};

type ToastContextType = {
    toast: {
        success: (msg: string) => void;
        error: (msg: string) => void;
        warning: (msg: string) => void;
    };
};

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    }, []);

    const toast = {
        success: (msg: string) => addToast(msg, "success"),
        error: (msg: string) => addToast(msg, "error"),
        warning: (msg: string) => addToast(msg, "warning"),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* Toast container */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map((t) => (
                    <ToastItem key={t.id} toast={t} onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const STYLES: Record<ToastType, string> = {
    success: "bg-green-50 border-green-400 text-green-800",
    error: "bg-red-50 border-red-400 text-red-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
};

const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => (
    <div className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg border shadow-md text-sm min-w-[280px] ${STYLES[toast.type]}`}>
        <span>{toast.message}</span>
        <button onClick={onClose} className="font-bold opacity-60 hover:opacity-100">✕</button>
    </div>
);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx.toast;
};
