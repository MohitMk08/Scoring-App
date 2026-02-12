import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    getAuth,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import toast from "react-hot-toast";

export default function Login() {
    const navigate = useNavigate();
    const auth = getAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // 🔵 Google Login
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            toast.loading("Signing in with Google...", { id: "google" });

            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            toast.success("Login successful ✅", { id: "google" });
            navigate("/players");
        } catch (error) {
            console.error(error);
            toast.error("Google login failed", { id: "google" });
        }
        setLoading(false);
    };

    // 📧 Email Login
    const handleEmailLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);
            toast.loading("Logging in...", { id: "email" });

            await signInWithEmailAndPassword(auth, email, password);

            toast.success("Login successful ✅", { id: "email" });
            navigate("/players");
        } catch (error) {
            console.error(error);
            toast.error("Invalid email or password", { id: "email" });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 to-blue-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
                    VolleyScorer Login
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
                    Continue with Google
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

                    <div className="mb-6">
                        <label className="text-sm text-gray-600">Password</label>
                        <input
                            type="password"
                            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
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
