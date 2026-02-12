import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function KnockoutAdmin() {
    const { tournamentId } = useParams();

    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);

    // 1️⃣ Load teams (from tournament subcollection)
    useEffect(() => {
        const loadTeams = async () => {
            const snap = await getDocs(
                collection(db, "tournaments", tournamentId, "teams")
            );
            setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };

        loadTeams();
    }, [tournamentId]);

    // 2️⃣ Load knockout matches
    useEffect(() => {
        const loadMatches = async () => {
            const snap = await getDocs(
                collection(db, "tournaments", tournamentId, "knockoutMatches")
            );
            setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };

        loadMatches();
    }, [tournamentId]);

    // 3️⃣ Create empty knockout match
    const createMatch = async () => {
        await addDoc(
            collection(db, "tournaments", tournamentId, "knockoutMatches"),
            {
                teamA: null,
                teamB: null,
                scoreA: null,
                scoreB: null,
                status: "scheduled"
            }
        );

        toast.success("Knockout match created");
    };

    // 4️⃣ Assign team to match
    const assignTeam = async (matchId, side, teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        await updateDoc(
            doc(db, "tournaments", tournamentId, "knockoutMatches", matchId),
            {
                [side]: {
                    id: team.id,
                    name: team.name
                }
            }
        );

        toast.success(`Assigned ${team.name}`);
    };

    // 5️⃣ Enable knockout stage
    const enableKnockout = async () => {
        await updateDoc(doc(db, "tournaments", tournamentId), {
            knockoutEnabled: true,
            leagueLocked: true
        });

        toast.success("Knockout enabled & league locked");
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Knockout Admin</h2>

            <button
                onClick={enableKnockout}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
                Enable Knockout Stage
            </button>

            <button
                onClick={createMatch}
                className="bg-green-600 text-white px-4 py-2 rounded"
            >
                ➕ Create Knockout Match
            </button>

            {matches.map(match => (
                <div key={match.id} className="border rounded p-3 space-y-2">
                    <h4 className="font-medium">Match</h4>

                    <select
                        onChange={e =>
                            assignTeam(match.id, "teamA", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="">Select Team A</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>

                    <select
                        onChange={e =>
                            assignTeam(match.id, "teamB", e.target.value)
                        }
                        className="border rounded px-2 py-1 w-full"
                    >
                        <option value="">Select Team B</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    );
}
