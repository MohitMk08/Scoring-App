import React, { useEffect, useState } from "react";
import {
    doc,
    updateDoc,
    onSnapshot,
    Timestamp,
    query,
    where,
    getDocs,
    collection,
    increment,
    setDoc,
    deleteDoc
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";

const MatchLivePage = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    // 🔹 Listen to match
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, "matches", matchId),
            (snapshot) => {
                if (snapshot.exists()) {
                    setMatch(snapshot.data());
                } else {
                    setMatch(null);
                }
                setLoading(false);
            },
            (error) => {
                console.error("Match snapshot error:", error);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [matchId]);

    // 🔹 Viewer tracking
    useEffect(() => {
        if (!user || !matchId) return;

        const viewerRef = doc(db, "matches", matchId, "viewers", user.uid);

        setDoc(viewerRef, { joinedAt: new Date() });

        return () => {
            deleteDoc(viewerRef);
        };
    }, [matchId, user]);

    // 🔥 STOP until match exists
    if (loading) return <div>Loading...</div>;
    if (!match) return <div>Match not found</div>;

    const neededSets = Math.ceil((match.totalSets ?? 3) / 2);
    const isReadOnly = match.status === "finished";
    const currentSetIndex = (match.currentSet ?? 1) - 1;
    const sets = match.sets ?? [{ teamA: 0, teamB: 0 }];

    // 🔹 Start match
    const startMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "live",
            currentSet: 1,
            sets: [{ teamA: 0, teamB: 0 }],
            startedAt: Timestamp.now(),
        });
    };

    // 🔹 Update team stats
    const updateTeamStats = async (winnerTeamId) => {
        const q = query(
            collection(db, "teamStats"),
            where("tournamentId", "==", match.tournamentId)
        );

        const snap = await getDocs(q);

        const teamAStat = snap.docs.find(d => d.data().teamId === match.teamAId);
        const teamBStat = snap.docs.find(d => d.data().teamId === match.teamBId);

        if (!teamAStat || !teamBStat) return;

        const winnerStat =
            winnerTeamId === match.teamAId ? teamAStat : teamBStat;

        const loserStat =
            winnerTeamId === match.teamAId ? teamBStat : teamAStat;

        await updateDoc(winnerStat.ref, {
            played: increment(1),
            wins: increment(1),
            points: increment(2),
        });

        await updateDoc(loserStat.ref, {
            played: increment(1),
            losses: increment(1),
        });
    };

    // 🔹 Update score
    const updateScore = async (team) => {
        if (match.status !== "live") return;

        const updatedSets = [...sets];
        updatedSets[currentSetIndex][team] += 1;

        const a = updatedSets[currentSetIndex].teamA;
        const b = updatedSets[currentSetIndex].teamB;

        const setWon =
            (a >= 25 || b >= 25) && Math.abs(a - b) >= 2;

        if (setWon) {
            const aSets = updatedSets.filter(s => s.teamA > s.teamB).length;
            const bSets = updatedSets.filter(s => s.teamB > s.teamA).length;

            if (aSets === neededSets || bSets === neededSets) {
                const winnerId =
                    aSets > bSets ? match.teamAId : match.teamBId;

                await updateDoc(doc(db, "matches", matchId), {
                    sets: updatedSets,
                    status: "finished",
                    winnerTeamId: winnerId,
                    finishedAt: Timestamp.now(),
                });

                await updateTeamStats(winnerId);
                return;
            }

            updatedSets.push({ teamA: 0, teamB: 0 });

            await updateDoc(doc(db, "matches", matchId), {
                sets: updatedSets,
                currentSet: match.currentSet + 1,
            });

            return;
        }

        await updateDoc(doc(db, "matches", matchId), {
            sets: updatedSets,
        });
    };

    // 🔹 Undo
    const undoLastPoint = async () => {
        if (match.status !== "live") return;

        const updatedSets = [...sets];

        if (updatedSets[currentSetIndex].teamA > 0) {
            updatedSets[currentSetIndex].teamA -= 1;
        } else if (updatedSets[currentSetIndex].teamB > 0) {
            updatedSets[currentSetIndex].teamB -= 1;
        }

        await updateDoc(doc(db, "matches", matchId), {
            sets: updatedSets,
        });
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow">
            <h1 className="text-xl font-bold text-red-500">Live Match</h1>

            {/* ✅ COMPLETED SETS SUMMARY BLOCK (ADDED) */}
            {sets.length > 1 && (
                <div className="bg-gray-100 p-3 rounded-lg space-y-2">
                    <h2 className="font-semibold text-gray-700">Completed Sets</h2>
                    {sets.slice(0, sets.length - 1).map((set, index) => {
                        const winner =
                            set.teamA > set.teamB
                                ? match.teamAName
                                : set.teamB > set.teamA
                                    ? match.teamBName
                                    : null;

                        return (
                            <div
                                key={index}
                                className="flex justify-between text-sm border-b pb-1"
                            >
                                <span>Set {index + 1}</span>
                                <span>
                                    {set.teamA} : {set.teamB}
                                </span>
                                {winner && (
                                    <span className="text-green-600 font-medium">
                                        {winner}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {match.status === "upcoming" && (
                <>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>Set 1</span>
                        <span>{match.teamBName}</span>
                    </div>

                    <button
                        onClick={startMatch}
                        className="w-full bg-green-600 text-white py-2 rounded-lg"
                    >
                        Start Match
                    </button>
                </>
            )}

            {match.status !== "upcoming" && (
                <>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>Set {match.currentSet}</span>
                        <span>{match.teamBName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            disabled={isReadOnly}
                            onClick={() => updateScore("teamA")}
                            className={`px-6 py-3 rounded-lg text-white ${isReadOnly
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            +1
                        </button>

                        <div className="text-3xl font-bold">
                            {sets[currentSetIndex]?.teamA} :
                            {sets[currentSetIndex]?.teamB}
                        </div>

                        <button
                            disabled={isReadOnly}
                            onClick={() => updateScore("teamB")}
                            className={`px-6 py-3 rounded-lg text-white ${isReadOnly
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                        >
                            +1
                        </button>
                    </div>
                </>
            )}

            {match.status === "live" && (
                <button
                    onClick={undoLastPoint}
                    className="w-full py-2 bg-yellow-500 text-white rounded-lg"
                >
                    Undo Last Point
                </button>
            )}
        </div>
    );
};

export default MatchLivePage;