import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

export default function CompletedTournamentView({ tournament, teamsMap }) {
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            where("tournamentId", "==", tournament.id),
            where("status", "==", "finished")
        );

        const unsub = onSnapshot(q, (snap) => {
            setMatches(
                snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            );
        });

        return () => unsub();
    }, [tournament.id]);

    const teamName = (id) => teamsMap[id]?.name || "Unknown";

    return (
        <div className="space-y-6">
            {/* 🏆 Winner */}
            <div className="bg-green-50 border border-green-400 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-green-700">
                    🏆 Tournament Winner
                </h2>
                <p className="text-xl font-bold mt-1">
                    {teamName(tournament.winnerTeamId)}
                </p>
            </div>

            {/* 📜 Match History */}
            <div>
                <h3 className="font-semibold mb-2">📜 Match History</h3>

                {matches.length === 0 && (
                    <p className="text-sm text-gray-500">No matches found</p>
                )}

                <div className="space-y-3">
                    {matches.map(match => (
                        <div
                            key={match.id}
                            className="border rounded-lg p-3 bg-white"
                        >
                            <div className="flex justify-between font-medium">
                                <span>{teamName(match.teamAId)}</span>
                                <span>
                                    {match.teamAScore} - {match.teamBScore}
                                </span>
                                <span>{teamName(match.teamBId)}</span>
                            </div>

                            <p className="text-xs text-green-600 mt-1">
                                Winner: {teamName(match.winnerTeamId)}
                            </p>

                            {/* Set scores */}
                            <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                {match.setScores?.map((set, i) => (
                                    <span
                                        key={i}
                                        className="bg-gray-100 px-2 py-1 rounded"
                                    >
                                        Set {i + 1}: {set.teamA}-{set.teamB}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🛣 Winning Journey */}
            <div>
                <h3 className="font-semibold mb-2">🛣 Winning Team Journey</h3>

                <div className="space-y-2">
                    {matches
                        .filter(m => m.winnerTeamId === tournament.winnerTeamId)
                        .map((match, index) => {
                            const opponent =
                                match.teamAId === tournament.winnerTeamId
                                    ? match.teamBId
                                    : match.teamAId;

                            return (
                                <div
                                    key={match.id}
                                    className="border-l-4 border-green-500 pl-3 text-sm"
                                >
                                    <p className="font-medium">
                                        Match {index + 1} vs {teamName(opponent)}
                                    </p>
                                    <p className="text-gray-600">
                                        Score: {match.teamAScore}-{match.teamBScore}
                                    </p>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
