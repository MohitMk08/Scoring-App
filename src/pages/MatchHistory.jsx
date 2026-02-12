import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import DashboardLayout from "../layout/DashboardLayout";

export default function MatchHistory() {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState({});

    useEffect(() => {
        const unsubTeams = onSnapshot(collection(db, "teams"), snap => {
            const map = {};
            snap.forEach(doc => (map[doc.id] = doc.data()));
            setTeams(map);
        });
        return () => unsubTeams();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, "matches"),
            orderBy("finishedAt", "desc")
        );

        const unsubMatches = onSnapshot(q, snap => {
            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMatches(list);
        });

        return () => unsubMatches();
    }, []);

    return (

        <div className="px-3 py-4 max-w-3xl mx-auto space-y-4">
            <h1 className="text-xl font-semibold">Match History</h1>

            {matches
                .filter(match => match.status === "finished")
                .map(match => {
                    const teamA = teams[match.teamAId]?.name || "Team A";
                    const teamB = teams[match.teamBId]?.name || "Team B";
                    const teamASetsWon =
                        match.sets?.filter(s => s.teamA > s.teamB).length || 0;

                    const teamBSetsWon =
                        match.sets?.filter(s => s.teamB > s.teamA).length || 0;


                    return (
                        <div
                            key={match.id}
                            className="bg-white rounded-xl shadow p-4 space-y-2"
                        >
                            {/* Header */}
                            <div className="flex justify-between text-sm font-medium">
                                <span className="truncate w-1/3">{teamA}</span>
                                <span className="font-bold text-base">
                                    {teamASetsWon} - {teamBSetsWon}
                                </span>
                                <span className="truncate w-1/3 text-right">
                                    {teamB}
                                </span>
                            </div>

                            <p className="text-center text-green-700 text-sm font-medium">
                                🏆 Winner: {teams[match.winnerTeamId]?.name}
                            </p>

                            {/* Set summary */}
                            <div className="flex flex-wrap gap-2 text-xs">
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

            {matches.filter(m => m.status === "finished").length === 0 && (
                <p className="text-sm text-gray-500">
                    No finished matches yet
                </p>
            )}
        </div>

    );
}
