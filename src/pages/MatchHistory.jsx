import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import DashboardLayout from "../layout/DashboardLayout";

export default function MatchHistory() {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState({});

    // Load teams
    useEffect(() => {
        const unsubTeams = onSnapshot(collection(db, "teams"), (snapshot) => {
            const map = {};
            snapshot.docs.forEach(doc => {
                map[doc.id] = doc.data();
            });
            setTeams(map);
        });
        return () => unsubTeams();
    }, []);

    // Load matches
    useEffect(() => {
        const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMatches(list);
        });
        return () => unsubMatches();
    }, []);

    return (
        <DashboardLayout>
            <div className="px-3 py-4 space-y-4 max-w-3xl mx-auto">
                <h1 className="text-xl font-semibold">Match History</h1>

                {matches.length === 0 && (
                    <p className="text-gray-500 text-sm">No matches played yet</p>
                )}

                {matches
                    .filter(match => match.status === "finished")
                    .map(match => {
                        const teamA = teams[match.teamAId]?.name || "Team A";
                        const teamB = teams[match.teamBId]?.name || "Team B";

                        return (
                            <div
                                key={match.id}
                                className="bg-white rounded-xl shadow p-4 space-y-2"
                            >
                                {/* Teams + Final Score */}
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="truncate">{teamA}</span>
                                    <span className="font-bold text-base">
                                        {match.teamAScore} - {match.teamBScore}
                                    </span>
                                    <span className="truncate text-right">{teamB}</span>
                                </div>

                                <p className="text-center text-sm text-green-700 font-medium">
                                    🏆 Winner: {teams[match.winnerTeamId]?.name}
                                </p>


                                {/* Set Scores */}
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                    {match.setScores?.map((set, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-gray-100 rounded"
                                        >
                                            {set.teamA}-{set.teamB}
                                        </span>
                                    ))}
                                </div>

                            </div>
                        );
                    })}
            </div>
        </DashboardLayout>
    );
}
