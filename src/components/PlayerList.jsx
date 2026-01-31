import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

function PlayerList() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "players"),
            orderBy("createdAt", "desc")
        );

        // 🔥 Real-time listener
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPlayers(list);
            setLoading(false);
        });

        // 🧹 Cleanup listener
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <p className="text-slate-500">Loading players...</p>
            </div>
        );
    }

    if (players.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <p className="text-slate-500">No players registered yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto">
            <h2 className="text-xl font-bold mb-4 text-slate-800">
                Registered Players
            </h2>

            <table className="min-w-full border rounded-lg overflow-hidden">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="border px-4 py-2 text-left">#</th>
                        <th className="border px-4 py-2 text-left">Name</th>
                        <th className="border px-4 py-2 text-left">Mobile</th>
                        <th className="border px-4 py-2 text-left">Age</th>
                    </tr>
                </thead>

                <tbody>
                    {players.map((player, index) => (
                        <tr
                            key={player.id}
                            className="hover:bg-slate-50 transition"
                        >
                            <td className="border px-4 py-2">{index + 1}</td>
                            <td className="border px-4 py-2 font-medium">
                                {player.name}
                            </td>
                            <td className="border px-4 py-2">{player.mobile}</td>
                            <td className="border px-4 py-2">
                                {player.age || "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default PlayerList;
