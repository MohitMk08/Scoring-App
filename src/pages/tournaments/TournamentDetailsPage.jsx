import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    doc,
    addDoc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    orderBy,
    getDocs,
    Timestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import { createMatches } from "../../utils/createMatches";
import toast from "react-hot-toast";
import { deleteDoc } from "firebase/firestore";

import OngoingTournamentView from "../../components/tournaments/OngoingTournamentView";
import UpcomingTournamentView from "../../components/tournaments/UpcomingTournamentView";
import CompletedTournamentView from "../../components/tournaments/CompletedTournamentView";
import TournamentLeaderboard from "../../components/tournaments/TournamentLeaderboard";
import KnockoutBracket from "../../components/tournaments/KnockoutBracket";


const TournamentDetailsPage = () => {
    const { id } = useParams();
    const { id: tournamentId } = useParams();
    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamCount, setTeamCount] = useState(0);
    const [matches, setMatches] = useState([]);
    const [knockoutGenerated, setKnockoutGenerated] = useState(false);
    const [leagueCompleted, setLeagueCompleted] = useState(false);

    const leagueMatches = matches.filter(
        (m) => !m.round || m.round === "league"
    );

    const knockoutMatches = matches.filter(
        (m) =>
            m.round === "semifinal" ||
            m.round === "final" ||
            m.round === "third_place"
    );

    const generateKnockoutMatches = async () => {

        // 1️⃣ Get leaderboard
        const q = query(
            collection(db, "teamStats"),
            where("tournamentId", "==", tournamentId),
            orderBy("points", "desc")
        );

        const snap = await getDocs(q);

        const teams = snap.docs.map(doc => doc.data());

        if (teams.length < 4) {
            alert("Minimum 4 teams required");
            return;
        }

        // 2️⃣ Select Top 4 teams
        const top4 = teams.slice(0, 4);

        const sf1A = top4[0];
        const sf1B = top4[3];

        const sf2A = top4[1];
        const sf2B = top4[2];

        const checkQuery = query(
            collection(db, "matches"),
            where("tournamentId", "==", tournamentId),
            where("round", "==", "semifinal")
        );

        const checkSnap = await getDocs(checkQuery);

        if (!checkSnap.empty) {
            alert("Knockout already generated");
            return;
        }

        // 3️⃣ Create SEMIFINAL 1
        await addDoc(collection(db, "matches"), {
            tournamentId,
            round: "semifinal",
            matchNumber: 1,

            teamAId: sf1A.teamId,
            teamAName: sf1A.teamName,

            teamBId: sf1B.teamId,
            teamBName: sf1B.teamName,

            status: "upcoming",
            sets: [],
            currentSet: 1,
            totalSets: 3,

            createdAt: Timestamp.now()
        });

        // 4️⃣ Create SEMIFINAL 2
        await addDoc(collection(db, "matches"), {
            tournamentId,
            round: "semifinal",
            matchNumber: 2,

            teamAId: sf2A.teamId,
            teamAName: sf2A.teamName,

            teamBId: sf2B.teamId,
            teamBName: sf2B.teamName,

            status: "upcoming",
            sets: [],
            currentSet: 1,
            totalSets: 3,

            createdAt: Timestamp.now()
        });

        alert("Semifinals generated successfully");
    };

    const getRoundLabel = (match) => {
        if (match.round === "semifinal") {
            return `Semifinal ${match.matchNumber}`;
        }

        if (match.round === "final") {
            return "Final";
        }

        if (match.round === "third_place") {
            return "3rd Place Match";
        }

        return "";
    };
    // undo knockout
    const undoKnockoutMatches = async () => {

        const q = query(
            collection(db, "matches"),
            where("tournamentId", "==", tournamentId),
            where("round", "in", ["semifinal", "final", "third_place"])
        );

        const snap = await getDocs(q);

        for (const docItem of snap.docs) {
            await deleteDoc(doc(db, "matches", docItem.id));
        }

        alert("Knockout matches removed");
    };

    // 🔹 Generate league matches (SINGLE SOURCE)
    const handleGenerateLeagueMatches = async () => {
        if (teams.length < 2) {
            toast.error("Add at least 2 teams");
            return;
        }

        if (tournament.leagueLocked) {
            toast.error("League matches already generated");
            return;
        }

        try {
            await createMatches(
                tournament.id,
                teams,
                tournament.format
            );

            for (const team of teams) {
                await addDoc(collection(db, "teamStats"), {
                    tournamentId: tournament.id,
                    teamId: team.id,
                    teamName: team.name,
                    played: 0,
                    wins: 0,
                    losses: 0,
                    points: 0,
                });
            }

            await updateDoc(doc(db, "tournaments", tournament.id), {
                leagueLocked: true,
                status: "ongoing",
            });

            toast.success("League matches generated successfully");
        } catch (err) {
            console.error("LEAGUE ERROR:", err);
            toast.error("League generation failed — check console");
        }
    };

    // 🔹 Fetch tournament
    useEffect(() => {
        const unsub = onSnapshot(doc(db, "tournaments", id), (snap) => {
            if (snap.exists()) {
                setTournament({ id: snap.id, ...snap.data() });
                setLoading(false);
            }
        });

        return () => unsub();
    }, [id]);

    // 🔹 Fetch teams
    useEffect(() => {
        if (!id) return;

        const q = query(
            collection(db, "teams"),
            where("tournamentId", "==", id)
        );

        const unsub = onSnapshot(q, (snap) => {
            setTeams(
                snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }))
            );
        });

        return () => unsub();
    }, [id]);

    // 🔹 Fetch team count (from stats)
    useEffect(() => {
        if (!id) return;

        const q = query(
            collection(db, "teamStats"),
            where("tournamentId", "==", id)
        );

        const unsub = onSnapshot(q, (snap) => {
            setTeamCount(snap.size);
        });

        return () => unsub();
    }, [id]);

    // 🔹 Fetch matches
    useEffect(() => {
        if (!id) return;

        const q = query(
            collection(db, "matches"),
            where("tournamentId", "==", id)
        );

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            setMatches(list);

            // check if knockout exists
            const hasKnockout = list.some(
                m =>
                    m.round === "semifinal" ||
                    m.round === "final" ||
                    m.round === "third_place"
            );

            setKnockoutGenerated(hasKnockout);

            // check league completion
            const league = list.filter(
                m => !m.round || m.round === "league"
            );

            if (league.length > 0) {
                const completed = league.every(
                    m => m.status === "finished"
                );

                setLeagueCompleted(completed);
            }
        });

        return () => unsub();
    }, [id]);

    useEffect(() => {

        const createFinals = async () => {

            const semis = matches.filter(
                m => m.round === "semifinal"
            );

            if (semis.length !== 2) return;

            const finished = semis.every(
                m => m.status === "finished"
            );

            if (!finished) return;

            const finalExists = matches.some(
                m => m.round === "final"
            );

            if (finalExists) return;

            const sf1 = semis.find(m => m.matchNumber === 1);
            const sf2 = semis.find(m => m.matchNumber === 2);

            const winner1 =
                sf1.winnerTeamId === sf1.teamAId
                    ? { id: sf1.teamAId, name: sf1.teamAName }
                    : { id: sf1.teamBId, name: sf1.teamBName };

            const loser1 =
                sf1.winnerTeamId === sf1.teamAId
                    ? { id: sf1.teamBId, name: sf1.teamBName }
                    : { id: sf1.teamAId, name: sf1.teamAName };

            const winner2 =
                sf2.winnerTeamId === sf2.teamAId
                    ? { id: sf2.teamAId, name: sf2.teamAName }
                    : { id: sf2.teamBId, name: sf2.teamBName };

            const loser2 =
                sf2.winnerTeamId === sf2.teamAId
                    ? { id: sf2.teamBId, name: sf2.teamBName }
                    : { id: sf2.teamAId, name: sf2.teamAName };

            // FINAL
            await addDoc(collection(db, "matches"), {
                tournamentId,
                round: "final",

                teamAId: winner1.id,
                teamAName: winner1.name,

                teamBId: winner2.id,
                teamBName: winner2.name,

                status: "upcoming",
                sets: [],
                currentSet: 1,
                totalSets: 3,
                createdAt: Timestamp.now()
            });

            // THIRD PLACE
            await addDoc(collection(db, "matches"), {
                tournamentId,
                round: "third_place",

                teamAId: loser1.id,
                teamAName: loser1.name,

                teamBId: loser2.id,
                teamBName: loser2.name,

                status: "upcoming",
                sets: [],
                currentSet: 1,
                totalSets: 3,
                createdAt: Timestamp.now()
            });

            toast.success("Final & 3rd place created");

        };

        createFinals();

    }, [matches]);

    // const knockoutMatches = matches.filter(
    //     (m) =>
    //         m.round === "semifinal" ||
    //         m.round === "final" ||
    //         m.round === "third_place"
    // );

    if (loading) {
        return (

            <p className="p-4">Loading tournament...</p>

        );
    }

    if (!tournament) {
        return (

            <p className="p-4">Tournament not found</p>

        );
    }

    const status = tournament.status || "upcoming";

    return (

        <div className="p-4 space-y-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <h1 className="text-xl font-bold">
                    {tournament.name}
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                    Status:{" "}
                    <span className="capitalize font-semibold text-red-600">
                        {status}
                    </span>
                </p>

                <p className="text-sm text-gray-500 mt-1">
                    Format:{" "}
                    <span className="capitalize font-semibold text-red-600">
                        {tournament.format}
                    </span>
                </p>

                <p className="text-sm text-gray-500 mt-1">
                    Participating Teams:{" "}
                    {tournament.leagueLocked ? teamCount : teams.length}
                </p>

                {status !== "completed" && !tournament.leagueLocked && (
                    <button
                        onClick={handleGenerateLeagueMatches}
                        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded"
                    >
                        Generate League Matches
                    </button>
                )}
            </div>

            {/* Views */}
            {status === "upcoming" && (
                <UpcomingTournamentView
                    tournament={tournament}
                    teams={teams}
                />
            )}

            {status === "ongoing" && (
                <>
                    <TournamentLeaderboard tournamentId={id} />
                    <OngoingTournamentView
                        tournament={{ ...tournament, status }}
                        teams={teams}
                        matches={leagueMatches}
                    />
                    <button
                        onClick={generateKnockoutMatches}
                        disabled={!leagueCompleted || knockoutGenerated}
                        className={`px-4 py-2 mr-2 rounded-lg text-white
    ${!leagueCompleted || knockoutGenerated
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-purple-600"
                            }`}
                    >
                        Generate Knockout Stage
                    </button>
                    <button
                        onClick={undoKnockoutMatches}
                        disabled={!knockoutGenerated}
                        className={`px-4 py-2 rounded-lg text-white
    ${!knockoutGenerated
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-red-500"
                            }`}
                    >
                        Undo Knockout
                    </button>

                    {/* knockout matches ui */}

                    {knockoutMatches.length > 0 && (
                        <KnockoutBracket matches={knockoutMatches} />
                    )}
                </>
            )}

            {status === "completed" && (
                <CompletedTournamentView tournament={tournament} />
            )}
        </div>

    );
};

export default TournamentDetailsPage;
