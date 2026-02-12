import { useEffect, useState } from "react";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import toast from "react-hot-toast";


export default function TeamList() {
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [uploadingTeamId, setUploadingTeamId] = useState(null);

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

    const assignedPlayerIds = teams.flatMap(t => t.playerIds || []);

    const playerMap = {};
    players.forEach(p => {
        playerMap[p.id] = p.name;
    });

    const uploadLogo = async (teamId, file) => {
        if (!file) return;

        try {
            setUploadingTeamId(teamId);
            toast.loading("Uploading logo...", { id: teamId });

            const logoRef = ref(storage, `team-logos/${teamId}`);
            await uploadBytes(logoRef, file);

            const url = await getDownloadURL(logoRef);
            await updateDoc(doc(db, "teams", teamId), {
                logoUrl: url
            });

            toast.success("Logo updated", { id: teamId });
        } catch (err) {
            toast.error("Failed to upload logo", { id: teamId });
        } finally {
            setUploadingTeamId(null);
        }

    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

                    try {
                        await updateDoc(doc(db, "teams", team.id), {
                            playerIds: [...(team.playerIds || []), playerId]
                        });
                        toast.success("Player added");
                    } catch {
                        toast.error("Failed to add player");
                    }

                };

                const removePlayer = async (playerId) => {
                    try {
                        await updateDoc(doc(db, "teams", team.id), {
                            playerIds: team.playerIds.filter(id => id !== playerId)
                        });
                        toast.success("Player removed");
                    } catch {
                        toast.error("Failed to remove player");
                    }
                };

                const deleteTeam = async () => {
                    if (!confirm("Delete this team?")) return;
                    try {
                        await deleteDoc(doc(db, "teams", team.id));
                        toast.success("Team deleted");
                    } catch {
                        toast.error("Failed to delete team");
                    }

                };

                return (
                    <div
                        key={team.id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between border"
                    >
                        {/* ===== Header ===== */}
                        <div className="flex items-center gap-3 p-4">
                            <label
                                className={`relative ${isEditing ? "cursor-pointer" : ""
                                    }`}
                            >
                                {team.logoUrl ? (
                                    <img
                                        src={team.logoUrl}
                                        alt={team.name}
                                        className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl">
                                        {team.name?.charAt(0)}
                                    </div>
                                )}

                                {isEditing && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) =>
                                                uploadLogo(team.id, e.target.files[0])
                                            }
                                        />
                                        <span className="absolute -bottom-1 -right-1 bg-black text-white text-xs px-1 rounded">
                                            ✎
                                        </span>
                                    </>
                                )}

                                {uploadingTeamId === team.id && (
                                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs rounded-full">
                                        Uploading…
                                    </div>
                                )}
                            </label>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">
                                    {team.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {team.playerIds?.length || 0} Players
                                </p>
                            </div>
                        </div>

                        {/* ===== Owner / Captain ===== */}
                        <div className="flex flex-wrap gap-2 px-4 mb-3 text-xs">
                            {team.ownerId && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                    👑 Owner: {playerMap[team.ownerId] || "Unknown"}
                                </span>
                            )}
                            {team.captainId && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    🎖️ Captain: {playerMap[team.captainId] || "Unknown"}
                                </span>
                            )}
                        </div>

                        {/* ===== Actions ===== */}
                        <div className="flex gap-2 px-4 mb-3">
                            <button
                                onClick={() => {
                                    setEditingTeamId(isEditing ? null : team.id);
                                    toast(isEditing ? "Edit mode closed" : "Edit mode enabled");
                                }}
                                className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                            >
                                {isEditing ? "Done" : "Edit"}
                            </button>

                            <button
                                onClick={deleteTeam}
                                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>

                        <div className="h-px bg-gray-200 mx-4 my-2" />

                        {/* ===== Players ===== */}
                        {!isEditing && (
                            <ul className="space-y-2 px-4 pb-4 text-sm">
                                {teamPlayers.length === 0 && (
                                    <p className="text-gray-500 text-xs">
                                        No players
                                    </p>
                                )}

                                {teamPlayers.map(p => (
                                    <li
                                        key={p.id}
                                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
                                    >
                                        <span className="truncate">{p.name}</span>

                                        {p.id === team.captainId && (
                                            <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded-full font-medium">
                                                Captain
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* ===== Edit Mode ===== */}
                        {isEditing && (
                            <div className="space-y-2 px-4 pb-4">
                                {teamPlayers.map(p => (
                                    <div
                                        key={p.id}
                                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
                                    >
                                        <span className="truncate">{p.name}</span>
                                        <button
                                            onClick={() => removePlayer(p.id)}
                                            className="text-red-600 text-sm hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}

                                <select
                                    className="w-full border rounded-lg p-2 text-sm"
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
