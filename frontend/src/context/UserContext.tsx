import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types/user";
import { getuserdata } from "../api/leaveApi";
import { getCookie } from "../utils/cookies";
import { LiveUserContext } from "../components/common/ProtectedRoute";

interface UserCtx {
    user: User | null;
    loading: boolean;
}

const UserContext = createContext<UserCtx>({ user: null, loading: true });

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Start with whatever the cookie has (instant render, avoids flash)
        try {
            const raw = getCookie("user");
            if (raw) setUser(JSON.parse(raw));
        } catch {}

        // Then fetch fresh data (with latest permissions) from the server
        getuserdata()
            .then((res) => {
                if (res.data?.data) {
                    const freshUser = res.data.data;

                    // Merge: keep cookie fields not returned by the endpoint
                    const existingRaw = getCookie("user");
                    let merged = freshUser;
                    if (existingRaw) {
                        try {
                            merged = { ...JSON.parse(existingRaw), ...freshUser };
                        } catch {}
                    }

                    // Update cookie for other consumers
                    document.cookie = `user=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=604800; SameSite=Lax`;
                    setUser(merged);
                }
            })
            .catch((err) => console.error("Failed to refresh user data", err))
            .finally(() => setLoading(false));
    }, []);

    const value = { user, loading };

    return (
        <UserContext.Provider value={value}>
            {/* Also feed the ProtectedRoute's LiveUserContext */}
            <LiveUserContext.Provider value={value}>
                {children}
            </LiveUserContext.Provider>
        </UserContext.Provider>
    );
};
