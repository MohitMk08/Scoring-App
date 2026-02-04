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

export default function KnockoutAdmin() {
    const { tournamentId } = useParams();

    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);

    // 1️⃣ Load teams (from league or teams collection)
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

    // 3️⃣ Create empty match
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
        alert("Knockout match created");
    };

    // 4️⃣ Assign team
    const assignTeam = async (matchId, side, teamId) => {
        const team = teams.find(t => t.id === teamId);

        await updateDoc(
            doc(db, "tournaments", tournamentId, "knockoutMatches", matchId),
            {
                [side]: {
                    id: team.id,
                    name: team.name
                }
            }
        );
    };

    const enableKnockout = async () => {
        await updateDoc(doc(db, "tournaments", tournamentId), {
            knockoutEnabled: true,
            leagueLocked: true
        });

        alert("Knockout enabled & league locked");
    };

    return (
        <div>
            <h2>Knockout Admin</h2>

            <button onClick={enableKnockout}>
                Enable Knockout Stage
            </button>


            <button onClick={createMatch}>
                ➕ Create Knockout Match
            </button>

            {matches.map(match => (
                <div key={match.id} style={{ marginTop: 20 }}>
                    <h4>Match</h4>

                    <select
                        onChange={e =>
                            assignTeam(match.id, "teamA", e.target.value)
                        }
                    >
                        <option>Select Team A</option>
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
                    >
                        <option>Select Team B</option>
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
