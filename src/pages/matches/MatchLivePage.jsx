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
    deleteDoc,
    addDoc
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useParams, useNavigate } from "react-router-dom";

const MatchLivePage = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();

    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scorePulse, setScorePulse] = useState(false);

    const [timeout, setTimeoutState] = useState({
        team: null,
        remaining: 0
    });

    const user = auth.currentUser;

    /* ---------------- MATCH LISTENER ---------------- */
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "matches", matchId), (snap) => {
            if (snap.exists()) {
                setMatch(snap.data());
            } else {
                setMatch(null);
            }
            setLoading(false);
        });

        return () => unsub();
    }, [matchId]);

    /* ---------------- VIEWER ---------------- */
    useEffect(() => {
        if (!user || !matchId) return;

        const viewerRef = doc(db, "matches", matchId, "viewers", user.uid);
        setDoc(viewerRef, { joinedAt: new Date() });

        return () => deleteDoc(viewerRef);
    }, [matchId, user]);

    /* ---------------- TIMEOUT TIMER ---------------- */
    useEffect(() => {
        if (timeout.remaining <= 0) return;

        const interval = setInterval(() => {
            setTimeoutState(prev => ({
                ...prev,
                remaining: prev.remaining - 1
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, [timeout.remaining]);

    if (loading) return <div>Loading...</div>;
    if (!match) return <div>Match not found</div>;

    /* ---------------- MATCH DATA ---------------- */
    const totalSets = match?.totalSets ?? 3;
    const neededSets = Math.ceil(totalSets / 2);
    const currentSetIndex = match?.currentSet ?? 1;
    const sets = match.sets ?? [{ teamA: 0, teamB: 0 }];
    const isLastSet = totalSets === 5 && currentSetIndex === 5;

    const targetPoints = isLastSet
        ? (match?.lastSetPoints ?? 15)
        : (match?.pointsPerSet ?? 25);

    const isKnockoutMatch =
        match.stage === "knockout" ||
        ["semifinal", "final", "third_place", "quarterfinal"].includes(match.round);

    /* ---------------- LABEL ---------------- */
    const getMatchLabel = () => {
        if (!match?.tournamentId) return null;

        if (match.stage === "league") {
            return `League Match #${match.matchNumber || ""}`;
        }

        if (match.round === "semifinal") return "Semi Final";
        if (match.round === "final") return "Final";
        if (match.round === "third_place") return "3rd Place Match";
        if (match.round === "quarterfinal") return "Quarter Final";

        return "";
    };

    /* ---------------- SET SELECTION ---------------- */
    const updateMatchSets = async (matchId, sets) => {

        if (!matchId) {
            console.error("Match ID missing");
            return;
        }

        try {
            // 🔥 instant UI update
            setMatch(prev => ({
                ...prev,
                totalSets: sets,
                pointsPerSet: 25,
                lastSetPoints: sets === 5 ? 15 : 25
            }));

            // 🔥 DB update
            await updateDoc(doc(db, "matches", matchId), {
                totalSets: sets,
                pointsPerSet: 25,
                lastSetPoints: sets === 5 ? 15 : 25,
            });

        } catch (err) {
            console.error("Set update error:", err);
        }
    };

    /* ---------------- START MATCH ---------------- */
    const startMatch = async () => {
        await updateDoc(doc(db, "matches", matchId), {
            status: "live",
            currentSet: 1,
            sets: [{ teamA: 0, teamB: 0 }],
            history: [],
            startedAt: Timestamp.now(),
        });
    };

    /* ---------------- TIMEOUT ---------------- */
    const startTimeout = (team) => {
        if (timeout.remaining > 0) return;

        setTimeoutState({
            team,
            remaining: 60
        });
    };

    /* ---------------- SCORE ---------------- */
    const updateScore = async (team) => {
        if (match.status !== "live") return;

        setScorePulse(true);
        setTimeout(() => setScorePulse(false), 200);

        const updatedSets = [...sets];
        const history = match.history ?? [];

        updatedSets[currentSetIndex - 1][team] += 1;

        history.push({
            team,
            setIndex: currentSetIndex - 1
        });

        const a = updatedSets[currentSetIndex - 1].teamA;
        const b = updatedSets[currentSetIndex - 1].teamB;

        const setWon =
            (a >= targetPoints || b >= targetPoints) &&
            Math.abs(a - b) >= 2;

        if (setWon) {
            const aSets = updatedSets.filter(s => s.teamA > s.teamB).length;
            const bSets = updatedSets.filter(s => s.teamB > s.teamA).length;

            if (aSets === neededSets || bSets === neededSets) {
                const winnerId =
                    aSets > bSets ? match.teamAId : match.teamBId;

                await updateDoc(doc(db, "matches", matchId), {
                    sets: updatedSets,
                    history,
                    status: "finished",
                    winnerTeamId: winnerId,
                    finishedAt: Timestamp.now(),
                });

                await checkAndCreateFinalMatches();

                return;
            }

            updatedSets.push({ teamA: 0, teamB: 0 });

            await updateDoc(doc(db, "matches", matchId), {
                sets: updatedSets,
                history,
                currentSet: match.currentSet + 1,
            });



            return;
        }

        await updateDoc(doc(db, "matches", matchId), {
            sets: updatedSets,
            history,
        });
    };

    // final match creation 

    const checkAndCreateFinalMatches = async () => {
        try {
            const q = query(
                collection(db, "matches"),
                where("tournamentId", "==", match.tournamentId),
                where("round", "==", "semifinal")
            );

            const snap = await getDocs(q);

            const semifinals = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            const finished = semifinals.filter(m => m.status === "finished");
            if (finished.length !== 2) return;

            // 🚫 Prevent duplicate creation
            const existingQ = query(
                collection(db, "matches"),
                where("tournamentId", "==", match.tournamentId),
                where("round", "in", ["final", "third_place"])
            );

            const existingSnap = await getDocs(existingQ);
            if (!existingSnap.empty) return;

            const sf1 = semifinals.find(m => m.matchNumber === 1);
            const sf2 = semifinals.find(m => m.matchNumber === 2);

            if (!sf1 || !sf2) return;

            const getName = (id, m) =>
                id === m.teamAId ? m.teamAName : m.teamBName;

            const sf1Winner = sf1.winnerTeamId;
            const sf2Winner = sf2.winnerTeamId;

            const sf1Loser =
                sf1Winner === sf1.teamAId ? sf1.teamBId : sf1.teamAId;

            const sf2Loser =
                sf2Winner === sf2.teamAId ? sf2.teamBId : sf2.teamAId;

            // 🏆 FINAL
            await addDoc(collection(db, "matches"), {
                tournamentId: match.tournamentId,
                tournamentName: match.tournamentName || "",

                stage: "knockout",
                round: "final",

                teamAId: sf1Winner,
                teamAName: getName(sf1Winner, sf1),

                teamBId: sf2Winner,
                teamBName: getName(sf2Winner, sf2),

                status: "upcoming",
                totalSets: 3,
                pointsPerSet: 25,
                lastSetPoints: 15,

                currentSet: 1,
                sets: [],
                history: [],

                createdAt: Timestamp.now(),
            });

            // 🥉 THIRD PLACE
            await addDoc(collection(db, "matches"), {
                tournamentId: match.tournamentId,
                tournamentName: match.tournamentName || "",

                stage: "knockout",
                round: "third_place",

                teamAId: sf1Loser,
                teamAName: getName(sf1Loser, sf1),

                teamBId: sf2Loser,
                teamBName: getName(sf2Loser, sf2),

                status: "upcoming",
                totalSets: 3,
                pointsPerSet: 25,
                lastSetPoints: 15,

                currentSet: 1,
                sets: [],
                history: [],

                createdAt: Timestamp.now(),
            });

        } catch (err) {
            console.error("Final creation error:", err);
        }
    };

    /* ---------------- UNDO ---------------- */
    const undoLastPoint = async () => {
        if (match.status !== "live") return;

        const history = match.history ?? [];
        if (history.length === 0) return;

        const last = history[history.length - 1];
        const updatedHistory = history.slice(0, -1);

        const updatedSets = [...sets];

        if (updatedSets[last.setIndex][last.team] > 0) {
            updatedSets[last.setIndex][last.team] -= 1;
        }

        await updateDoc(doc(db, "matches", matchId), {
            sets: updatedSets,
            history: updatedHistory,
        });
    };

    /* ---------------- RESET ---------------- */
    const resetMatch = async () => {
        if (match.status === "finished") return;

        if (!window.confirm("Reset match?")) return;

        await updateDoc(doc(db, "matches", matchId), {
            status: "upcoming",
            currentSet: 1,
            sets: [],
            winnerTeamId: null,
            finishedAt: null,
            startedAt: null,
        });
    };

    return (
        <div className="max-w-xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow">

            <h1 className="text-xl font-bold text-red-500">Live Match</h1>

            {match.tournamentName && (
                <p className="text-center text-indigo-600 font-semibold">
                    {match.tournamentName}
                </p>
            )}

            {getMatchLabel() && (
                <p className="text-center text-sm text-gray-500">
                    {getMatchLabel()}
                </p>
            )}

            {/* 🔥 KNOCKOUT SET SELECT */}
            {/* ✅ MANUAL SET SELECTION */}

            {isKnockoutMatch && match.status === "upcoming" && (
                <>
                    <div className="flex gap-2 mt-3">

                        <button
                            onClick={() => updateMatchSets(matchId, 3)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${match.totalSets === 3
                                ? "bg-indigo-600 text-white scale-105 shadow"
                                : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            Best of 3
                        </button>

                        <button
                            onClick={() => updateMatchSets(matchId, 5)}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${match.totalSets === 5
                                ? "bg-indigo-600 text-white scale-105 shadow"
                                : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            Best of 5
                        </button>

                    </div>
                    <div>
                        <p className="text-center text-xs text-gray-500 mt-1">
                            {match.totalSets === 5
                                ? "Final set will be 15 points"
                                : "All sets are 25 points"}
                        </p>
                    </div>

                </>

            )}

            {/* START MATCH SCREEN */}
            {match.status === "upcoming" && (
                <>
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{match.teamAName}</span>
                        <span>vs</span>
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

            {/* LIVE */}
            {match.status !== "upcoming" && (
                <>
                    <div className="flex justify-between">
                        <span>{match.teamAName}</span>
                        <span>Set {match.currentSet}</span>
                        <span>{match.teamBName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <button onClick={() => updateScore("teamA")} className="bg-indigo-600 text-white px-6 py-3 rounded">+1</button>

                        <div className={`text-3xl font-bold ${scorePulse ? "scale-110 text-indigo-600" : ""}`}>
                            {sets[currentSetIndex - 1]?.teamA} :
                            {sets[currentSetIndex - 1]?.teamB}
                        </div>

                        <button onClick={() => updateScore("teamB")} className="bg-indigo-600 text-white px-6 py-3 rounded">+1</button>
                    </div>

                    {/* TIMEOUT */}
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => startTimeout("teamA")} className="flex-1 bg-blue-500 text-white py-2 rounded">
                            {timeout.team === "teamA" && timeout.remaining > 0
                                ? `${timeout.remaining}s`
                                : `${match.teamAName} TO`}
                        </button>

                        <button onClick={() => startTimeout("teamB")} className="flex-1 bg-purple-500 text-white py-2 rounded">
                            {timeout.team === "teamB" && timeout.remaining > 0
                                ? `${timeout.remaining}s`
                                : `${match.teamBName} TO`}
                        </button>
                    </div>
                </>
            )}

            {match.status === "live" && (
                <>
                    <button onClick={undoLastPoint} className="w-full bg-yellow-500 text-white py-2 rounded">Undo</button>
                    <button onClick={resetMatch} className="w-full bg-red-600 text-white py-2 rounded">Reset</button>
                </>
            )}

            {/* 🔥 SET HISTORY / SUMMARY */}
            {/* 🔥 SET HISTORY / SUMMARY (ONLY COMPLETED SETS) */}
            {sets.length > 0 && (
                <div className="mt-4 bg-gray-50 rounded-xl p-3 border space-y-2">

                    <h3 className="text-sm font-semibold text-gray-600">
                        Set Summary
                    </h3>

                    {sets.map((set, index) => {

                        const a = set.teamA || 0;
                        const b = set.teamB || 0;

                        // ✅ check if set is completed
                        const isCompleted =
                            (a >= targetPoints || b >= targetPoints) &&
                            Math.abs(a - b) >= 2;

                        // ❌ skip if NOT completed
                        if (!isCompleted) return null;

                        const isAWinner = a > b;
                        const isBWinner = b > a;

                        return (
                            <div
                                key={index}
                                className="flex justify-between items-center text-sm bg-white px-3 py-2 rounded-lg shadow-sm"
                            >
                                {/* Set number */}
                                <span className="text-gray-500 font-medium">
                                    Set {index + 1}
                                </span>

                                {/* Score */}
                                <span className="font-bold text-gray-800">
                                    {a} - {b}
                                </span>

                                {/* Winner */}
                                <span className="text-xs font-semibold text-green-600">
                                    {isAWinner
                                        ? match.teamAName
                                        : match.teamBName}
                                </span>
                            </div>
                        );
                    })}

                    {/* 🔥 EMPTY STATE */}
                    {!sets.some(set => {
                        const a = set.teamA || 0;
                        const b = set.teamB || 0;
                        return (a >= targetPoints || b >= targetPoints) && Math.abs(a - b) >= 2;
                    }) && (
                            <p className="text-xs text-gray-400 text-center">
                                No completed sets yet
                            </p>
                        )}
                </div>
            )}

            {match.status === "finished" && (
                <button
                    onClick={() => navigate(`/tournaments/${match.tournamentId}`)}
                    className="w-full bg-indigo-600 text-white py-2 rounded"
                >
                    Go to Tournament
                </button>
            )}
        </div>
    );
};

export default MatchLivePage;