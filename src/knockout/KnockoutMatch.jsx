import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function KnockoutMatch({ match, tournamentId }) {
    const finishMatch = async () => {
        const winner =
            match.scoreA > match.scoreB ? match.teamA : match.teamB;
        const loser =
            match.scoreA > match.scoreB ? match.teamB : match.teamA;

        await updateDoc(
            doc(db, "tournaments", tournamentId, "knockoutMatches", match.id),
            {
                winnerTeamId: winner.id,
                loserTeamId: loser.id,
                status: "completed"
            }
        );

        alert("Match finished");
    };

    return (
        <div>
            <h3>
                {match.teamA?.name} vs {match.teamB?.name}
            </h3>
            <button onClick={finishMatch}>Finish Match</button>
        </div>
    );
}
