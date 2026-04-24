import { createContext, useContext, useState, ReactNode, cloneElement, isValidElement } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DialogCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DialogContext = createContext<DialogCtx>({ open: false, setOpen: () => {} });

export function Dialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className={cn("relative bg-white rounded-2xl shadow-xl p-6 w-full mx-4 max-w-sm", className)}>
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

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4 space-y-1 pr-4">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-gray-900">{children}</h2>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-500">{children}</p>;
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 mt-6">{children}</div>;
}
