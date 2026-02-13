import { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    onSnapshot,
    Timestamp
} from "firebase/firestore";
import { db } from "../firebase";

export default function MatchForm({ onMatchCreated }) {
    const [teams, setTeams] = useState([]);
    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");
    const [totalSets, setTotalSets] = useState(3);
    const [pointsPerSet, setPointsPerSet] = useState(25);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 🔹 Fetch teams
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!teamA || !teamB) {
            setError("Select both teams");
            return;
        }

        if (teamA === teamB) {
            setError("Teams must be different");
            return;
        }

        const teamAData = teams.find(t => t.id === teamA);
        const teamBData = teams.find(t => t.id === teamB);

        if (!teamAData || !teamBData) {
            setError("Invalid team selection");
            return;
        }

        setLoading(true);

        try {
            const docRef = await addDoc(collection(db, "matches"), {
                // 🔥 NON-TOURNAMENT MATCH
                tournamentId: null,

                teamAId: teamAData.id,
                teamAName: teamAData.name,
                teamBId: teamBData.id,
                teamBName: teamBData.name,

                totalSets,
                pointsPerSet: pointsPerSet,
                currentSet: 0,
                sets: [],

                status: "upcoming",   // upcoming → live → finished
                winnerTeamId: null,

                createdAt: Timestamp.now(),
                startedAt: null,
                finishedAt: null,
            });

            onMatchCreated && onMatchCreated(docRef.id);

            // reset form
            setTeamA("");
            setTeamB("");
            setTotalSets(3);
        } catch (err) {
            console.error(err);
            setError("Failed to create match");
        }

        setLoading(false);
    };

    return (
        <div className="w-full px-4 sm:px-6 overflow-x-hidden">
            <form
                onSubmit={handleSubmit}
                className="space-y-4 p-4 sm:p-6 bg-white rounded-xl shadow-md w-full max-w-md mx-auto"
            >
                {error && (
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                )}

                <div>
                    <label className="block mb-1 text-sm font-medium">
                        Team A
                    </label>
                    <select
                        value={teamA}
                        onChange={(e) => setTeamA(e.target.value)}
                        className="w-full p-2.5 border rounded text-sm"
                    >
                        <option value="">Select Team</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium">
                        Team B
                    </label>
                    <select
                        value={teamB}
                        onChange={(e) => setTeamB(e.target.value)}
                        className="w-full p-2.5 border rounded text-sm"
                    >
                        <option value="">Select Team</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium">
                        Number of Sets
                    </label>
                    <select
                        value={totalSets}
                        onChange={(e) => setTotalSets(Number(e.target.value))}
                        className="w-full p-2.5 border rounded text-sm"
                    >
                        {[1, 3, 5, 7].map(n => (
                            <option key={n} value={n}>
                                {n} Sets
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 text-sm font-medium">
                        Points Per Set
                    </label>
                    <select
                        className="w-full p-2.5 border rounded text-sm"
                        value={pointsPerSet}
                        onChange={(e) => setPointsPerSet(Number(e.target.value))}
                    >
                        {[15, 25, 35, 45, 55].map(p => (
                            <option key={p} value={p}>
                                {p} Points
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white rounded text-sm sm:text-base disabled:opacity-50"
                >
                    {loading ? "Creating..." : "Create Match"}
                </button>
            </form>
        </div>
    );

}
