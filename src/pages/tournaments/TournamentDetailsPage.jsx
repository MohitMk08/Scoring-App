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
} from "firebase/firestore";
import { db } from "../../firebase";
import { createMatches } from "../../utils/createMatches";
import toast from "react-hot-toast";

import OngoingTournamentView from "../../components/tournaments/OngoingTournamentView";
import UpcomingTournamentView from "../../components/tournaments/UpcomingTournamentView";
import CompletedTournamentView from "../../components/tournaments/CompletedTournamentView";
import TournamentLeaderboard from "../../components/tournaments/TournamentLeaderboard";


const TournamentDetailsPage = () => {
    const { id } = useParams();

    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teamCount, setTeamCount] = useState(0);

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
                    />
                </>
            )}

            {status === "completed" && (
                <CompletedTournamentView tournament={tournament} />
            )}
        </div>

    );
};

export default TournamentDetailsPage;
