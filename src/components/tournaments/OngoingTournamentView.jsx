import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

const OngoingTournamentView = ({ tournament, teams }) => {
    const navigate = useNavigate();

    const [matches, setMatches] = useState([]);


    // ✅ HARD GUARD
    if (!tournament || tournament.status !== "ongoing") return null;


    // 🔹 Fetch matches
    useEffect(() => {
        if (!tournament?.id) return;

        const q = query(
            collection(db, "matches"),
            where("tournamentId", "==", tournament.id)
        );

        const unsub = onSnapshot(q, (snap) => {
            setMatches(
                snap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                }))
            );
        });

        return () => unsub();
    }, [tournament?.id]);


    return (
        <div className="space-y-4">

            {matches.length === 0 && teams.length < 2 && (
                <p className="text-sm text-red-500 text-center">
                    Add at least 2 teams to generate matches
                </p>
            )}


            {matches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                    No matches created yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {matches.map((m) => (
                        <div
                            key={m.id}
                            className="border rounded-lg p-3 bg-white shadow-sm"
                        >
                            <div className="flex justify-between font-medium">
                                <span>{m.teamAName}</span>
                                <span>vs</span>
                                <span>{m.teamBName}</span>
                            </div>

                            {m.status === "finished" ? (
                                <div className="mt-2 space-y-1 text-sm">
                                    <p className="text-green-700 font-semibold">
                                        Winner: {m.winnerTeamId === m.teamAId ? m.teamAName : m.teamBName}
                                    </p>

                                    {/* Set summary */}
                                    {m.sets?.map((set, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between bg-gray-100 px-2 py-1 rounded"
                                        >
                                            <span>Set {idx + 1}</span>
                                            <span>{set.teamA} - {set.teamB}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm mt-2 text-gray-500">
                                    Status: {m.status}
                                    {m.status === "live" && (
                                        <button
                                            onClick={() => navigate(`/matches/live/${m.id}`)}
                                            className="mt-2 w-full bg-orange-600 text-white py-1 rounded"
                                        >
                                            Resume Match
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ✅ START MATCH BUTTON */}
                            {m.status === "upcoming" && (
                                <button
                                    onClick={() => navigate(`/matches/live/${m.id}`)}
                                    className="mt-2 w-full bg-green-600 text-white py-1 rounded"
                                >
                                    Start Match
                                </button>
                            )}
                        </div>
                    ))}

                </div>

            )}

            {/* <button
                onClick={generateKnockoutMatches}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
                Generate Knockout Stage
            </button> */}
        </div>
    );
};

export default OngoingTournamentView;
