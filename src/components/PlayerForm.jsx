import { useState } from "react";
import { db } from "../firebase";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import toast from "react-hot-toast";

function PlayerForm() {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [category, setCategory] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!name || name.trim().length < 3) {
            newErrors.name = "Name must be at least 3 characters";
        }

        if (!/^\d{10}$/.test(mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
        }

        if (!category) {
            newErrors.category = "Please select player category";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Please fill all required fields");
        }

        return Object.keys(newErrors).length === 0;
    };

    const isMobileExists = async (mobile) => {
        const q = query(
            collection(db, "players"),
            where("mobile", "==", mobile)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        toast.loading("Saving player...", { id: "player-form" });

        try {
            const exists = await isMobileExists(mobile);

            if (exists) {
                setErrors({ mobile: "Mobile number already registered" });
                toast.error("Mobile number already registered", {
                    id: "player-form",
                });
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "players"), {
                name: name.trim(),
                mobile,
                category,
                profilePic: null, // Image disabled for now
                createdAt: new Date(),
            });

            // Reset form
            setName("");
            setMobile("");
            setCategory("");
            setErrors({});

            toast.success("Player registered successfully ✅", {
                id: "player-form",
            });
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong", {
                id: "player-form",
            });
        }

        setLoading(false);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full"
        >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Player Registration
            </h2>

            {/* Name */}
            <div className="mb-4">
                <label className="text-sm text-slate-600">
                    Player Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 ${errors.name
                        ? "border-red-500 focus:ring-red-300"
                        : "focus:ring-blue-400"
                        }`}
                />
                {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
            </div>

            {/* Mobile */}
            <div className="mb-4">
                <label className="text-sm text-slate-600">
                    Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 ${errors.mobile
                        ? "border-red-500 focus:ring-red-300"
                        : "focus:ring-blue-400"
                        }`}
                />
                {errors.mobile && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.mobile}
                    </p>
                )}
            </div>

            {/* Category */}
            <div className="mb-6">
                <label className="text-sm text-slate-600">
                    Player Category <span className="text-red-500">*</span>
                </label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 ${errors.category
                        ? "border-red-500 focus:ring-red-300"
                        : "focus:ring-blue-400"
                        }`}
                >
                    <option value="">Select role</option>
                    <option value="Smasher">Smasher</option>
                    <option value="Defender">Defender</option>
                    <option value="Setter">Setter</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Blocker">Blocker</option>
                    <option value="Service-Ace">Service Ace</option>
                    <option value="Libero">Libero</option>
                </select>
                {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.category}
                    </p>
                )}
            </div>

            <button
                disabled={loading}
                className={`w-full py-2 rounded-lg text-white font-medium transition ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {loading ? "Saving..." : "Save Player"}
            </button>
        </form>
    );
}

export default PlayerForm;
