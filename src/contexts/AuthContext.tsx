import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth } from "../config/firebase-config";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
    children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = useMemo(
        () => ({
            user,
            loading,
        }),
        [user, loading],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
