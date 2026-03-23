import React, { useEffect, useState, useRef } from "react";
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
    const [activeTimeout, setActiveTimeout] = useState(null);

    const [timeout, setTimeoutState] = useState({
        team: null,
        remaining: 0
    });
    const [timeoutData, setTimeoutData] = useState(null);
    const [timeoutLeft, setTimeoutLeft] = useState(0);
    const [activeTimeoutTeam, setActiveTimeoutTeam] = useState(null);
    const tickAudioRef = useRef(null);
    const whistleAudioRef = useRef(null);

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

    // init audio
    useEffect(() => {
        tickAudioRef.current = new Audio("/tick.mp3");
        whistleAudioRef.current = new Audio("/refree-whistle-long.mp3");

        tickAudioRef.current.preload = "auto";
        whistleAudioRef.current.preload = "auto";
    }, []);

    // ✅ FIXED: Proper timeout sync + auto clear
    useEffect(() => {
        if (!match?.timeout) {
            setTimeoutLeft(0);
            setActiveTimeoutTeam(null);
            setActiveTimeout(null);
            return;
        }

        setActiveTimeout(match.timeout.team);

        const interval = setInterval(async () => {
            const now = Date.now();
            const end = match.timeout?.endsAt?.toMillis?.();

            if (!end) return;

            const remaining = Math.max(0, Math.floor((end - now) / 1000));

            setTimeoutLeft(remaining);
            setActiveTimeoutTeam(match.timeout.team);

            if (remaining > 0) {
                try {
                    tickAudioRef.current.currentTime = 0;
                    tickAudioRef.current.play();

                    navigator.vibrate?.(100);
                } catch { }
            }

            if (remaining === 0) {
                clearInterval(interval);

                try {
                    whistleAudioRef.current.play();

                    // 🔥 strong vibration pattern
                    navigator.vibrate?.([300, 100, 300, 100, 500]);
                } catch { }

                await updateDoc(doc(db, "matches", matchId), {
                    timeout: null
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [match?.timeout]);

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
        if (!matchId) return;

        try {
            setMatch(prev => ({
                ...prev,
                totalSets: sets,
                pointsPerSet: 25,
                lastSetPoints: sets === 5 ? 15 : 25
            }));

            // ✅ FIX: removed wrong timeout object
            await updateDoc(doc(db, "matches", matchId), {
                totalSets: sets,
                pointsPerSet: 25,
                lastSetPoints: sets === 5 ? 15 : 25
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
    const startTimeout = async (team) => {
        if (match.status !== "live") return;

        const currentSet = match.currentSet || 1;

        const timeoutData = match.timeout || {
            used: { teamA: 0, teamB: 0 }
        };

        const used = timeoutData.used || { teamA: 0, teamB: 0 };

        if (used[team] >= 2 && timeoutData.setNumber === currentSet) {
            alert("Timeout limit reached (2 per set)");
            return;
        }

        const endsAt = Timestamp.fromMillis(Date.now() + 60000);

        await updateDoc(doc(db, "matches", matchId), {
            timeout: {
                team,
                endsAt,
                setNumber: currentSet,
                used: {
                    ...used,
                    [team]: (used[team] || 0) + 1
                }
            }
        });
    };

    const isScoringDisabled =
        match.status !== "live" || activeTimeout !== null;

    /* ---------------- SCORE ---------------- */
    const updateScore = async (team) => {
        if (match.status !== "live") return;

        setScorePulse(true);
        setTimeout(() => setScorePulse(false), 200);

        const updatedSets = [...sets];

        // ✅ FIX: safe set init
        if (!updatedSets[currentSetIndex - 1]) {
            updatedSets[currentSetIndex - 1] = { teamA: 0, teamB: 0 };
        }

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
                    timeout: null,
                });

                await checkAndCreateFinalMatches();
                await checkAndCompleteTournament(); // ✅ NEW

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

    /* ---------------- UNDO ---------------- */
    const undoLastPoint = async () => {
        if (match.status !== "live") return;

        const history = match.history ?? [];
        if (history.length === 0) return;

        const last = history[history.length - 1];
        const updatedHistory = history.slice(0, -1);

        const updatedSets = [...sets];

        // ✅ FIX: safe check (prevents crash / blank UI)
        if (!updatedSets[last.setIndex]) return;

        if (updatedSets[last.setIndex][last.team] > 0) {
            updatedSets[last.setIndex][last.team] -= 1;
        }

        await updateDoc(doc(db, "matches", matchId), {
            sets: updatedSets,
            history: updatedHistory,
        });
    };

    /* ---------------- AUTO COMPLETE TOURNAMENT ---------------- */
    const checkAndCompleteTournament = async () => {
        if (!match?.tournamentId) return;

        try {
            const q = query(
                collection(db, "matches"),
                where("tournamentId", "==", match.tournamentId)
            );

            const snap = await getDocs(q);
            const matches = snap.docs.map(d => d.data());

            const allFinished = matches.every(m => m.status === "finished");

            if (!allFinished) return;

            await updateDoc(doc(db, "tournaments", match.tournamentId), {
                status: "completed",
                completedAt: Timestamp.now()
            });

        } catch (err) {
            console.error("Tournament completion error:", err);
        }
    };

    /* ---------------- RESET ---------------- */
    const resetMatch = async () => {
        if (match.status === "finished") return;

        if (!window.confirm("Reset match?")) return;

        await updateDoc(doc(db, "matches", matchId), {
            status: "upcoming",
            currentSet: 1,
            sets: [{ teamA: 0, teamB: 0 }],
            winnerTeamId: null,
            finishedAt: null,
            startedAt: null,
            timeout: null // ✅ FIX
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

            {/* 🔥 TIMEOUT INDICATOR */}
            {activeTimeout && (
                <div className="text-center text-sm font-semibold text-orange-600 bg-orange-100 py-2 rounded-lg animate-pulse">
                    ⏱ Timeout - {activeTimeout === "teamA" ? match.teamAName : match.teamBName}
                </div>
            )}

            {/* LIVE */}
            {match.status !== "upcoming" && (
                <>
                    <div className="max-w-xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow relative">

                        {timeoutLeft > 0 && (
                            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                                <div className="text-center text-white animate-pulse">
                                    <div className="text-6xl mb-2">⏱️</div>

                                    <h2 className="text-xl font-bold">
                                        {activeTimeoutTeam === "teamA"
                                            ? match.teamAName
                                            : match.teamBName} Timeout
                                    </h2>

                                    <p className={`
    font-bold mt-2 transition-all duration-300
    ${timeoutLeft <= 3
                                            ? "text-[120px] scale-150 text-red-500 animate-bounce"
                                            : timeoutLeft <= 5
                                                ? "text-8xl scale-125 text-red-400"
                                                : "text-6xl"}
`}>
                                        {timeoutLeft}s
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span>{match.teamAName}</span>
                            <span>Set {match.currentSet}</span>
                            <span>{match.teamBName}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                disabled={isScoringDisabled || timeoutLeft > 0}
                                onClick={() => updateScore("teamA")}
                                className={`px-6 py-3 rounded-lg text-white ${isScoringDisabled
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                    }`}
                            >
                                +1
                            </button>

                            <div className={`text-3xl font-bold ${scorePulse ? "scale-110 text-indigo-600" : ""}`}>
                                {sets[currentSetIndex - 1]?.teamA} :
                                {sets[currentSetIndex - 1]?.teamB}
                            </div>

                            <button
                                disabled={isScoringDisabled || timeoutLeft > 0}
                                onClick={() => updateScore("teamB")}
                                className={`px-6 py-3 rounded-lg text-white ${isScoringDisabled
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                    }`}
                            >
                                +1
                            </button>
                        </div>

                        {/* TIMEOUT */}
                        {/* <div className="flex gap-2 mt-2">
                            <button
                                disabled={match.status !== "live" || activeTimeout !== null}
                                onClick={() => startTimeout("teamA")}
                                className={`px-3 py-2 rounded-lg text-xs ${match.status !== "live" || activeTimeout
                                    ? "bg-gray-300 cursor-not-allowed flex-1 py-2 rounded font-bold"
                                    : "bg-orange-500 text-white flex-1 py-2 rounded font-bold"
                                    }`}
                            >
                                {timeout.team === "teamA" && timeout.remaining > 0
                                    ? `${timeout.remaining}s`
                                    : `${match.teamAName} ⏱`}
                            </button>

                            <button
                                disabled={match.status !== "live" || activeTimeout !== null}
                                onClick={() => startTimeout("teamB")}
                                className={`px-3 py-2 rounded-lg text-xs ${match.status !== "live" || activeTimeout
                                    ? "bg-gray-300 cursor-not-allowed flex-1 py-2 rounded font-bold"
                                    : "bg-orange-500 text-white flex-1 py-2 rounded font-bold"
                                    }`}
                            >
                                {timeout.team === "teamB" && timeout.remaining > 0
                                    ? `${timeout.remaining}s`
                                    : `${match.teamBName} ⏱`}
                            </button>
                        </div> */}
                    </div>
                </>
            )}

            {match.status === "live" && (
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => startTimeout("teamA")}
                        disabled={timeoutLeft > 0}
                        className="flex-1 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        {match.teamAName} Timeout
                    </button>

                    <button
                        onClick={() => startTimeout("teamB")}
                        disabled={timeoutLeft > 0}
                        className="flex-1 py-2 bg-purple-500 text-white rounded-lg"
                    >
                        {match.teamBName} Timeout
                    </button>
                </div>
            )}

            {match.status === "live" && (
                <>
                    <button onClick={undoLastPoint} className="w-full bg-yellow-500 text-white py-2 rounded">Undo Last Point</button>
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