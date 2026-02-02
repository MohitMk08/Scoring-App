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

const OngoingTournamentView = ({ tournament, teams }) => {
    const [matches, setMatches] = useState([]);
    const [generating, setGenerating] = useState(false);
    const getMapUrl = (location) => {
        if (!location) return null;
        const encoded = encodeURIComponent(location);
        return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=14&size=600x300&markers=color:red|${encoded}`;
    };
    const mapUrl = getMapUrl(tournament.location);


    // ✅ HARD GUARD — source of truth
    if (!tournament || tournament.status !== "ongoing") return null;

    // 🔹 Fetch matches for this tournament
    useEffect(() => {
        if (!tournament?.id) return;

        const q = query(
            collection(db, "matches"),
            where("tournamentId", "==", tournament.id)
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            setMatches(data);
        });

        return () => unsub();
    }, [tournament?.id]);

    // 🔹 Generate matches
    const generateMatches = async () => {
        if (teams.length < 2) {
            alert("At least 2 teams are required");
            return;
        }

        // ✅ Prevent duplicate generation
        if (matches.length > 0) {
            alert("Matches already generated");
            return;
        }

        setGenerating(true);

        try {
            let matchNumber = 1;

            for (let i = 0; i < teams.length; i += 2) {
                await addDoc(collection(db, "matches"), {
                    tournamentId: tournament.id,
                    round: 1,
                    matchNumber,
                    teamAId: teams[i].id,
                    teamAName: teams[i].name,
                    teamBId: teams[i + 1]?.id || null,
                    teamBName: teams[i + 1]?.name || "BYE",
                    status: "upcoming",
                    teamAScore: 0,
                    teamBScore: 0,
                    winnerTeamId: null,
                    createdAt: serverTimestamp(),
                });

                matchNumber++;
            }
        } catch (err) {
            console.error(err);
            alert("Error generating matches");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            {mapUrl && (
                <div className="rounded-xl overflow-hidden border">
                    <img
                        src={mapUrl}
                        alt="Tournament Location Map"
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}


            {/* Generate Matches Button */}
            {matches.length === 0 && teams.length >= 2 && (
                <button
                    onClick={generateMatches}
                    disabled={generating}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg"
                >
                    {generating ? "Generating..." : "Generate Matches"}
                </button>
            )}

            {teams.length < 2 && (
                <p className="text-sm text-red-500 text-center">
                    Add at least 2 teams to generate matches
                </p>
            )}

            {/* Match List */}
            {matches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">
                    No matches created yet.
                </p>
            ) : (
                <div className="space-y-3">
                    {matches.map((match) => (
                        <div
                            key={match.id}
                            className="bg-white border rounded-lg p-3"
                        >
                            <p className="text-sm font-semibold">
                                {match.teamAName} vs {match.teamBName}
                            </p>

                            <p className="text-xs text-gray-500">
                                Round {match.round} • Match {match.matchNumber}
                            </p>

                            <p className="text-xs mt-1">
                                Status:{" "}
                                <span className="font-medium capitalize">
                                    {match.status}
                                </span>
                            </p>

                            {match.status === "upcoming" && (
                                <button className="mt-2 text-sm text-blue-600">
                                    Start Match
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OngoingTournamentView;
