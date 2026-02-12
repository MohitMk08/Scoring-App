import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
} from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";

export default function Login() {

    const navigate = useNavigate();
    const [user] = useAuthState(auth);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    // 📧 Email Login
    const handleEmailLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);
            toast.loading("Logging in...", { id: "login" });

            await signInWithEmailAndPassword(auth, email, password);

            toast.success("Login successful ✅", { id: "login" });
            navigate("/");

        } catch (error) {
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password"
            ) {
                toast.error("Invalid email or password", { id: "login" });
            } else if (error.code === "auth/user-not-found") {
                toast.error("User not found", { id: "login" });
            } else {
                toast.error("Login failed. Try again.", { id: "login" });
            }
        } finally {
            setLoading(false);
        }
    };

    // 🔵 Google Login
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            toast.loading("Signing in with Google...", { id: "google" });

            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            toast.success("Login successful ✅", { id: "google" });
            navigate("/");

        } catch (error) {
            toast.error("Google login failed", { id: "google" });
        } finally {
            setLoading(false);
        }
    };

    // 🔑 Forgot Password
    const handleForgotPassword = async () => {
        if (!email) {
            toast.error("Please enter your email first");
            return;
        }

        try {
            toast.loading("Sending reset email...", { id: "reset" });

            await sendPasswordResetEmail(auth, email);

            toast.success("Password reset email sent 📧", { id: "reset" });

        } catch (error) {
            if (error.code === "auth/user-not-found") {
                toast.error("No account found with this email", { id: "reset" });
            } else {
                toast.error("Failed to send reset email", { id: "reset" });
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 to-blue-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
                    Login
                </h2>

                {/* Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 border py-2 rounded-lg hover:bg-gray-50 transition mb-6"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    Sign in with Google
                </button>

                <div className="text-center text-gray-400 mb-4">OR</div>

                {/* Email Login */}
                <form onSubmit={handleEmailLogin}>
                    <div className="mb-4">
                        <label className="text-sm text-gray-600">Email</label>
                        <input
                            type="email"
                            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="mb-2">
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
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 3l18 18M10.584 10.587A2 2 0 0114 12a2 2 0 01-3.416 1.413" />
                                    </svg>
                                ) : (
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

                    {/* Forgot Password */}
                    <div className="text-right mb-6">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition"
                    >
                        Login
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Don’t have an account?{" "}
                    <Link to="/register" className="text-blue-600 font-medium">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}
