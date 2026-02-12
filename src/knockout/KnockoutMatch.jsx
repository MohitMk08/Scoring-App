import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-hot-toast";

export default function KnockoutMatch({ match, tournamentId }) {
    const finishMatch = async () => {
        try {
            if (
                match.scoreA === null ||
                match.scoreB === null ||
                !match.teamA ||
                !match.teamB
            ) {
                toast.error("Scores and teams must be set before finishing");
                return;
            }

            const winner =
                match.scoreA > match.scoreB ? match.teamA : match.teamB;
            const loser =
                match.scoreA > match.scoreB ? match.teamB : match.teamA;

            await updateDoc(
                doc(db, "tournaments", tournamentId, "knockoutMatches", match.id),
                {
                    winnerTeamId: winner.id,
                    loserTeamId: loser.id,
                    status: "completed",
                }
            );

            toast.success("Knockout match finished");
        } catch (err) {
            console.error(err);
            toast.error("Failed to finish match");
        }
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
