import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

const CompletedTournamentView = ({ tournament }) => {
    const [matches, setMatches] = useState([]);
    const [winnerJourney, setWinnerJourney] = useState([]);

    useEffect(() => {
        if (!tournament?.id) return;

        const q = query(
            collection(db, "matches"),
            where("tournamentId", "==", tournament.id),
            where("status", "==", "completed")
        );

        const unsub = onSnapshot(q, (snap) => {
            const completed = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            setMatches(completed);

            if (tournament.winnerTeamId) {
                const journey = completed.filter(
                    (m) =>
                        m.teamAId === tournament.winnerTeamId ||
                        m.teamBId === tournament.winnerTeamId
                );
                setWinnerJourney(journey);
            }
        });

        return () => unsub();
    }, [tournament]);

    return (
        <div className="space-y-6">
            {/* 🏆 WINNER */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-green-800">
                    🏆 Tournament Winner
                </h2>

                <p className="mt-2 text-xl font-bold text-green-900">
                    {tournament.winnerTeamName || "Winner not recorded"}
                </p>
            </div>

            {/* 📜 COMPLETED MATCHES */}
            <div>
                <h3 className="text-lg font-semibold mb-3">
                    Completed Matches
                </h3>

                {matches.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No match data available.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="bg-gray-100 rounded-lg p-3"
                            >
                                <div className="flex justify-between text-sm font-medium">
                                    <span>
                                        {match.teamAName} vs {match.teamBName}
                                    </span>
                                    <span className="text-green-700">
                                        Winner:{" "}
                                        {match.winnerTeamName ||
                                            "—"}
                                    </span>
                                </div>

                                <div className="text-sm mt-1">
                                    {match.teamAScore} -{" "}
                                    {match.teamBScore}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 🧭 WINNER JOURNEY */}
            <div>
                <h3 className="text-lg font-semibold mb-3">
                    Winning Team Journey
                </h3>

                {winnerJourney.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No journey data available.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {winnerJourney.map((match, index) => (
                            <div
                                key={match.id}
                                className="bg-white border rounded-lg p-3"
                            >
                                <p className="text-xs text-gray-500">
                                    Match {index + 1}
                                </p>

                                <p className="text-sm font-medium">
                                    {match.teamAName} vs{" "}
                                    {match.teamBName}
                                </p>

                                <p className="text-sm mt-1">
                                    Final Score:{" "}
                                    {match.teamAScore} -{" "}
                                    {match.teamBScore}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedTournamentView;
