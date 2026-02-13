import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeRole = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);

                // 🔥 Realtime Firestore role listener
                const userRef = doc(db, "users", user.uid);

                unsubscribeRole = onSnapshot(userRef, (snapshot) => {
                    console.log("UID:", user.uid);
                    console.log("Exists:", snapshot.exists());
                    console.log("Data:", snapshot.data());

                    if (snapshot.exists()) {
                        setRole(snapshot.data().role || null);
                    } else {
                        setRole(null);
                    }
                });

            } else {
                setCurrentUser(null);
                setRole(null);

                if (unsubscribeRole) {
                    unsubscribeRole();
                    unsubscribeRole = null;
                }
            }

            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeRole) unsubscribeRole();
        };
    }, []);

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ currentUser, role, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
