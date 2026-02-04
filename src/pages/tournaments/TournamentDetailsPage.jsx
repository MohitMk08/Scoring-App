import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";

import OngoingTournamentView from "../../components/tournaments/OngoingTournamentView";
import UpcomingTournamentView from "../../components/tournaments/UpcomingTournamentView";
import CompletedTournamentView from "../../components/tournaments/CompletedTournamentView";
import TournamentLeaderboard from "../../components/tournaments/TournamentLeaderboard";

import DashboardLayout from "../../layout/DashboardLayout";

const TournamentDetailsPage = () => {
    const { id } = useParams();

    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Fetch tournament
    useEffect(() => {
        const fetchTournament = async () => {
            const snap = await getDoc(doc(db, "tournaments", id));
            if (snap.exists()) {
                setTournament({ id: snap.id, ...snap.data() });
            }
            setLoading(false);
        };

        fetchTournament();
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

    if (loading) {
        return (
            <DashboardLayout>
                <p className="p-4">Loading tournament...</p>
            </DashboardLayout>
        );
    }

    if (!tournament) {
        return (
            <DashboardLayout>
                <p className="p-4">Tournament not found</p>
            </DashboardLayout>
        );
    }

    // ✅ SINGLE SOURCE OF TRUTH (CRITICAL FIX)
    const startDate = tournament.startDate?.toDate();
    const endDate = tournament.endDate?.toDate();
    const now = new Date();

    let derivedStatus = "upcoming";
    if (tournament.isCompleted) derivedStatus = "completed";
    else if (startDate && endDate && startDate <= now && endDate >= now)
        derivedStatus = "ongoing";

    return (
        <DashboardLayout>
            <div className="p-4 space-y-4 max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h1 className="text-xl font-semibold">
                        {tournament.name}
                    </h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Status:{" "}
                        <span className="capitalize font-medium">
                            {derivedStatus}
                        </span>
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                        Participating Teams: {teams.length}
                    </p>
                </div>
                {/* Tournamnent Leaderboard view */}
                {derivedStatus === "ongoing" && (
                    <>
                        <TournamentLeaderboard tournamentId={id} />

                        <OngoingTournamentView
                            tournament={{ ...tournament, status: "ongoing" }}
                            teams={teams}
                        />
                    </>
                )}


                {/* Views */}
                {derivedStatus === "upcoming" && (
                    <UpcomingTournamentView
                        tournament={tournament}
                        teams={teams}
                    />
                )}

                {derivedStatus === "ongoing" && (
                    <OngoingTournamentView
                        tournament={{ ...tournament, status: "ongoing" }}
                        teams={teams}
                    />
                )}

                {derivedStatus === "completed" && (
                    <CompletedTournamentView
                        tournament={tournament}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default TournamentDetailsPage;
