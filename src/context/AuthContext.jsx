import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    doc,
    onSnapshot,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeRole = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);

                const userRef = doc(db, "users", user.uid);

                // 🔥 Ensure user document exists (important fix)
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        name: user.displayName || "",
                        email: user.email,
                        role: "player", // default role
                        createdAt: serverTimestamp()
                    });
                }

                // 🔥 Realtime Firestore role listener
                unsubscribeRole = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setRole(snapshot.data().role || "player");
                    } else {
                        setRole("player");
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