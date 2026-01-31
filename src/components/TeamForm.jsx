import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    getDocs,
} from "firebase/firestore";

import { db } from "../firebase";

function TeamForm() {
    const [teamName, setTeamName] = useState("");
    const [captain, setCaptain] = useState("");
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [assignedPlayers, setAssignedPlayers] = useState({});


    // 🔄 Load players in real-time
    useEffect(() => {
        const q = query(
            collection(db, "players"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setPlayers(list);
        });

        return () => unsub();
    }, []);

    const togglePlayer = (id) => {
        setSelectedPlayers((prev) =>
            prev.includes(id)
                ? prev.filter((pid) => pid !== id)
                : [...prev, id]
        );
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "teams"), (snapshot) => {
            const assignedMap = {};

            snapshot.forEach((doc) => {
                const team = doc.data();
                const teamName = team.name;
                const playerIds = team.playerIds || [];

                playerIds.forEach((pid) => {
                    assignedMap[pid] = teamName;
                });
            });

            setAssignedPlayers(assignedMap);
        });

        return () => unsubscribe();
    }, []);


    const getPlayerTeamConflicts = async (selectedIds) => {
        const teamSnap = await getDocs(collection(db, "teams"));
        const conflicts = [];

        teamSnap.forEach((doc) => {
            const team = doc.data();
            const teamName = team.name;
            const existingPlayers = team.playerIds || [];

            selectedIds.forEach((pid) => {
                if (existingPlayers.includes(pid)) {
                    conflicts.push({
                        playerId: pid,
                        teamName,
                    });
                }
            });
        });

        return conflicts;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!teamName) {
            setError("Team name is required");
            return;
        }

        if (selectedPlayers.length < 6) {
            setError("Select at least 6 players");
            return;
        }

        setLoading(true);

        try {
            // 🔁 Create playerId → playerName map
            const playerMap = {};
            players.forEach((p) => {
                playerMap[p.id] = p.name;
            });

            // 🔍 Check conflicts
            const conflicts = await getPlayerTeamConflicts(selectedPlayers);

            if (conflicts.length > 0) {
                const message = conflicts
                    .map(
                        (c) => `${playerMap[c.playerId]} (Team ${c.teamName})`
                    )
                    .join(", ");

                setError(`Already assigned: ${message}`);
                setLoading(false);
                return;
            }

            // ✅ Save team
            await addDoc(collection(db, "teams"), {
                name: teamName,
                captain,
                playerIds: selectedPlayers,
                createdAt: new Date(),
            });

            setTeamName("");
            setCaptain("");
            setSelectedPlayers([]);
            alert("Team created successfully ✅");
        } catch (err) {
            setError("Failed to create team");
        }

        setLoading(false);
    };


    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-lg w-full"
        >
            <h2 className="text-2xl font-bold mb-6 text-slate-800">
                Create Team
            </h2>

            {/* Team Name */}
            <div className="mb-4">
                <label className="text-sm text-slate-600">Team Name</label>
                <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Captain */}
            <div className="mb-6">
                <label className="text-sm text-slate-600">Captain Name</label>
                <input
                    value={captain}
                    onChange={(e) => setCaptain(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* Player Selection */}
            <div className="mb-6">
                <p className="font-medium text-slate-700 mb-2">
                    Select Players ({selectedPlayers.length})
                </p>

                <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {players.map((player) => {
                        const isAssigned = assignedPlayers[player.id];

                        return (
                            <label
                                key={player.id}
                                className={`flex items-center gap-2 p-2 rounded border
        ${isAssigned
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "cursor-pointer hover:bg-blue-50"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    disabled={!!isAssigned}
                                    checked={selectedPlayers.includes(player.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedPlayers([...selectedPlayers, player.id]);
                                        } else {
                                            setSelectedPlayers(
                                                selectedPlayers.filter((id) => id !== player.id)
                                            );
                                        }
                                    }}
                                />

                                <span className="font-medium">{player.name}</span>

                                {isAssigned && (
                                    <span className="text-xs text-red-500 ml-auto">
                                        Already in {isAssigned}
                                    </span>
                                )}
                            </label>
                        );
                    })}

                </div>
            </div>

            {error && (
                <p className="text-red-600 mb-4 font-medium">
                    {error}
                </p>
            )}


            <button
                disabled={loading}
                className={`w-full py-2 rounded-lg text-white font-medium ${loading
                    ? "bg-gray-400"
                    : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {loading ? "Creating..." : "Create Team"}
            </button>
        </form>
    );
}

export default TeamForm;
