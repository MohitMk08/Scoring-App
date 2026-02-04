import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useParams } from "react-router-dom";
import KnockoutMatchCard from "./KnockoutMatchCard";

export default function KnockoutMatchList() {
    const { tournamentId } = useParams();
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, "tournaments", tournamentId, "knockoutMatches"),
            snap => {
                setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        );

        return () => unsub();
    }, [tournamentId]);

    return (
        <div>
            <h2>Knockout Matches</h2>

            {matches.map(match => (
                <KnockoutMatchCard
                    key={match.id}
                    match={match}
                    tournamentId={tournamentId}
                />
            ))}
        </div>
    );
}
