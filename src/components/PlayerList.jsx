import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import PlayerProfileModal from "./PlayerProfileModal"; // 👈 make sure this file exists

function PlayerList() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        const q = query(
            collection(db, "players"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setPlayers(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getInitials = (name = "") =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

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
                        <th className="border px-4 py-2 text-left">Player</th>
                        <th className="border px-4 py-2 text-left">Mobile</th>
                        <th className="border px-4 py-2 text-left">Category</th>
                    </tr>
                </thead>

                <tbody>
                    {players.map((player, index) => (
                        <tr
                            key={player.id}
                            onClick={() => setSelectedPlayer(player)}
                            className="hover:bg-slate-50 transition cursor-pointer"
                        >
                            <td className="border px-4 py-2">{index + 1}</td>

                            {/* Avatar + Name */}
                            <td className="border px-4 py-2">
                                <div className="flex items-center gap-3">
                                    {player.photoURL ? (
                                        <img
                                            src={player.photoURL}
                                            alt={player.name}
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                                            {getInitials(player.name)}
                                        </div>
                                    )}
                                    <span className="font-medium text-slate-800">
                                        {player.name}
                                    </span>
                                </div>
                            </td>

                            <td className="border px-4 py-2">{player.mobile}</td>
                            <td className="border px-4 py-2">
                                {player.category || "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 🔥 PLAYER PROFILE POPUP */}
            {selectedPlayer && (
                <PlayerProfileModal
                    player={selectedPlayer}
                    onClose={() => setSelectedPlayer(null)}
                />
            )}
        </div>
    );
}

export default PlayerList;
