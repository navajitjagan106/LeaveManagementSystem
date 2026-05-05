import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types/user";
import { getMe } from "../api/authApi";

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
        // Fetch everything in one go from our optimized /me endpoint
        getMe()
            .then((res) => {
                if (res.data?.success) {
                    setUser(res.data.data);
                }
            })
            .catch((err) => {
                console.error("Initial user fetch failed", err);
                // On failure (e.g., 401), user stays null which triggers redirect to login
            })
            .finally(() => setLoading(false));
    }, []);

    const value = { user, loading };

    return (
        <UserContext.Provider value={value}>
                {children}
        </UserContext.Provider>
    );
};
