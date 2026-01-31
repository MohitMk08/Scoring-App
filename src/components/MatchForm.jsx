import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function MatchForm({ onMatchCreated }) {
    const [teams, setTeams] = useState([]);
    const [teamA, setTeamA] = useState("");
    const [teamB, setTeamB] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [totalSets, setTotalSets] = useState(3);


    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teams"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

        setLoading(true);
        try {
            const docRef = await addDoc(collection(db, "matches"), {
                teamAId: teamA,
                teamBId: teamB,
                teamAScore: 0,
                teamBScore: 0,
                setScores: [],
                totalSets,
                status: "live",
                winnerTeamId: null,
                createdAt: new Date()
            });
            onMatchCreated && onMatchCreated(docRef.id);
            setTeamA(""); setTeamB("");
        } catch (err) {
            setError("Failed to create match");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-xl shadow-md w-full max-w-md mx-auto">
            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

            <div>
                <label className="block mb-1 font-medium text-gray-700">Team A</label>
                <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                >
                    <option value="">Select Team</option>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block mb-1 font-medium text-gray-700">Team B</label>
                <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                >
                    <option value="">Select Team</option>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
            </div>

            <div>
                <label className="block mb-1 font-medium text-gray-700">
                    Number of Sets
                </label>
                <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-400"
                    value={totalSets}
                    onChange={(e) => setTotalSets(Number(e.target.value))}
                >
                    {[1, 3, 5, 7].map(n => (
                        <option key={n} value={n}>{n} Sets</option>
                    ))}
                </select>
            </div>


            <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
                {loading ? "Creating..." : "Start Match"}
            </button>
        </form>
    );
}
