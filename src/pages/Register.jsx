import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";

export default function Register() {

    const navigate = useNavigate();
    const [user] = useAuthState(auth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);
            toast.loading("Creating account...", { id: "email" });

            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            // ✅ Create user document with default role
            await setDoc(doc(db, "users", userCredential.user.uid), {
                email: email,
                role: "player",
                createdAt: new Date(),
            });

            await auth.signOut();

            toast.success("Account created successfully ✅", { id: "email" });

            navigate("/login");
        } catch (error) {
            console.error(error);
            toast.error(
                "Registration failed, Already registered email Try to login",
                { id: "email" }
            );
        }

        setLoading(false);
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 to-blue-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
                    Create Account
                </h2>

                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label className="text-sm text-gray-600">Email</label>
                        <input
                            type="email"
                            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Password with Eye Icon */}
                    <div className="mb-6">
                        <label className="text-sm text-gray-600">Password</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                            >
                                {showPassword ? (
                                    // Eye Off
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7 0-1.057.404-2.087 1.125-3M6.223 6.223A9.956 9.956 0 0112 5c5 0 9 4 9 7 0 1.057-.404 2.087-1.125 3M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                                    </svg>
                                ) : (
                                    // Eye
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition"
                    >
                        Register
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{" "}
                    <Link to="/login" className="text-blue-600 font-medium">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
