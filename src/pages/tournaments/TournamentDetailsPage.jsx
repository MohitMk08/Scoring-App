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

const TournamentDetailsPage = () => {
    const { id } = useParams();

    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch tournament
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

    // Fetch teams linked to tournament
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

    if (loading) return <p className="p-4">Loading...</p>;
    if (!tournament) return <p className="p-4">Tournament not found</p>;

    return (
        <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                            {tournament.name}
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">
                            Participating Teams:{" "}
                            <span className="font-medium text-gray-800">
                                {teams.length}
                            </span>
                        </p>
                    </div>

                    {/* Status Badge */}
                    <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize
              ${tournament.status === "ongoing"
                                ? "bg-emerald-100 text-emerald-700"
                                : tournament.status === "upcoming"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-200 text-gray-700"
                            }
            `}
                    >
                        {tournament.status}
                    </span>
                </div>
            </div>

            {/* Views */}
            <div className="space-y-4">
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
            </div>
        </div>
    );
};

export default TournamentDetailsPage;
