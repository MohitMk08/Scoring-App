import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    getAuth,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import toast from "react-hot-toast";

export default function Register() {
    const navigate = useNavigate();
    const auth = getAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // 🔵 Google Register
    const handleGoogleRegister = async () => {
        try {
            setLoading(true);
            toast.loading("Signing up with Google...", { id: "google" });

            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);

            toast.success("Account created ✅", { id: "google" });
            navigate("/players");
        } catch (error) {
            console.error(error);
            toast.error("Google signup failed", { id: "google" });
        }
        setLoading(false);
    };

    // 📧 Email Register
    const handleRegister = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please fill all fields");
            return;
        }

        try {
            setLoading(true);
            toast.loading("Creating account...", { id: "email" });

            await createUserWithEmailAndPassword(auth, email, password);

            toast.success("Account created successfully ✅", { id: "email" });
            navigate("/players");
        } catch (error) {
            console.error(error);
            toast.error("Registration failed", { id: "email" });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-100 to-blue-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
                    Create Account
                </h2>

                {/* Google Register */}
                <button
                    onClick={handleGoogleRegister}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 border py-2 rounded-lg hover:bg-gray-50 transition mb-6"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    Sign up with Google
                </button>

                <div className="text-center text-gray-400 mb-4">OR</div>

                {/* Email Register */}
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
                        Register
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{" "}
                    <Link to="/Login" className="text-blue-600 font-medium">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
