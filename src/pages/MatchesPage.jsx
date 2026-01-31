import { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import MatchForm from "../components/MatchForm";
import MatchLive from "../components/MatchLive";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function MatchesPage() {
    const [teams, setTeams] = useState([]);
    const [matchId, setMatchId] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "teams"), (snapshot) => {
            const map = {};
            snapshot.docs.forEach(doc => map[doc.id] = doc.data());
            setTeams(map);
        });
        return () => unsub();
    }, []);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {!matchId && <MatchForm onMatchCreated={setMatchId} />}
                {matchId && <MatchLive matchId={matchId} teamsMap={teams} />}
            </div>
        </DashboardLayout>
    );
}
