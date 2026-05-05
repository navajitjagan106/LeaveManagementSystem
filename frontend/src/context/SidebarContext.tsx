import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarCtx {
    collapsed: boolean;
    toggle: () => void;
}

const SidebarContext = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} });

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [collapsed, setCollapsed] = useState(false);
    const toggle = () => setCollapsed((prev) => !prev);

    return (
        <SidebarContext.Provider value={{ collapsed, toggle }}>
            {children}
        </SidebarContext.Provider>
    );
};
