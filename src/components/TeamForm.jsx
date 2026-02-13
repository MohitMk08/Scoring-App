import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    getDocs,
} from "firebase/firestore";
import toast from "react-hot-toast";

import { db } from "../firebase";

function TeamForm() {
    const [teamName, setTeamName] = useState("");
    const [ownerId, setOwnerId] = useState("");
    const [captainId, setCaptainId] = useState("");
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [teamLogo, setTeamLogo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [assignedPlayers, setAssignedPlayers] = useState({});

    // 🔄 Load players
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

    // 🔄 Track assigned players
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

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setTeamLogo(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const getPlayerTeamConflicts = async (selectedIds) => {
        const teamSnap = await getDocs(collection(db, "teams"));
        const conflicts = [];

        teamSnap.forEach((doc) => {
            const team = doc.data();
            const teamName = team.name;
            const existingPlayers = team.playerIds || [];

            selectedIds.forEach((pid) => {
                if (existingPlayers.includes(pid)) {
                    conflicts.push({ playerId: pid, teamName });
                }
            });
        });

        return conflicts;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!teamName) {
            toast.error("Team name is required");
            return;
        }

        if (!ownerId) {
            toast.error("Team owner is required");
            return;
        }

        const finalPlayers = Array.from(
            new Set([...selectedPlayers, ownerId])
        );

        if (finalPlayers.length < 6) {
            toast.error("Team must have at least 6 players (owner included)");
            return;
        }

        setLoading(true);
        toast.loading("Creating team...", { id: "team-create" });

        try {
            const conflicts = await getPlayerTeamConflicts(finalPlayers);

            if (conflicts.length > 0) {
                toast.error(
                    "Some selected players are already in other teams",
                    { id: "team-create" }
                );
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "teams"), {
                name: teamName,
                ownerId,
                captainId,
                playerIds: finalPlayers,
                logoUrl: teamLogo || "",
                createdAt: new Date(),
            });

            setTeamName("");
            setOwnerId("");
            setCaptainId("");
            setSelectedPlayers([]);
            setTeamLogo(null);

            toast.success("Team created successfully ✅", {
                id: "team-create",
            });
        } catch (err) {
            toast.error("Failed to create team", {
                id: "team-create",
            });
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
                <label className="text-sm text-slate-600">Team Name<span className="text-red-500">*</span></label>
                <input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                />
            </div>

            {/* Team Logo */}
            <div className="mb-6">
                <label className="text-sm text-slate-600">Team Logo</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                />
                {teamLogo && (
                    <img
                        src={teamLogo}
                        alt="logo preview"
                        className="w-20 h-20 mt-2 rounded-full object-cover"
                    />
                )}
            </div>

            {/* Player Selection */}
            <div className="mb-6">
                <p className="font-medium text-slate-700 mb-2">
                    Select Players ({selectedPlayers.length})
                </p>

                <div className="grid md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
                    {players.map((player) => {
                        const isAssigned = assignedPlayers[player.id];
                        const checked = selectedPlayers.includes(player.id);

                        return (
                            <label
                                key={player.id}
                                className={`flex items-center gap-2 p-2 rounded border
                                ${isAssigned
                                        ? "bg-gray-100 text-gray-400"
                                        : "cursor-pointer hover:bg-blue-50"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    disabled={!!isAssigned}
                                    checked={checked}
                                    onChange={() =>
                                        setSelectedPlayers((prev) =>
                                            checked
                                                ? prev.filter(
                                                    (id) => id !== player.id
                                                )
                                                : [...prev, player.id]
                                        )
                                    }
                                />
                                <span className="font-medium">
                                    {player.name}
                                </span>
                                {player.id === ownerId && (
                                    <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 rounded">
                                        Owner
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Owner */}
            <div className="mb-6">
                <label className="text-sm text-slate-600">Team Owner<span className="text-red-500">*</span></label>
                <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                >
                    <option value="">Select Owner</option>
                    {players.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Captain */}
            <div className="mb-6">
                <label className="text-sm text-slate-600">Captain<span className="text-red-500">*</span></label>
                <select
                    value={captainId}
                    onChange={(e) => setCaptainId(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                >
                    <option value="">Select Captain</option>
                    {finalCaptainCandidates(players, selectedPlayers, ownerId).map(
                        (p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        )
                    )}
                </select>
            </div>


            {error && (
                <p className="text-red-600 mb-4 font-medium">{error}</p>
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

function finalCaptainCandidates(players, selectedPlayers, ownerId) {
    const ids = new Set([...selectedPlayers, ownerId]);
    return players.filter((p) => ids.has(p.id));
}

export default TeamForm;
