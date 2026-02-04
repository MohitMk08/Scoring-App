import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function KnockoutMatchCard({ match, tournamentId }) {
    const [scoreA, setScoreA] = useState("");
    const [scoreB, setScoreB] = useState("");

    const finishMatch = async () => {
        const winner =
            Number(scoreA) > Number(scoreB) ? match.teamA : match.teamB;
        const loser =
            Number(scoreA) > Number(scoreB) ? match.teamB : match.teamA;

        await updateDoc(
            doc(db, "tournaments", tournamentId, "knockoutMatches", match.id),
            {
                scoreA: Number(scoreA),
                scoreB: Number(scoreB),
                winnerTeamId: winner.id,
                loserTeamId: loser.id,
                status: "completed"
            }
        );
    };

    return (
        <div style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
            <h4>
                {match.teamA?.name} vs {match.teamB?.name}
            </h4>

            <input
                type="number"
                placeholder="Score A"
                onChange={e => setScoreA(e.target.value)}
            />
            <input
                type="number"
                placeholder="Score B"
                onChange={e => setScoreB(e.target.value)}
            />

            <button onClick={finishMatch}>Finish Match</button>
        </div>
    );
}
