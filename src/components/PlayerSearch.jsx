import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function PlayerSearch() {
    const [mobile, setMobile] = useState("");
    const [player, setPlayer] = useState(null);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        setError("");
        setPlayer(null);

        if (!/^\d{10}$/.test(mobile)) {
            setError("Enter valid 10 digit mobile number");
            return;
        }

        const q = query(
            collection(db, "players"),
            where("mobile", "==", mobile)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            setError("Player not found");
            return;
        }

        setPlayer(snapshot.docs[0].data());
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
                Search Player
            </h2>

            <input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-2 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-400"
            />

            <button
                onClick={handleSearch}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
                Search
            </button>

            {error && <p className="text-red-500 mt-3">{error}</p>}

            {player && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p><strong>Name:</strong> {player.name}</p>
                    <p><strong>Mobile:</strong> {player.mobile}</p>
                    <p><strong>Age:</strong> {player.age || "N/A"}</p>
                </div>
            )}
        </div>
    );
}

export default PlayerSearch;
