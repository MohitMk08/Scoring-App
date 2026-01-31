import { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

export default function TeamList() {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [editingTeamId, setEditingTeamId] = useState(null);

    // Load teams
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teams"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeams(list);
        });
        return () => unsub();
    }, []);

    // Load players
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "players"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPlayers(list);
        });
        return () => unsub();
    }, []);

    // Helper: players already assigned to any team
    const assignedPlayerIds = teams.flatMap(t => t.playerIds || []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
                const teamPlayers = players.filter(p =>
                    team.playerIds?.includes(p.id)
                );

                const availablePlayers = players.filter(
                    p => !assignedPlayerIds.includes(p.id)
                );

                const isEditing = editingTeamId === team.id;

                const addPlayer = async (playerId) => {
                    if (!playerId) return;
                    await updateDoc(doc(db, "teams", team.id), {
                        playerIds: [...team.playerIds, playerId]
                    });
                };

                const removePlayer = async (playerId) => {
                    await updateDoc(doc(db, "teams", team.id), {
                        playerIds: team.playerIds.filter(id => id !== playerId)
                    });
                };

                const deleteTeam = async () => {
                    if (!confirm("Delete this team?")) return;
                    await deleteDoc(doc(db, "teams", team.id));
                };

                return (
                    <div
                        key={team.id}
                        className="bg-white rounded-xl shadow p-4 flex flex-col justify-between"
                    >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="font-semibold text-lg truncate">{team.name}</h3>

                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        setEditingTeamId(isEditing ? null : team.id)
                                    }
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                                >
                                    {isEditing ? "Done" : "Edit"}
                                </button>

                                <button
                                    onClick={deleteTeam}
                                    className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-200 my-3" />

                        {/* Players */}
                        {!isEditing && (
                            <ul className="space-y-2 text-sm">
                                {teamPlayers.length === 0 && (
                                    <p className="text-gray-500 text-xs">No players</p>
                                )}

                                {teamPlayers.map(p => (
                                    <li
                                        key={p.id}
                                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded"
                                    >
                                        <span className="truncate">{p.name}</span>

                                        {p.id === team.captainId && (
                                            <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded">
                                                Captain
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Edit Mode */}
                        {isEditing && (
                            <div className="space-y-2">
                                {teamPlayers.map(p => (
                                    <div
                                        key={p.id}
                                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded"
                                    >
                                        <span className="truncate">{p.name}</span>

                                        <button
                                            onClick={() => removePlayer(p.id)}
                                            className="text-red-600 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                <select
                                    className="w-full border rounded p-2 text-sm"
                                    onChange={(e) => addPlayer(e.target.value)}
                                >
                                    <option value="">Add player</option>
                                    {availablePlayers.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>

                                <p className="text-xs text-green-600">
                                    Changes are saved automatically
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
