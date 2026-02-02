import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";

import OngoingTournamentView from "../../components/tournaments/OngoingTournamentView";
import UpcomingTournamentView from "../../components/tournaments/UpcomingTournamentView";
import CompletedTournamentView from "../../components/tournaments/CompletedTournamentView";

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

    // 🔹 Fetch teams linked to tournament
    useEffect(() => {
        if (!id) return;

        const q = query(
            collection(db, "teams"),
            where("tournamentId", "==", id)
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));
            setTeams(data);
        });

        return () => unsub();
    }, [id]);

    // ✅ FIX: Auto-sync tournament status (upcoming / ongoing / completed)
    useEffect(() => {
        if (!tournament?.startDate || !tournament?.endDate) return;

        const now = new Date();
        const start = tournament.startDate.toDate();
        const end = tournament.endDate.toDate();

        let newStatus = tournament.status;

        if (now < start) newStatus = "upcoming";
        else if (now >= start && now <= end) newStatus = "ongoing";
        else if (now > end) newStatus = "completed";

        // Update only if status actually changed
        if (newStatus !== tournament.status) {
            updateDoc(doc(db, "tournaments", tournament.id), {
                status: newStatus,
            });
        }
    }, [tournament]);

    if (loading) return <p className="p-4">Loading...</p>;
    if (!tournament) return <p className="p-4">Tournament not found</p>;

    return (
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
            <DashboardLayout>
                {/* Header */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h1 className="text-xl font-semibold">{tournament.name}</h1>

                    <p className="text-sm text-gray-500 mt-1">
                        Status:{" "}
                        <span className="capitalize font-medium">
                            {tournament.status}
                        </span>
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                        Participating Teams: {teams.length}
                    </p>
                </div>

                {/* Views */}
                {tournament.status === "upcoming" && (
                    <UpcomingTournamentView
                        tournament={tournament}
                        teams={teams}
                    />
                )}

                {tournament.status === "ongoing" && (
                    <OngoingTournamentView
                        tournament={tournament}
                        teams={teams}
                    />
                )}

                {tournament.status === "completed" && (
                    <CompletedTournamentView tournament={tournament} />
                )}
            </DashboardLayout>
        </div>
    );
};

export default TournamentDetailsPage;
