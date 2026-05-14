import { createContext, useContext, useState, ReactNode, cloneElement, isValidElement } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogCtx>({ open: false, setOpen: () => {} });

export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) {
      onOpenChange(v);
    } else {
      setLocalOpen(v);
    }
  };

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { setOpen } = useContext(DialogContext);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(true) });
  }
  return <span onClick={() => setOpen(true)}>{children}</span>;
}

export function DialogClose({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
  const { setOpen } = useContext(DialogContext);
  if (asChild && isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, { onClick: () => setOpen(false) });
  }
  return <span onClick={() => setOpen(false)}>{children}</span>;
}

export function DialogContent({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useContext(DialogContext);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
      <div className={cn("relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-300", className)}>
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 space-y-1 pr-4", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-base font-semibold text-gray-900", className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-gray-500", className)}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex gap-3 mt-6", className)}>{children}</div>;
}
