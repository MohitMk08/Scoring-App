import { useState } from "react";
import { db } from "../firebase";
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
} from "firebase/firestore";


function PlayerForm() {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [age, setAge] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!name || name.length < 3) {
            newErrors.name = "Name must be at least 3 characters";
        }

        if (!/^\d{10}$/.test(mobile)) {
            newErrors.mobile = "Mobile number must be 10 digits";
        }

        if (age && (age < 10 || age > 60)) {
            newErrors.age = "Age must be between 10 and 60";
        }

        setErrors(newErrors);
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

        try {
            const exists = await isMobileExists(mobile);

            if (exists) {
                setErrors({ mobile: "Mobile number already registered" });
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "players"), {
                name,
                mobile,
                age,
                createdAt: new Date(),
            });

            setName("");
            setMobile("");
            setAge("");
            setErrors({});
            alert("Player registered successfully ✅");
        } catch (err) {
            alert("Something went wrong");
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
                <label className="text-sm text-slate-600">Player Name</label>
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
                <label className="text-sm text-slate-600">Mobile Number</label>
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
                    <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                )}
            </div>

            {/* Age */}
            <div className="mb-6">
                <label className="text-sm text-slate-600">Age</label>
                <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`w-full p-2 border rounded-lg focus:ring-2 ${errors.age
                        ? "border-red-500 focus:ring-red-300"
                        : "focus:ring-blue-400"
                        }`}
                />
                {errors.age && (
                    <p className="text-red-500 text-sm mt-1">{errors.age}</p>
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
